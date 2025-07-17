import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Icon, makeStyles } from '@rn-vui/themed';

interface IconConfig {
  name: string;
  type: 'materialicons' | 'material-community' | 'ionicons';
  size?: number;
}

interface CompositeIconProps {
  baseIcon: IconConfig;
  overlayIcon: IconConfig;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export default function CompositeIcon({
  baseIcon,
  overlayIcon,
  size = 24,
  color,
  style,
}: CompositeIconProps) {
  const styles = useStyles({ size });

  const baseIconSize = baseIcon.size || size;
  const overlayIconSize = overlayIcon.size || size * 0.8;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.baseIcon}>
        <Icon
          name={baseIcon.name}
          type={baseIcon.type}
          size={baseIconSize}
          color={color}
        />
      </View>
      <View style={styles.overlayIcon}>
        <Icon
          name={overlayIcon.name}
          type={overlayIcon.type}
          size={overlayIconSize}
          color={color}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((theme, { size }: { size: number }) => ({
  container: {
    width: size,
    height: size,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
