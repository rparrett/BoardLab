import React from 'react';
import { BottomSheet, makeStyles } from '@rn-vui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeBottomSheetProps {
  isVisible: boolean;
  onBackdropPress: () => void;
  children: React.ReactNode;
}

export default function SafeBottomSheet({
  isVisible,
  onBackdropPress,
  children,
}: SafeBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles({ insets });

  return (
    <BottomSheet
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      scrollViewProps={{ style: styles.container }}
      // @ts-expect-error BottomSheet takes SafeAreaView's props as well, but its types are incorrect
      edges={{ bottom: 'off' }}
    >
      {children}
    </BottomSheet>
  );
}

const useStyles = makeStyles((theme, { insets }: { insets: any }) => ({
  container: {
    backgroundColor: theme.colors.secondarySurface,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: insets.bottom,
  },
}));
