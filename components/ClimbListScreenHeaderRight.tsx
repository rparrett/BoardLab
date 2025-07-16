import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text, makeStyles } from '@rn-vui/themed';

interface ClimbListScreenHeaderRightProps {
  angle: number;
  onAnglePress: () => void;
}

export default function ClimbListScreenHeaderRight({
  angle,
  onAnglePress,
}: ClimbListScreenHeaderRightProps) {
  const styles = useStyles();

  return (
    <TouchableOpacity onPress={onAnglePress} style={styles.button}>
      <Text style={styles.angleText}>{angle}°</Text>
    </TouchableOpacity>
  );
}

const useStyles = makeStyles(theme => ({
  button: {
    padding: 8,
    marginRight: 8,
  },
  angleText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
}));
