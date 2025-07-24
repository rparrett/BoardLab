import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '@rn-vui/themed';

// Custom bottom sheet implementation instead of rn-vui's BottomSheet
// because we want fixed headers outside the scroll view

interface SafeBottomSheetProps {
  isVisible: boolean;
  onBackdropPress: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  maxHeightPercentage?: number;
  keyboardAware?: boolean;
}

export default function SafeBottomSheet({
  isVisible,
  onBackdropPress,
  children,
  header,
  maxHeightPercentage = 0.8,
  keyboardAware = true,
}: SafeBottomSheetProps) {
  const { height } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const styles = useStyles({ maxHeight: height * maxHeightPercentage });

  useEffect(() => {
    if (!keyboardAware) return;

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
  }, [keyboardAware]);

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={onBackdropPress}
    >
      <View style={styles.fullScreenContainer}>
        <Pressable style={styles.backdrop} onPress={onBackdropPress} />
        <View style={styles.bottomSheetContainer}>
          <View style={styles.container}>
            {header}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={{
                paddingBottom: insets.bottom + keyboardHeight,
              }}
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="never"
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((theme, { maxHeight }: { maxHeight: number }) => ({
  fullScreenContainer: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: maxHeight,
  },
  container: {
    backgroundColor: theme.colors.secondarySurface,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    height: '100%',
  },
  scrollView: {
    backgroundColor: theme.colors.secondarySurface,
    flex: 1,
  },
}));
