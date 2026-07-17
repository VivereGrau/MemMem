import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Animated, Text, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

import { getVocabSet, VocabEntry, getManifest } from '@/utils/storage';
import { ThemedText } from '@/components/themed-text';

export default function OxPracticeScreen() {
  const { setId, shuffle } = useLocalSearchParams();
  const parsedSetId = Array.isArray(setId) ? setId[0] : setId;
  const initialShuffle = (Array.isArray(shuffle) ? shuffle[0] : shuffle) === 'true';
  const router = useRouter();

  // Vocab lists
  const [originalCards, setOriginalCards] = useState<VocabEntry[]>([]);
  const [currentRoundCards, setCurrentRoundCards] = useState<VocabEntry[]>([]);
  
  // Game states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [setTitle, setSetTitle] = useState('O/X Assessment');
  const [incorrectCards, setIncorrectCards] = useState<VocabEntry[]>([]);
  
  // Scoring
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  
  // Round status
  const [isRoundCompleted, setIsRoundCompleted] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // Animation values
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Load Initial Cards
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
          // Initialize first round
          if (initialShuffle) {
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            setCurrentRoundCards(shuffled);
          } else {
            setCurrentRoundCards(data);
          }
        }
      } else {
        Alert.alert('Error', 'Set not found!');
        router.back();
      }
    })();
    return () => { mounted = false; };
  }, [parsedSetId]);

  const flipCard = useCallback(() => {
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

  const handleAssessment = (remembered: boolean) => {
    const card = currentRoundCards[currentIndex];

    if (remembered) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
      setIncorrectCards((prev) => [...prev, card]);
    }

    // Check if it was the last card in the round
    if (currentIndex < currentRoundCards.length - 1) {
      resetFlip();
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Round complete
      setIsRoundCompleted(true);
    }
  };

  const handleStartNextRound = () => {
    // Set forgotten cards as the new round
    const nextRoundSubset = [...incorrectCards];
    
    // Shuffle if enabled
    if (initialShuffle) {
      nextRoundSubset.sort(() => Math.random() - 0.5);
    }

    setCurrentRoundCards(nextRoundSubset);
    setCurrentIndex(0);
    setIncorrectCards([]);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsRoundCompleted(false);
    resetFlip();
  };

  const handleRestartAll = () => {
    let reloadedCards = [...originalCards];
    if (initialShuffle) {
      reloadedCards.sort(() => Math.random() - 0.5);
    }
    setCurrentRoundCards(reloadedCards);
    setCurrentIndex(0);
    setIncorrectCards([]);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsRoundCompleted(false);
    resetFlip();
  };

  if (currentRoundCards.length === 0 && !isRoundCompleted) {
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

  const currentCard = currentRoundCards[currentIndex];

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
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
            {isRoundCompleted ? 'Completed' : `${currentIndex + 1} / ${currentRoundCards.length}`}
          </ThemedText>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {isRoundCompleted ? (
        /* ROUND COMPLETION SUMMARY SCREEN */
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <Ionicons
              name={incorrectCount === 0 ? "trophy-outline" : "hourglass-outline"}
              size={64}
              color={incorrectCount === 0 ? "#FFD700" : "#FF9500"}
              style={styles.summaryIcon}
            />
            
            <ThemedText style={styles.summaryTitle}>
              {incorrectCount === 0 ? "ยินดีด้วย! ทบทวนสำเร็จ" : "จบรอบการทบทวนแล้ว!"}
            </ThemedText>

            <Text style={[styles.summarySubtitle, { color: isDark ? '#8E8E93' : '#636366' }]}>
              {incorrectCount === 0 
                ? `คุณสามารถจำคำศัพท์ได้ครบทั้งหมด ${originalCards.length} คำแล้ว 🎉`
                : `รอบนี้จำได้ ${correctCount} คำ, ยังจำไม่ได้อีก ${incorrectCount} คำ`
              }
            </Text>

            {/* Score Indicators */}
            <View style={styles.scoreRow}>
              <View style={[styles.scoreBox, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={[styles.scoreValue, { color: isDark ? '#FFF' : '#000' }]}>{correctCount}</Text>
                <Text style={styles.scoreLabel}>จำได้</Text>
              </View>
              <View style={[styles.scoreBox, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
                <Text style={[styles.scoreValue, { color: isDark ? '#FFF' : '#000' }]}>{incorrectCount}</Text>
                <Text style={styles.scoreLabel}>จำไม่ได้</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.summaryActions}>
              {incorrectCount > 0 ? (
                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleStartNextRound}>
                  <Text style={styles.primaryActionBtnText}>เริ่มทบทวนรอบถัดไป ({incorrectCount} คำ)</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#34C759' }]} onPress={() => router.back()}>
                  <Text style={styles.primaryActionBtnText}>เสร็จสิ้น</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleRestartAll}>
                <Text style={[styles.secondaryActionBtnText, { color: isDark ? '#FFF' : '#000' }]}>เริ่มทบทวนใหม่ทั้งหมด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* ACTIVE OX PLAY SCREEN */
        <View style={styles.mainPlayArea}>
          {/* Card Area */}
          <View style={styles.cardContainer}>
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
                <ThemedText style={styles.tapPrompt}>แตะเพื่อพลิก</ThemedText>
              </Animated.View>

              {/* BACK OF CARD */}
              <Animated.View style={[
                styles.cardFace, 
                styles.cardBack,
                { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#333' : '#E5E5EA' },
                backAnimatedStyle,
              ]}>
                <ScrollView 
                  style={styles.cardBackScrollWrapper}
                  contentContainerStyle={styles.cardBackScroll}
                  showsVerticalScrollIndicator={false}
                >
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
                    <View style={[styles.sourceBox, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderLeftColor: isDark ? '#0A84FF' : '#007AFF' }]}>
                      <ThemedText style={styles.sourceText}>Note: {currentCard.source}{' '}</ThemedText>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Bottom Assessment Buttons */}
          <View style={styles.assessmentContainer}>
            <TouchableOpacity 
              style={[styles.assessBtn, styles.assessBtnX]}
              onPress={() => handleAssessment(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={38} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.assessBtn, styles.assessBtnO]}
              onPress={() => handleAssessment(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="ellipse-outline" size={34} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerRightPlaceholder: { width: 46 }, // matches closing btn width
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
  mainPlayArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardWrapper: {
    width: '100%',
    height: '85%',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    padding: 0,
  },
  cardBackScrollWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  cardBackScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    width: '100%',
  },
  sourceText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 22,
  },
  assessmentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    width: '100%',
    paddingVertical: 16,
  },
  assessBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  assessBtnX: {
    backgroundColor: '#FF3B30',
  },
  assessBtnO: {
    backgroundColor: '#34C759',
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  summaryIcon: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
    marginBottom: 32,
  },
  scoreBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  summaryActions: {
    width: '100%',
    gap: 12,
  },
  primaryActionBtn: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryActionBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
