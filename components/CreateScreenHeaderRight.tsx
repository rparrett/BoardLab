import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Icon, makeStyles } from '@rn-vui/themed';
import BluetoothHeaderButton from './BluetoothHeaderButton';

interface CreateScreenHeaderRightProps {
  angle: number;
  onAnglePress: () => void;
  onErasePress: () => void;
}

export default function CreateScreenHeaderRight({
  angle,
  onAnglePress,
  onErasePress,
}: CreateScreenHeaderRightProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAnglePress} style={styles.button}>
        <Text style={styles.angleText}>{angle}°</Text>
      </TouchableOpacity>
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
  angleText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  icon: {
    color: theme.colors.primary,
  },
}));
