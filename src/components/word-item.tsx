import { StyleSheet, View, TouchableOpacity, Alert, Text } from 'react-native';
import { ThemedText } from './themed-text';
import { useColorScheme } from 'react-native';

interface WordItemProps {
  id?: string;
  word: string;
  reading: string;
  meaning: string;
  wordType?: string;
  source: string;
  onPress?: () => void;
}

export function WordItem({ id, word, reading, meaning, wordType, source, onPress }: WordItemProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, { 
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderColor: isDark ? '#333333' : '#E5E5EA'
      }]}>
      <View style={styles.topRow}>
        <View style={styles.vocabBox}>
          <ThemedText style={styles.word} type="subtitle">{word}</ThemedText>
          <View style={styles.readingRow}>
            {!!wordType && (
              <View style={[styles.typeBadge, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                <Text style={[styles.typeBadgeText, { color: isDark ? '#E5E5EA' : '#48484A' }]}>{wordType.split(' ')[0]}</Text>
              </View>
            )}
            {!!reading && (
              <ThemedText style={[styles.reading, { fontWeight: '600' }]} type="default">{reading}</ThemedText>
            )}
          </View>
        </View>
        <View style={styles.rightSection}>
          <ThemedText style={styles.meaning} type="default">{meaning}</ThemedText>
        </View>
      </View>
      
      {!!source && (
        <View style={styles.sourceBox}>
          <ThemedText style={styles.sourceText}>Note: {source}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  vocabBox: {
    flex: 1,
  },
  word: {
    fontSize: 24,
    marginBottom: 4,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  reading: {
    fontSize: 16,
    color: '#8E8E93', // standard gray
  },
  meaning: {
    fontSize: 18,
    textAlign: 'right',
    color: '#0274DF',
    fontWeight: '600',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  sourceBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C7C7CC',
  },
  sourceText: {
    fontSize: 12,
    color: '#8E8E93',
  }
});
