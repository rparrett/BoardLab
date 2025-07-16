import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Icon, makeStyles } from '@rn-vui/themed';
import BluetoothHeaderButton from './BluetoothHeaderButton';

interface CreateScreenHeaderRightProps {
  onErasePress: () => void;
}

export default function CreateScreenHeaderRight({
  onErasePress,
}: CreateScreenHeaderRightProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onErasePress} style={styles.button}>
        <Icon
          name="eraser"
          type="material-community"
          size={24}
          color={styles.icon.color}
        />
      </TouchableOpacity>
      <BluetoothHeaderButton />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    padding: 8,
  },
  icon: {
    color: theme.colors.primary,
  },
}));
