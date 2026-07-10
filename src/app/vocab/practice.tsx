import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Animated, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

import { getVocabSet, VocabEntry, getManifest } from '@/utils/storage';
import { ThemedText } from '@/components/themed-text';

export default function PracticeScreen() {
  const { setId } = useLocalSearchParams();
  const parsedSetId = Array.isArray(setId) ? setId[0] : setId;
  const router = useRouter();

  const [cards, setCards] = useState<VocabEntry[]>([]);
  const [originalCards, setOriginalCards] = useState<VocabEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [setTitle, setSetTitle] = useState('Practice');

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // Animation values
  const flipAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      const manifest = await getManifest();
      const setInfo = manifest.find((m) => m.id === parsedSetId);
      if (setInfo) {
        if (mounted) setSetTitle(setInfo.title);
        const data = await getVocabSet(setInfo.fileName);
        if (mounted) {
          setOriginalCards(data);
          setCards(data); // initially ordered
        }
      } else {
        Alert.alert('Error', 'Set not found!');
        router.back();
      }
    })();
    return () => { mounted = false; };
  }, [parsedSetId]);

  const flipCard = useCallback(() => {
    // If it's currently front (0), flip to back (1). If back (1), flip to front (0).
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const resetFlip = () => {
    flipAnim.setValue(0);
    setIsFlipped(false);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      resetFlip();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      resetFlip();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleShuffle = () => {
    if (isShuffle) {
      // Unshuffle (restore original order)
      setCards([...originalCards]);
      setIsShuffle(false);
      resetFlip();
      setCurrentIndex(0);
    } else {
      // Shuffle
      const shuffled = [...originalCards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setIsShuffle(true);
      resetFlip();
      setCurrentIndex(0);
    }
  };

  const handleReset = () => {
    resetFlip();
    setCurrentIndex(0);
    if (isShuffle) {
      const shuffled = [...originalCards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
    } else {
      setCards([...originalCards]);
    }
  };

  if (cards.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]}>
         <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
         </View>
        <View style={styles.emptyCentered}>
          <ThemedText style={{opacity: 0.6}}>Loading cards...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentIndex];

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'], // starting from 180 means it is backward initially
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#f5f5f5' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={30} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <ThemedText style={styles.progressText}>
            {currentIndex + 1} / {cards.length}
          </ThemedText>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleShuffle}>
            <Ionicons name="shuffle" size={28} color={isShuffle ? '#34C759' : (isDark ? '#666' : '#999')} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Area */}
      <View style={styles.mainContent}>
        <TouchableOpacity style={styles.cardWrapper} activeOpacity={1} onPress={flipCard}>
           {/* FRONT OF CARD */}
           <Animated.View style={[
              styles.cardFace, 
              { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#333' : '#E5E5EA' },
              frontAnimatedStyle,
           ]}>
             <ThemedText style={styles.kanjiText} numberOfLines={2} adjustsFontSizeToFit>
               {currentCard.word}{' '}
             </ThemedText>
             <ThemedText style={styles.tapPrompt}>Tap to flip</ThemedText>
           </Animated.View>

           {/* BACK OF CARD */}
           <Animated.View style={[
              styles.cardFace, 
              styles.cardBack,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#333' : '#E5E5EA' },
              backAnimatedStyle,
           ]}>
             {!!currentCard.reading && (
               <ThemedText style={styles.readingText}>{currentCard.reading}{' '}</ThemedText>
             )}
             {!!currentCard.wordType && (
               <View style={[styles.typeBadge, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA', marginBottom: 16 }]}>
                 <Text style={[styles.typeBadgeText, { color: isDark ? '#E5E5EA' : '#48484A' }]}>{currentCard.wordType}</Text>
               </View>
             )}
             <ThemedText style={styles.meaningText}>{currentCard.meaning}{' '}</ThemedText>
             
             {!!currentCard.source && (
               <View style={styles.sourceBox}>
                 <ThemedText style={styles.sourceText}>Note: {currentCard.source}</ThemedText>
               </View>
             )}
           </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Side Navigation Edge Buttons */}
      <TouchableOpacity 
        style={[
          styles.sideNavBtn, 
          styles.leftSideNav,
          currentIndex === 0 && styles.sideNavDisabled
        ]} 
        onPress={handlePrev}
        disabled={currentIndex === 0}
        activeOpacity={0.4}
      >
        <Ionicons 
          name="chevron-back" 
          size={36} 
          color={currentIndex === 0 ? (isDark ? '#222' : '#E5E5EA') : (isDark ? '#3a96f3' : '#0274DF')} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.sideNavBtn, 
          styles.rightSideNav,
          currentIndex === cards.length - 1 && styles.sideNavDisabled
        ]} 
        onPress={handleNext}
        disabled={currentIndex === cards.length - 1}
        activeOpacity={0.4}
      >
        <Ionicons 
          name="chevron-forward" 
          size={36} 
          color={currentIndex === cards.length - 1 ? (isDark ? '#222' : '#E5E5EA') : (isDark ? '#3a96f3' : '#0274DF')} 
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: { padding: 8 },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressContainer: {
    backgroundColor: 'rgba(150,150,150,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCentered: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  mainContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    height: '70%',
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
  },
  kanjiText: {
    fontSize: 56,
    lineHeight: 80,
    paddingVertical: 10,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontWeight: '800',
  },
  tapPrompt: {
    position: 'absolute',
    bottom: 24,
    opacity: 0.4,
    fontSize: 14,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  readingText: {
    fontSize: 28,
    lineHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
  },
  meaningText: {
    fontSize: 32,
    lineHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#0274DF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sourceBox: {
    position: 'absolute',
    bottom: 24,
    paddingHorizontal: 20,
  },
  sourceText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  sideNavBtn: {
    position: 'absolute',
    top: '30%',
    bottom: '30%',
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftSideNav: {
    left: 0,
  },
  rightSideNav: {
    right: 0,
  },
  sideNavDisabled: {
    opacity: 0.4,
  },
});
