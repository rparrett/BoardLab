import React from 'react';
import { BottomSheet, makeStyles } from '@rn-vui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

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
  const styles = useStyles({ maxHeight: height * maxHeightPercentage });

  return (
    <BottomSheet
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      scrollViewProps={{
        style: styles.container,
        contentInset: { top: 0, left: 0, right: 0, bottom: insets.bottom },
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
