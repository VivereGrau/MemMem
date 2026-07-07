import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';

import { getManifest, saveManifest, ManifestEntry, generateUUID } from '@/utils/storage';
import { VocabCard } from '@/components/vocab-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function HomeScreen() {
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchManifest = async () => {
        const data = await getManifest();
        if (isActive) {
          setManifest(data);
        }
      };
      fetchManifest();
      return () => { isActive = false; };
    }, [])
  );

  const handleCreateSet = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the vocabulary set.');
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
    setNewTitle('');
    
    // Auto navigate to the newly created set
    router.push(`/vocab/${newId}` as any);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
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
        Alert.alert('Invalid File', 'The imported file must contain an array of vocabulary words.');
        return;
      }

      const newId = generateUUID();
      const fileName = `set_${newId}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Save imported file
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(parsedData, null, 2));

      const newEntry: ManifestEntry = {
        id: newId,
        title: asset.name.replace('.json', '') || 'Imported Set',
        fileName: fileName,
        totalWords: parsedData.length,
        updatedAt: new Date().toISOString(),
      };

      const updatedManifest = [...manifest, newEntry];
      await saveManifest(updatedManifest);
      setManifest(updatedManifest);
      
      Alert.alert('Success', `Imported ${parsedData.length} words successfully!`);
    } catch (error) {
      console.error(error);
      Alert.alert('Import Failed', 'There was an error reading the selected file.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Vocab Sets</ThemedText>
        <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
          <Ionicons name="cloud-download-outline" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={manifest}
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Create Set Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Create New Set</ThemedText>
            
            <TextInput
              style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ccc' }]}
              placeholder="e.g. JLPT N3 Verbs"
              placeholderTextColor={isDark ? '#888' : '#aaa'}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setModalVisible(false);
                setNewTitle('');
              }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateSet}>
                <Text style={styles.createBtnText}>Create</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: Spacing.four,
    paddingBottom: 100,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 64,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#0274DF',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0274DF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  createBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#0274DF',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
