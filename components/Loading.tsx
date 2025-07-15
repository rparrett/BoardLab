import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from '@rn-vui/themed';
import { ActivityIndicator } from 'react-native';

type Props = {
  text?: string;
};

export default function Loading({ text = 'Loading...' }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.grey0} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
  },
});
