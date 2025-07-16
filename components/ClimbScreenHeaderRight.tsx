import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Icon, makeStyles } from '@rn-vui/themed';
import BluetoothHeaderButton from './BluetoothHeaderButton';

interface ClimbScreenHeaderRightProps {
  angle: number;
  onAnglePress: () => void;
  onCopyPress: () => void;
  onSharePress: () => void;
}

export default function ClimbScreenHeaderRight({
  angle,
  onAnglePress,
  onCopyPress,
  onSharePress,
}: ClimbScreenHeaderRightProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAnglePress} style={styles.button}>
        <Text style={styles.angleText}>{angle}°</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCopyPress} style={styles.button}>
        <Icon
          name="pencil-box-multiple-outline"
          type="material-community"
          size={24}
          color={styles.icon.color}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onSharePress} style={styles.button}>
        <Icon
          name="share"
          type="material"
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
