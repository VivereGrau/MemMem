import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { WordItem } from "@/components/word-item";
import { Spacing } from "@/constants/theme";
import {
  deleteVocabCategory,
  deleteVocabWord,
  generateUUID,
  getManifest,
  getVocabSet,
  saveManifest,
  saveVocabSet,
  updateVocabCategory,
  updateVocabWord,
  VocabEntry,
} from "@/utils/storage";

const PART_OF_SPEECH_OPTIONS = [
  "Noun (คำนาม)",
  "Verb G1 (กริยา กลุ่ม 1)",
  "Verb G2 (กริยา กลุ่ม 2)",
  "Verb G3 (กริยา กลุ่ม 3)",
  "i-Adj (คำวิเศษณ์ い)",
  "na-Adj (คำวิเศษณ์ な)",
  "Adverb (คำกริยาวิเศษณ์)",
  "Conjunction (คำสันธาน/คำเชื่อม)",
  "Pronoun (คำสรรพนาม)",
  "Counter (ลักษณนาม)",
  "Other (อื่นๆ)",
];

export default function VocabScreen() {
  const { id } = useLocalSearchParams();
  const setId = Array.isArray(id) ? id[0] : id; // Get the id param safely
  const router = useRouter();

  const [vocabData, setVocabData] = useState<VocabEntry[]>([]);
  const [setTitle, setSetTitle] = useState("Vocab Set");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCatModalVisible, setCatModalVisible] = useState(false);

  // Word Form State
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [word, setWord] = useState("");
  const [reading, setReading] = useState("");
  const [meaning, setMeaning] = useState("");
  const [wordType, setWordType] = useState(PART_OF_SPEECH_OPTIONS[0]);
  const [source, setSource] = useState("");

  // Category Edit State
  const [editTitle, setEditTitle] = useState("");

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const wordModalY = React.useRef(new Animated.Value(0)).current;

  const wordPanResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 8;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          wordModalY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Keyboard.dismiss();
          Animated.timing(wordModalY, {
            toValue: 800,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            setModalVisible(false);
            setTimeout(() => wordModalY.setValue(0), 100);
          });
        } else {
          Animated.spring(wordModalY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const catModalY = React.useRef(new Animated.Value(0)).current;

  const catPanResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 8;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          catModalY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Keyboard.dismiss();
          Animated.timing(catModalY, {
            toValue: 800,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            setCatModalVisible(false);
            setTimeout(() => catModalY.setValue(0), 100);
          });
        } else {
          Animated.spring(catModalY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const loadData = useCallback(async () => {
    const manifest = await getManifest();
    const setInfo = manifest.find((m) => m.id === setId);
    if (setInfo) {
      setSetTitle(setInfo.title);
      const data = await getVocabSet(setInfo.fileName);
      setVocabData(data);
    } else {
      Alert.alert("Error", "Set not found!");
      router.back();
    }
  }, [setId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ====================== CATEGORY EDIT MODE ======================

  const handleOpenCategoryEdit = () => {
    setEditTitle(setTitle);
    setCatModalVisible(true);
  };

  const handleUpdateCategory = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      Alert.alert("Validation Error", "Title cannot be empty.");
      return;
    }
    const res = await updateVocabCategory(setId, trimmed);
    if (res.success) {
      setSetTitle(trimmed);
      setCatModalVisible(false);
    } else {
      Alert.alert("Error", "Failed to update category title.");
    }
  };

  const handleDeleteCategory = () => {
    Alert.alert(
      "Delete Entire Category",
      `Are you sure you want to delete "${setTitle}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteVocabCategory(setId);
            if (res.success) {
              setCatModalVisible(false);
              router.back();
            } else {
              Alert.alert("Error", "Failed to delete category.");
            }
          },
        },
      ],
    );
  };

  // ====================== WORD EDIT MODE ======================

  const handleOpenWordAdd = () => {
    setEditingWordId(null);
    setIsViewMode(false);
    setWord("");
    setReading("");
    setMeaning("");
    setWordType(PART_OF_SPEECH_OPTIONS[0]);
    setSource("");
    setModalVisible(true);
  };

  const handleOpenWordDetails = (item: VocabEntry) => {
    setEditingWordId(item.id);
    setIsViewMode(true);
    setWord(item.word);
    setReading(item.reading);
    setMeaning(item.meaning);
    setWordType(item.wordType || PART_OF_SPEECH_OPTIONS[0]);
    setSource(item.source);
    setModalVisible(true);
  };

  const handleSaveWord = async () => {
    const trimmedWord = word.trim();
    if (!trimmedWord) {
      Alert.alert("Validation Error", "Please enter a vocabulary word.");
      return;
    }

    if (editingWordId) {
      // ===== UPDATE MODE =====
      // Check duplicate only if word changed
      const currentWordInState = vocabData.find((v) => v.id === editingWordId);
      if (currentWordInState && currentWordInState.word !== trimmedWord) {
        const isDuplicate = vocabData.some((v) => v.word === trimmedWord);
        if (isDuplicate) {
          Alert.alert(
            "Duplicate Found",
            `The word "${trimmedWord}" already exists in this set.`,
          );
          return;
        }
      }

      const res = await updateVocabWord(setId, editingWordId, {
        word: trimmedWord,
        reading: reading.trim(),
        meaning: meaning.trim(),
        wordType: wordType,
        source: source.trim(),
      });

      if (res.success) {
        setVocabData((prev) =>
          prev.map((item) =>
            item.id === editingWordId
              ? {
                  ...item,
                  word: trimmedWord,
                  reading: reading.trim(),
                  meaning: meaning.trim(),
                  wordType: wordType,
                  source: source.trim(),
                }
              : item,
          ),
        );
        setModalVisible(false);
      } else {
        Alert.alert("Error", "Failed to update word.");
      }
    } else {
      // ===== ADD MODE =====
      const isDuplicate = vocabData.some((v) => v.word === trimmedWord);
      if (isDuplicate) {
        Alert.alert(
          "Duplicate Found",
          `The word "${trimmedWord}" already exists in this set.`,
        );
        return;
      }

      const newEntry: VocabEntry = {
        id: generateUUID(),
        word: trimmedWord,
        reading: reading.trim(),
        meaning: meaning.trim(),
        wordType: wordType,
        source: source.trim(),
        timestamp: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const newData = [newEntry, ...vocabData];

      const fileName = `set_${setId}.json`;
      await saveVocabSet(fileName, newData);

      const manifest = await getManifest();
      const updatedManifest = manifest.map((m) =>
        m.id === setId
          ? {
              ...m,
              totalWords: newData.length,
              updatedAt: new Date().toISOString(),
            }
          : m,
      );
      await saveManifest(updatedManifest);

      setVocabData(newData);
      setModalVisible(false);
    }
  };

  const handleDeleteWord = (wordId: string) => {
    Alert.alert("Delete Word", "Are you sure you want to delete this word?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await deleteVocabWord(setId, wordId);
          if (res.success) {
            setVocabData((prev) => prev.filter((item) => item.id !== wordId));
            setModalVisible(false); // Also close the modal if deleted from edit screen
          } else {
            Alert.alert("Error", "Failed to delete word.");
          }
        },
      },
    ]);
  };

  // ====================== UTILS ======================

  const handleExport = async () => {
    const fileName = `set_${setId}.json`;
    const uri = `${FileSystem.documentDirectory}${fileName}`;

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Export Failed", "Sharing is not available on your device.");
      return;
    }

    try {
      await Sharing.shareAsync(uri, {
        mimeType: "application/json",
        dialogTitle: `Export ${setTitle}`,
      });
    } catch (error) {
      console.error("Error sharing file", error);
      Alert.alert(
        "Export Error",
        "An error occurred while trying to share the file.",
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#f5f5f5" },
      ]}
      edges={["top"]}
    >
      {/* Header Toolbar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <ThemedText
          type="subtitle"
          style={styles.headerTitle}
          numberOfLines={1}
        >
          {setTitle}
        </ThemedText>

        <View style={styles.headerRightActions}>
          {vocabData.length > 0 && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() =>
                router.push(`/vocab/practice?setId=${setId}` as any)
              }
            >
              <Ionicons
                name="play-circle-outline"
                size={30}
                color={isDark ? "#34C759" : "#34C759"}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerBtn} onPress={handleExport}>
            <Ionicons
              name="share-outline"
              size={28}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleOpenCategoryEdit}
          >
            <Ionicons name="pencil-outline" size={28} color="#0274DF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: isDark ? "#1C1C1E" : "#E5E5EA" },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color="#8E8E93"
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
          placeholder="Search vocabulary..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearSearchBtn}
          >
            <Ionicons name="close-circle" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Vocab List */}
      <FlatList
        data={vocabData.filter((item) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            item.word.toLowerCase().includes(query) ||
            (item.reading && item.reading.toLowerCase().includes(query)) ||
            item.meaning.toLowerCase().includes(query)
          );
        })}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <WordItem
            id={item.id}
            word={item.word}
            reading={item.reading}
            meaning={item.meaning}
            wordType={item.wordType}
            source={item.source}
            onPress={() => handleOpenWordDetails(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No words saved yet.
            </ThemedText>
            <ThemedText style={styles.emptyTextSub}>
              Tap the + button to add vocabulary!
            </ThemedText>
          </View>
        }
      />

      {/* FAB - Add Word */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleOpenWordAdd}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add / Edit Word Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setModalVisible(false);
          }}
        >
          <View style={styles.modalBackground}>
            <Animated.View
              style={[
                styles.modalContainer,
                { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
                {
                  transform: [
                    {
                      translateY: wordModalY.interpolate({
                        inputRange: [0, 800],
                        outputRange: [0, 800],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
              {...wordPanResponder.panHandlers}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  <View style={styles.dragHandle} />
                  {!isViewMode && (
                    <ThemedText type="subtitle" style={styles.modalTitle}>
                      {editingWordId ? "Edit Word" : "Add New Word"}
                    </ThemedText>
                  )}

                  {isViewMode ? (
                    <View style={styles.viewModeContainer}>
                      <ThemedText style={styles.viewWord}>{word}</ThemedText>

                      {!!wordType && (
                        <View
                          style={[
                            styles.viewTypeBadge,
                            { backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.viewTypeBadgeText,
                              { color: isDark ? "#E5E5EA" : "#48484A" },
                            ]}
                          >
                            {wordType.split(" ")[0]}
                          </Text>
                        </View>
                      )}

                      {!!reading && (
                        <ThemedText style={styles.viewReading}>
                          {reading}
                        </ThemedText>
                      )}

                      <ThemedText style={styles.viewMeaning}>
                        {meaning}
                      </ThemedText>

                      {!!source && (
                        <View style={styles.viewSourceBox}>
                          <ThemedText style={styles.viewSourceText}>
                            Note: {source}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: isDark ? "#fff" : "#000",
                            borderColor: isDark ? "#333" : "#ccc",
                          },
                        ]}
                        placeholder="Word / Kanji (e.g. 食べる)"
                        placeholderTextColor={isDark ? "#888" : "#aaa"}
                        value={word}
                        onChangeText={setWord}
                        autoFocus={!editingWordId}
                      />

                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: isDark ? "#fff" : "#000",
                            borderColor: isDark ? "#333" : "#ccc",
                          },
                        ]}
                        placeholder="Reading / Hiragana (e.g. たべる)"
                        placeholderTextColor={isDark ? "#888" : "#aaa"}
                        value={reading}
                        onChangeText={setReading}
                      />

                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: isDark ? "#fff" : "#000",
                            borderColor: isDark ? "#333" : "#ccc",
                          },
                        ]}
                        placeholder="Meaning (e.g. กิน)"
                        placeholderTextColor={isDark ? "#888" : "#aaa"}
                        value={meaning}
                        onChangeText={setMeaning}
                      />

                      <ThemedText type="default" style={styles.sectionLabel}>
                        Word Type
                      </ThemedText>
                      <View style={styles.chipsWrapper}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.chipsContainer}
                        >
                          {PART_OF_SPEECH_OPTIONS.map((opt) => {
                            const isSelected = wordType === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.chip,
                                  isSelected && styles.chipSelected,
                                ]}
                                onPress={() => setWordType(opt)}
                              >
                                <Text
                                  style={[
                                    styles.chipText,
                                    isSelected
                                      ? styles.chipTextSelected
                                      : { color: isDark ? "#ccc" : "#666" },
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: isDark ? "#fff" : "#000",
                            borderColor: isDark ? "#333" : "#ccc",
                          },
                        ]}
                        placeholder="Note (e.g. YouTube lesson 1)"
                        placeholderTextColor={isDark ? "#888" : "#aaa"}
                        value={source}
                        onChangeText={setSource}
                      />
                    </View>
                  )}

                  {/* Bottom Actions for Word Modal */}
                  <View
                    style={[
                      styles.modalActions,
                      editingWordId && !isViewMode
                        ? { justifyContent: "space-between" }
                        : { justifyContent: "flex-end" },
                    ]}
                  >
                    {editingWordId && !isViewMode ? (
                      <TouchableOpacity
                        style={styles.deleteModalBtn}
                        onPress={() => handleDeleteWord(editingWordId)}
                      >
                        <Ionicons name="trash" size={20} color="#FF3B30" />
                        <Text style={styles.deleteModalBtnText}>Delete</Text>
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}

                    {isViewMode ? (
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setModalVisible(false)}
                        >
                          <Text style={styles.cancelBtnText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.createBtn,
                            { backgroundColor: "#0274DF" },
                          ]}
                          onPress={() => setIsViewMode(false)}
                        >
                          <Text style={styles.createBtnText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => {
                            if (editingWordId) setIsViewMode(true);
                            else setModalVisible(false);
                          }}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.createBtn}
                          onPress={handleSaveWord}
                        >
                          <Text style={styles.createBtnText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        visible={isCatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCatModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setCatModalVisible(false);
          }}
        >
          <View style={[styles.modalBackground, { justifyContent: "center" }]}>
            <Animated.View
              style={[
                styles.modalContainer,
                styles.centerModalContainer,
                { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
                {
                  transform: [
                    {
                      translateY: catModalY.interpolate({
                        inputRange: [0, 800],
                        outputRange: [0, 800],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
              {...catPanResponder.panHandlers}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Edit Category
                  </ThemedText>

                  <View style={{ marginBottom: 24 }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: isDark ? "#fff" : "#000",
                          borderColor: isDark ? "#333" : "#ccc",
                          marginBottom: 0,
                        },
                      ]}
                      placeholder="Category Name"
                      placeholderTextColor={isDark ? "#888" : "#aaa"}
                      value={editTitle}
                      onChangeText={setEditTitle}
                    />
                  </View>

                  <View
                    style={[
                      styles.modalActions,
                      { justifyContent: "space-between" },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.deleteModalBtn}
                      onPress={handleDeleteCategory}
                    >
                      <Ionicons name="trash" size={20} color="#FF3B30" />
                      <Text style={styles.deleteModalBtnText}>Delete Set</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setCatModalVisible(false)}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.createBtn}
                        onPress={handleUpdateCategory}
                      >
                        <Text style={styles.createBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
    marginLeft: 8,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 120,
    paddingTop: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    opacity: 0.8,
  },
  emptyTextSub: {
    marginTop: 8,
    opacity: 0.5,
  },
  fab: {
    position: "absolute",
    bottom: 54,
    right: 24,
    backgroundColor: "#34C759", // Green for adding words
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end", // slide up from bottom
  },
  modalContainer: {
    width: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(150,150,150,0.3)",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
    marginTop: -8,
  },
  centerModalContainer: {
    width: "auto",
    borderRadius: 24,
    marginHorizontal: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  chipsWrapper: {
    height: 44,
    marginBottom: 16,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: "#0274DF",
    borderColor: "#0274DF",
  },
  chipText: {
    fontSize: 14,
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  createBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: "#34C759",
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    gap: 4,
  },
  deleteModalBtnText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  viewModeContainer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    minHeight: 280,
  },
  viewWord: {
    fontSize: 40,
    lineHeight: 52,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  viewTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  viewTypeBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  viewReading: {
    fontSize: 24,
    color: "#8E8E93",
    marginBottom: 16,
  },
  viewMeaning: {
    fontSize: 28,
    lineHeight: 42,
    fontWeight: "bold",
    color: "#0274DF",
    textAlign: "center",
    marginBottom: 40,
  },
  viewSourceBox: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C7C7CC",
    width: "100%",
    alignItems: "center",
  },
  viewSourceText: {
    color: "#8E8E93",
    fontSize: 14,
  },
});
