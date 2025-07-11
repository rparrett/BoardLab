import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface RadialMenuCenterProps {
  onClose?: () => void;
  size?: number;
  backgroundColor?: string;
}

export default function RadialMenuCenter({
  onClose,
  size = 50,
  backgroundColor = 'rgba(0, 0, 0, 0.4)',
}: RadialMenuCenterProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      delay: 50,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <TouchableOpacity
      onPress={onClose}
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.centerInner,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centerInner: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    backgroundColor: 'transparent',
  },
});
