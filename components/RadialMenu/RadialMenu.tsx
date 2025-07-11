import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  calculateCircleRectIntersection,
  calculateMinimumAngleBetweenCircles,
  type Circle,
  type Rectangle,
} from './geometry';

interface RadialMenuProps {
  visible: boolean;
  centerX: number;
  centerY: number;
  onClose: () => void;
  children: React.ReactNode;
  containerWidth?: number;
  containerHeight?: number;
  minRadius?: number;
  maxRadius?: number;
}

export default function RadialMenu({
  visible,
  centerX,
  centerY,
  onClose,
  children,
  containerWidth,
  containerHeight,
  minRadius = 70,
  maxRadius = 200,
}: RadialMenuProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const screenDimensions = Dimensions.get('window');
  const itemSize = 50; // Overrides the size in RadialMenuItem
  const minSpacing = 10; // Minimum distance between items and between items and bounds

  const effectiveWidth = containerWidth || screenDimensions.width;
  const effectiveHeight = containerHeight || screenDimensions.height;
  const { radius, startAngle, arcSpan } = useMemo(() => {
    const totalItems = React.Children.toArray(children).filter(child => {
      return (
        React.isValidElement(child) && child.type.name === 'RadialMenuItem'
      );
    }).length;

    const calculateMinAngle = (menuRadius: number) => {
      return calculateMinimumAngleBetweenCircles(
        itemSize / 2,
        menuRadius,
        minSpacing / 2,
      );
    };

    for (
      let testRadius = minRadius;
      testRadius <= maxRadius;
      testRadius += 10
    ) {
      const minAngleBetweenItems = calculateMinAngle(testRadius);
      const minTotalArc = totalItems * minAngleBetweenItems;

      const circle: Circle = { centerX, centerY, radius: testRadius };
      const bounds: Rectangle = {
        left: 0,
        right: effectiveWidth,
        top: 0,
        bottom: effectiveHeight,
      };
      const usableArc = calculateCircleRectIntersection(
        circle,
        bounds,
        itemSize / 2 + minSpacing,
      );

      if (usableArc.totalArc >= minTotalArc) {
        return {
          radius: testRadius,
          startAngle: usableArc.startAngle,
          arcSpan: usableArc.totalArc,
        };
      }
    }

    const fallbackCircle: Circle = { centerX, centerY, radius: maxRadius };
    const fallbackBounds: Rectangle = {
      left: 0,
      right: effectiveWidth,
      top: 0,
      bottom: effectiveHeight,
    };
    const usableArc = calculateCircleRectIntersection(
      fallbackCircle,
      fallbackBounds,
      itemSize / 2 + minSpacing,
    );

    return {
      radius: maxRadius,
      startAngle: usableArc.startAngle,
      arcSpan: usableArc.totalArc,
    };
  }, [
    centerX,
    centerY,
    effectiveWidth,
    effectiveHeight,
    minRadius,
    maxRadius,
    minSpacing,
    itemSize,
    children,
  ]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.overlayTouchable}
        onPress={onClose}
        activeOpacity={1}
      />
      <Animated.View
        style={[
          styles.container,
          {
            left: centerX,
            top: centerY,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {(() => {
          const menuItems: React.ReactElement[] = [];
          const otherChildren: React.ReactNode[] = [];

          React.Children.forEach(children, child => {
            if (
              React.isValidElement(child) &&
              child.props.iconName !== undefined
            ) {
              menuItems.push(child);
            } else {
              otherChildren.push(child);
            }
          });

          return [
            ...otherChildren.map((child, index) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  ...child.props,
                  key: `other-${index}`,
                  onClose,
                });
              }
              return child;
            }),
            ...menuItems.map((child, index) => {
              const totalItems = menuItems.length;
              const angle =
                totalItems === 1
                  ? startAngle + arcSpan / 2 // Single item goes in center
                  : arcSpan >= 360
                  ? startAngle + (index * arcSpan) / totalItems // Full circle: distribute evenly, no overlap
                  : startAngle + (index * arcSpan) / (totalItems - 1); // Partial arc: distribute from start to end

              const radians = (angle * Math.PI) / 180;
              const x = Math.cos(radians) * radius;
              const y = Math.sin(radians) * radius;
              const animationDelay = 100 + index * 50;

              return React.cloneElement(child, {
                ...child.props,
                key: `menu-${index}`,
                x,
                y,
                animationDelay,
                size: itemSize,
              });
            }),
          ];
        })()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
