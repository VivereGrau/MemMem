import * as FileSystem from 'expo-file-system/legacy';

/**
 * Basic UUID v4 generator since React Native doesn't have crypto.randomUUID out of the box in some older engines.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sanitizes a file name to prevent path traversal attacks.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '');
}

const MANIFEST_FILE_NAME = 'manifest.json';
const MANIFEST_URI = `${FileSystem.documentDirectory}${MANIFEST_FILE_NAME}`;

export interface ManifestEntry {
  id: string;
  title: string;
  fileName: string; // e.g., set_1234.json
  totalWords: number;
  updatedAt: string; // ISO Date string
}

export interface VocabEntry {
  id: string;
  word: string; // Kanji/Vocab
  reading: string; // Hiragana
  meaning: string; // Thai meaning
  wordType?: string; // Part of Speech
  source: string; // e.g., YouTube Link or Video Title
  timestamp: string; // e.g., 12:45
}

/**
 * Ensures the manifest file exists. Creates an empty one if not.
 */
export async function initManifest(): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(MANIFEST_URI);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(MANIFEST_URI, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing manifest:', error);
    throw error;
  }
}

/**
 * Reads the manifest file.
 */
export async function getManifest(): Promise<ManifestEntry[]> {
  try {
    await initManifest(); // ensure it exists before reading
    const content = await FileSystem.readAsStringAsync(MANIFEST_URI);
    return JSON.parse(content) as ManifestEntry[];
  } catch (error) {
    console.error('Error reading manifest:', error);
    return [];
  }
}

/**
 * Saves data to the manifest file.
 */
export async function saveManifest(data: ManifestEntry[]): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(MANIFEST_URI, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving manifest:', error);
    throw error;
  }
}

/**
 * Reads a vocab set file.
 * @param fileName fileName of the vocab set (e.g. set_1234.json)
 */
export async function getVocabSet(fileName: string): Promise<VocabEntry[]> {
  const safeFileName = sanitizeFileName(fileName);
  const uri = `${FileSystem.documentDirectory}${safeFileName}`;
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      // Return empty array if file doesn't exist yet
      return [];
    }
    const content = await FileSystem.readAsStringAsync(uri);
    return JSON.parse(content) as VocabEntry[];
  } catch (error) {
    console.error(`Error reading vocab set ${fileName}:`, error);
    return [];
  }
}

/**
 * Saves data to a vocab set file.
 * @param fileName fileName of the vocab set (e.g. set_1234.json)
 * @param data Array of vocab entries
 */
export async function saveVocabSet(fileName: string, data: VocabEntry[]): Promise<void> {
  const safeFileName = sanitizeFileName(fileName);
  const uri = `${FileSystem.documentDirectory}${safeFileName}`;
  try {
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving vocab set ${fileName}:`, error);
    throw error;
  }
}

/**
 * Deletes a vocab set file.
 * @param fileName fileName of the vocab set to delete
 */
export async function deleteVocabSet(fileName: string): Promise<void> {
  const safeFileName = sanitizeFileName(fileName);
  const uri = `${FileSystem.documentDirectory}${safeFileName}`;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.error(`Error deleting vocab set ${fileName}:`, error);
    throw error;
  }
}

/**
 * Deletes a specific word from a vocab set and updates the manifest.
 * @param setId the id of the vocab set
 * @param wordId the id of the word to delete
 */
export async function deleteVocabWord(setId: string, wordId: string): Promise<{ success: boolean }> {
  try {
    const fileName = `set_${setId}.json`;
    const vocabData = await getVocabSet(fileName);
    
    // Filter out the word
    const updatedVocabData = vocabData.filter(item => item.id !== wordId);
    
    // Write the updated array back
    await saveVocabSet(fileName, updatedVocabData);
    
    // Update manifest
    const manifest = await getManifest();
    const updatedManifest = manifest.map((m) => {
      if (m.id === setId) {
        return {
          ...m,
          totalWords: Math.max(0, m.totalWords - 1),
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });
    
    await saveManifest(updatedManifest);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting word ${wordId} from set ${setId}:`, error);
    return { success: false };
  }
}

/**
 * Deletes an entire vocab set category and updates the manifest.
 * @param setId the id of the vocab set to delete
 */
export async function deleteVocabCategory(setId: string): Promise<{ success: boolean }> {
  try {
    const fileName = `set_${setId}.json`;
    
    // 1. Remove from manifest
    const manifest = await getManifest();
    const updatedManifest = manifest.filter(m => m.id !== setId);
    await saveManifest(updatedManifest);
    
    // 2. Delete the actual file
    await deleteVocabSet(fileName);
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting category ${setId}:`, error);
    return { success: false };
  }
}

/**
 * Updates a vocab category's title.
 */
export async function updateVocabCategory(setId: string, newTitle: string): Promise<{ success: boolean }> {
  try {
    const manifest = await getManifest();
    const updatedManifest = manifest.map(m => 
      m.id === setId ? { ...m, title: newTitle, updatedAt: new Date().toISOString() } : m
    );
    await saveManifest(updatedManifest);
    return { success: true };
  } catch (error) {
    console.error(`Error updating category ${setId}:`, error);
    return { success: false };
  }
}

/**
 * Updates a specific word's data.
 */
export async function updateVocabWord(setId: string, wordId: string, updatedData: Partial<VocabEntry>): Promise<{ success: boolean }> {
  try {
    const fileName = `set_${setId}.json`;
    const vocabData = await getVocabSet(fileName);
    
    const updatedVocabData = vocabData.map(item => 
      item.id === wordId ? { ...item, ...updatedData } : item
    );
    
    await saveVocabSet(fileName, updatedVocabData);
    
    // Update manifest's updatedAt
    const manifest = await getManifest();
    const updatedManifest = manifest.map(m => 
      m.id === setId ? { ...m, updatedAt: new Date().toISOString() } : m
    );
    await saveManifest(updatedManifest);
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating word ${wordId}:`, error);
    return { success: false };
  }
}

export type AppTheme = 'system' | 'light' | 'dark';

export async function getTheme(): Promise<AppTheme> {
  const uri = `${FileSystem.documentDirectory}theme.json`;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return 'system';
    const content = await FileSystem.readAsStringAsync(uri);
    return JSON.parse(content).theme as AppTheme;
  } catch {
    return 'system';
  }
}

export async function saveTheme(theme: AppTheme): Promise<void> {
  const uri = `${FileSystem.documentDirectory}theme.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify({ theme }));
}

/**
 * Encodes a string to its 4-digit hexadecimal representation.
 */
export function encodeToHex(str: string): string {
  if (!str) return '';
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

/**
 * Decodes a 4-digit hexadecimal representation back to its original string.
 */
export function decodeFromHex(hex: string): string {
  if (!hex) return '';
  const matches = hex.match(/.{1,4}/g);
  if (!matches) return '';
  return matches
    .map(val => String.fromCharCode(parseInt(val, 16)))
    .join('');
}
