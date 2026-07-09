# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# React Native Android Typography Quirks
- Android Text components aggressively clip non-Latin scripts (like Thai tone marks) and italic/bold fonts on the right edge.
- **Fix top/bottom clipping**: Always use a generous `lineHeight` (e.g. `fontSize * 1.5`) and `paddingVertical` on `Text` components. Do not rely solely on default line heights or `paddingVertical`.
- **Fix right-edge clipping**: Adding `paddingHorizontal` or `paddingRight` is often not enough due to strict bounding box calculation. The foolproof fix is to append a trailing space string to the text content itself: `{word}{' '}`.

# React Native Android Modal Keyboard Quirk
- Transparent `<Modal>` on Android often fails to trigger `keyboardDidShow` properly, and `KeyboardAvoidingView` behaves unpredictably.
- **Fix modal floating gap (The "Infinite Skirt" Fix)**: When a bottom-sheet modal is pushed up by the keyboard, closing the keyboard might leave a permanent visual gap at the bottom on Android. To visually hide this, extend the modal container's background far below the screen using `paddingBottom: 400` and `marginBottom: -360` (or similar offset). This ensures any gap is colored by the modal's background rather than revealing the transparent backdrop. Always use this pattern for bottom-sheet modals.
