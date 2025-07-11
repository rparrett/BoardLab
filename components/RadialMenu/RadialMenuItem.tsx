import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Icon } from '@rneui/themed';

interface RadialMenuItemProps {
  onPress: () => void;
  iconName: string;
  iconType?: string;
  iconColor?: string;
  iconSize?: number;
  backgroundColor?: string;
  /** @internal Managed by RadialMenu - overrides any value provided */
  size?: number;
  /** @internal Managed by RadialMenu - overrides any value provided */
  x?: number;
  /** @internal Managed by RadialMenu - overrides any value provided */
  y?: number;
  /** @internal Managed by RadialMenu - overrides any value provided */
  animationDelay?: number;
}

export default function RadialMenuItem({
  onPress,
  iconName,
  iconType = 'materialicons',
  iconColor = '#fff',
  backgroundColor = '#2196F3',
  size = 50,
  iconSize = 24,
  x = 0,
  y = 0,
  animationDelay = 0,
}: RadialMenuItemProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const positionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.spring(positionAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationDelay, scaleAnim, positionAnim]);

  return (
    <Animated.View
      style={[
        styles.item,
        {
          transform: [
            {
              translateX: positionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, x],
              }),
            },
            {
              translateY: positionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, y],
              }),
            },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
          },
        ]}
        activeOpacity={0.8}
      >
        <Icon
          name={iconName}
          type={iconType}
          size={iconSize}
          color={iconColor}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
