import React from 'react';
import Toast, {
  BaseToast,
  ErrorToast,
  InfoToast,
} from 'react-native-toast-message';
import { makeStyles } from '@rn-vui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ThemedToast() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={[styles.toastBase, styles.successBorder]}
        contentContainerStyle={styles.contentContainer}
        text1Style={styles.titleText}
        text2Style={styles.subtitleText}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={[styles.toastBase, styles.errorBorder]}
        contentContainerStyle={styles.contentContainer}
        text1Style={styles.titleText}
        text2Style={styles.subtitleText}
      />
    ),
    info: (props: any) => (
      <InfoToast
        {...props}
        style={[styles.toastBase, styles.infoBorder]}
        contentContainerStyle={styles.contentContainer}
        text1Style={styles.titleText}
        text2Style={styles.subtitleText}
      />
    ),
  };

  return <Toast config={toastConfig} topOffset={insets.top} />;
}

const useStyles = makeStyles(theme => ({
  toastBase: {
    backgroundColor: theme.colors.secondarySurface,
  },
  successBorder: {
    borderLeftColor: theme.colors.success,
  },
  errorBorder: {
    borderLeftColor: theme.colors.error,
  },
  infoBorder: {
    borderLeftColor: theme.colors.primary,
  },
  contentContainer: {
    paddingHorizontal: 15,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.black,
  },
  subtitleText: {
    fontSize: 14,
    color: theme.colors.grey2,
  },
}));
