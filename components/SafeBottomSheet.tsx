import React, { useState, useEffect } from 'react';
import { BottomSheet, makeStyles } from '@rn-vui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions, Keyboard } from 'react-native';

interface SafeBottomSheetProps {
  isVisible: boolean;
  onBackdropPress: () => void;
  children: React.ReactNode;
  maxHeightPercentage?: number;
}

export default function SafeBottomSheet({
  isVisible,
  onBackdropPress,
  children,
  maxHeightPercentage = 0.8,
}: SafeBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );

    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const styles = useStyles({ maxHeight: height * maxHeightPercentage });

  return (
    <BottomSheet
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      scrollViewProps={{
        style: styles.container,
        contentInset: {
          top: 0,
          left: 0,
          right: 0,
          bottom: insets.bottom + keyboardHeight,
        },
        contentOffset:
          keyboardHeight > 0 ? { x: 0, y: keyboardHeight } : { x: 0, y: 0 },
      }}
      // @ts-expect-error BottomSheet takes SafeAreaView's props as well, but its types are incorrect
      edges={{ bottom: 'off' }}
    >
      {children}
    </BottomSheet>
  );
}

const useStyles = makeStyles((theme, { maxHeight }: { maxHeight: number }) => ({
  container: {
    backgroundColor: theme.colors.secondarySurface,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    maxHeight: maxHeight,
  },
}));
