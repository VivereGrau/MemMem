import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { VocabCard } from "@/components/vocab-card";
import { WordItem } from "@/components/word-item";
import { Spacing } from "@/constants/theme";
import {
  generateUUID,
  getManifest,
  getVocabSet,
  ManifestEntry,
  saveManifest,
  VocabEntry,
} from "@/utils/storage";
import { useColorScheme } from "react-native";

interface GlobalWord extends VocabEntry {
  setId: string;
  setTitle: string;
}

export default function HomeScreen() {
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [allWords, setAllWords] = useState<GlobalWord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isImportModalVisible, setImportModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importFileData, setImportFileData] = useState<any>(null);
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchManifest = async () => {
        const data = await getManifest();
        if (isActive) {
          setManifest(data);
        }

        try {
          const globalWordsList: GlobalWord[] = [];
          for (const m of data) {
            const setWords = await getVocabSet(m.fileName);
            for (const w of setWords) {
              globalWordsList.push({ ...w, setId: m.id, setTitle: m.title });
            }
          }
          if (isActive) {
            setAllWords(globalWordsList);
          }
        } catch (e) {
          console.error("Error fetching global words:", e);
        }
      };
      fetchManifest();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleCreateSet = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a title for the vocabulary set.");
      return;
    }
    const newId = generateUUID();
    const fileName = `set_${newId}.json`;

    // Create new empty set file
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify([]));

    const newEntry: ManifestEntry = {
      id: newId,
      title: newTitle.trim(),
      fileName: fileName,
      totalWords: 0,
      updatedAt: new Date().toISOString(),
    };

    const updatedManifest = [...manifest, newEntry];
    await saveManifest(updatedManifest);
    setManifest(updatedManifest);
    setModalVisible(false);
    setNewTitle("");

    // Auto navigate to the newly created set
    router.push(`/vocab/${newId}` as any);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const parsedData = JSON.parse(content);

      // Basic validation
      if (!Array.isArray(parsedData)) {
        Alert.alert(
          "Invalid File",
          "The imported file must contain an array of vocabulary words.",
        );
        return;
      }

      const defaultTitle = (asset.name.replace(".json", "") || "Imported Set").replace(/_/g, " ");

      const isDuplicate = manifest.some(
        (m) => m.title.toLowerCase() === defaultTitle.toLowerCase()
      );

      if (isDuplicate) {
        setImportTitle(defaultTitle);
        setImportFileData(parsedData);
        setImportModalVisible(true);
      } else {
        await executeImport(defaultTitle, parsedData);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Import Failed",
        "There was an error reading the selected file.",
      );
    }
  };

  const executeImport = async (title: string, data: any[]) => {
    try {
      const newId = generateUUID();
      const fileName = `set_${newId}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Save imported file
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2),
      );

      const newEntry: ManifestEntry = {
        id: newId,
        title: title.trim(),
        fileName: fileName,
        totalWords: data.length,
        updatedAt: new Date().toISOString(),
      };

      const updatedManifest = [...manifest, newEntry];
      await saveManifest(updatedManifest);
      setManifest(updatedManifest);
      setImportModalVisible(false);
      setImportTitle("");
      setImportFileData(null);

      Alert.alert(
        "Success",
        `Imported ${data.length} words successfully!`,
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Import Failed",
        "There was an error saving the imported data.",
      );
    }
  };

  const handleConfirmImport = () => {
    const trimmed = importTitle.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter a valid name.");
      return;
    }
    const isDuplicate = manifest.some(
      (m) => m.title.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      Alert.alert("Duplicate Name", "This name already exists. Please choose a different one.");
      return;
    }
    executeImport(trimmed, importFileData);
  };

  const getSortedManifest = () => {
    return [...manifest].sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
  };

  const getSortedWords = () => {
    const filtered = allWords.filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.word.toLowerCase().includes(query) ||
        (item.reading && item.reading.toLowerCase().includes(query)) ||
        item.meaning.toLowerCase().includes(query)
      );
    });
    // For global search, we just reverse the array based on sortOrder
    return sortOrder === "newest" ? filtered : [...filtered].reverse();
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#f5f5f5" },
      ]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Collections
        </ThemedText>
        <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
          <Ionicons
            name="cloud-download-outline"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      {/* Global Search Bar & Sort */}
      <View style={styles.searchRow}>
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
            placeholder="Search all vocabulary..."
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

        <TouchableOpacity
          style={[
            styles.sortBtn,
            { backgroundColor: isDark ? "#1C1C1E" : "#E5E5EA", flexDirection: "row", gap: 4 },
          ]}
          onPress={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={sortOrder === "oldest" ? "#0274DF" : (isDark ? "#555" : "#CCC")}
          />
          <Ionicons
            name="arrow-down"
            size={18}
            color={sortOrder === "newest" ? "#0274DF" : (isDark ? "#555" : "#CCC")}
          />
        </TouchableOpacity>
      </View>

      {searchQuery.length > 0 ? (
        <FlatList
          data={getSortedWords()}
          keyExtractor={(item) => item.id + item.setId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <WordItem
              id={item.id}
              word={item.word}
              reading={item.reading}
              meaning={item.meaning}
              wordType={item.wordType}
              source={item.source}
              badgeText={item.setTitle}
              onPress={() => router.push(`/vocab/${item.setId}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText type="default" style={styles.emptyText}>
                No matches found across all sets.
              </ThemedText>
            </View>
          }
        />
      ) : (
        <FlatList
          data={getSortedManifest()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <VocabCard
              title={item.title}
              totalWords={item.totalWords}
              onPress={() => router.push(`/vocab/${item.id}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText type="default" style={styles.emptyText}>
                No vocabulary sets yet. Create one or import a JSON file.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Create Set Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Create New Set
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                {
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#333" : "#ccc",
                },
              ]}
              placeholder="e.g. JLPT N3 Verbs"
              placeholderTextColor={isDark ? "#888" : "#aaa"}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setNewTitle("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreateSet}
              >
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Rename Modal */}
      <Modal visible={isImportModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Rename Imported Set
            </ThemedText>
            <ThemedText style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>
              A set with this name already exists. Please choose a new name.
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                {
                  color: isDark ? "#fff" : "#000",
                  borderColor: isDark ? "#333" : "#ccc",
                },
              ]}
              placeholder="Imported Set Name"
              placeholderTextColor={isDark ? "#888" : "#aaa"}
              value={importTitle}
              onChangeText={setImportTitle}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setImportModalVisible(false);
                  setImportTitle("");
                  setImportFileData(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleConfirmImport}
              >
                <Text style={styles.createBtnText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
  },
  importBtn: {
    padding: 8,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 100,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sortBtn: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 64,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
  },
  fab: {
    position: "absolute",
    bottom: 54,
    right: 24,
    backgroundColor: "#0274DF",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0274DF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  createBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#0274DF",
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
