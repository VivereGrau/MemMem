# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# React Native Android Typography Quirks
- Android Text components aggressively clip non-Latin scripts (like Thai tone marks) and italic/bold fonts on the right edge.
- **Fix top/bottom clipping**: Always use a generous `lineHeight` (e.g. `fontSize * 1.5`) and `paddingVertical` on `Text` components. Do not rely solely on default line heights or `paddingVertical`.
- **Fix right-edge clipping**: Adding `paddingHorizontal` or `paddingRight` is often not enough due to strict bounding box calculation. The foolproof fix is to append a trailing space string to the text content itself: `{word}{' '}`.

# React Native Android Modal Keyboard Quirk
- Transparent `<Modal>` on Android often fails to trigger `keyboardDidShow` properly, and `KeyboardAvoidingView` behaves unpredictably.
- **Fix modal floating gap (The "Infinite Skirt" Fix)**: When a bottom-sheet modal is pushed up by the keyboard, closing the keyboard might leave a permanent visual gap at the bottom on Android. To visually hide this, extend the modal container's background far below the screen using `paddingBottom: 400` and `marginBottom: -360` (or similar offset). This ensures any gap is colored by the modal's background rather than revealing the transparent backdrop. Always use this pattern for bottom-sheet modals.

# Local Android Build Quirks (Windows)
- **Signature Conflict**: APKs compiled locally on Windows via `gradlew assembleRelease` are signed with the local debug keystore by default. When installing the local APK over a version built via EAS Cloud, Android will throw a signature mismatch error. **You must uninstall the existing app from the device first** before installing the new local APK.

# Expo Router Parameter Truncation
- **Android Query Param Bug**: Passing multi-byte characters (e.g., Thai vowel marks, Hiragana, Katakana) as URL parameters in Expo Router can cause string truncation or corruption on Android. It is recommended to avoid passing arbitrary non-ASCII strings in route parameters. If navigation requires highlighting a specific item, pass only its ASCII identifier (`wordId`), let the target screen load in its default state, and auto-trigger the detail view modal.
# Swipe-to-Dismiss Bottom Sheet Modals
- Bottom sheet modals (like Word details, category edit, export, and mode selector) use custom swipe-to-dismiss gesture configurations.
- **Pattern**: Initialize a `PanResponder` tracking the drag gesture `dy` and animate an `Animated.Value` (`modalY`) mapped to the translateY transform. Set `onMoveShouldSetPanResponder` to return `gestureState.dy > 8` so that vertical drag gestures trigger the dismissal, and on release animate the dismissal if `dy > 100` or `vy > 0.5`.

# Flashcard / Game Mode Routing Architecture
- Keep custom practice/learning loops modular. Instead of mixing distinct game loops with complex layout states (e.g., standard next/prev flashcard navigation vs. O/X Leitner-style active-recall loops), implement them in separate screen routes (e.g., `practice.tsx` and `ox-practice.tsx`).
- Pass parameters such as `setId` and `shuffle` as clean URL/query parameters in `router.push`. When passing boolean flags like `shuffle`, format them as `"true"` or `"false"` to match string parsing in `useLocalSearchParams()`.
