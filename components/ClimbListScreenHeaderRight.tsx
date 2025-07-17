import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text, makeStyles } from '@rn-vui/themed';
import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../stores/AppState';

interface ClimbListScreenHeaderRightProps {
  angle: number;
  onAnglePress: () => void;
}

export default function ClimbListScreenHeaderRight({
  angle,
  onAnglePress,
}: ClimbListScreenHeaderRightProps) {
  const styles = useStyles();
  const navigation = useNavigation();
  const { lastViewedClimb } = useAppState();

  const handleLastViewedPress = () => {
    if (lastViewedClimb) {
      navigation.navigate('Climb' as any, { uuid: lastViewedClimb });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAnglePress} style={styles.button}>
        <Text style={styles.angleText}>{angle}°</Text>
      </TouchableOpacity>
      {!!lastViewedClimb && (
        <HeaderBackButton
          onPress={handleLastViewedPress}
          style={{
            transform: [{ scaleX: -1 }],
          }}
        />
      )}
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
