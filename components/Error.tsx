import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from '@rn-vui/themed';
import { Icon } from '@rn-vui/themed';

type Props = {
  error?: Error | string;
};

export default function Error({ error }: Props) {
  const { theme } = useTheme();

  const displayMessage =
    typeof error === 'string' ? error : error?.message || 'An error occurred';

  return (
    <View style={styles.container}>
      <Icon
        name="error-outline"
        type="material"
        size={48}
        color={theme.colors.error}
      />
      <Text style={styles.text}>{displayMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
  },
});
