import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

import React from 'react';

interface VocabCardProps {
  title: string;
  totalWords: number;
  onPress: () => void;
}

export const VocabCard = React.memo(function VocabCard({ title, totalWords, onPress }: VocabCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      ]}>
      <BlurView
        intensity={40}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurArea}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.title} type="subtitle">
            {title}
          </ThemedText>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>
              {totalWords} คำ
            </ThemedText>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.title === nextProps.title && prevProps.totalWords === nextProps.totalWords;
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  blurArea: {
    padding: 24,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#0274DF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
