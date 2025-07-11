import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';

export interface PlacementPressEvent {
  originalEvent: any;
  placementId: number;
  currentRoleId: number | null;
}

interface BoardDisplayProps {
  /** A list of Placements on the board and their associated Role */
  placements: Map<number, number>;
  /** Called when a placement is pressed */
  onPress?: (event: PlacementPressEvent) => void;
  /** Called when a placement is long pressed */
  onLongPress?: (event: PlacementPressEvent) => void;
}

export default function BoardDisplay({
  placements,
  onPress,
  onLongPress,
}: BoardDisplayProps) {
  const { getPlacementData, getRoles, ready } = useDatabase();

  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [isLongPressing, setIsLongPressing] = useState(false);

  const asyncPlacementData = useAsync(() => {
    return getPlacementData();
  }, [ready]);

  const asyncRoles = useAsync(() => {
    return getRoles(1);
  }, [ready]);

  const placementData = asyncPlacementData.result;
  const roles = asyncRoles.result;

  const imageWidth = 1080.0;
  const imageHeight = 1170.0;

  const scale = containerDimensions.width / imageWidth;
  const scaledImageHeight = imageHeight * scale;

  // Calculate image offset for centering
  const imageOffsetX = 0;
  const imageOffsetY = (containerDimensions.height - scaledImageHeight) / 2;

  const renderPlacement = (placementId: number, roleId: number) => {
    const placement = placementData?.get(placementId);
    if (!placement) {
      console.warn('Unmapped placement id', placementId);
      return null;
    }

    const role = roles?.get(roleId);
    if (!role) {
      console.warn('Unmapped role id', roleId);
      return null;
    }

    const iconSize = 22;
    let scaledX =
      imageOffsetX + placement.x * containerDimensions.width - iconSize / 2 + 2;
    let scaledY = imageOffsetY + placement.y * scaledImageHeight - iconSize / 2;

    return (
      <View
        key={`placement-${placementId}`}
        style={[styles.placementIndicator, { left: scaledX, top: scaledY }]}
        pointerEvents="none" // Prevent touch events from being intercepted by placement indicators
      >
        <Icon
          name="circle-o"
          type="font-awesome"
          size={iconSize}
          color={`#${role.screenColor}`}
        />
      </View>
    );
  };

  const findClosestPlacement = (tapX: number, tapY: number): number | null => {
    if (!placementData || containerDimensions.width === 0) return null;

    let closestPlacementId: number | null = null;
    let minDistance = Infinity;
    const maxTapDistance = 50; // Maximum distance in pixels to consider a tap

    for (const [placementId] of placementData) {
      const placement = placementData.get(placementId);
      if (!placement) continue;

      // Convert normalized coordinates to screen coordinates
      const screenX = imageOffsetX + placement.x * containerDimensions.width;
      const screenY = imageOffsetY + placement.y * scaledImageHeight;

      // Calculate Euclidean distance
      const distance = Math.sqrt(
        Math.pow(tapX - screenX, 2) + Math.pow(tapY - screenY, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPlacementId = placementId;
      }
    }

    // Only return placement if it's within the maximum tap distance
    return minDistance <= maxTapDistance ? closestPlacementId : null;
  };

  const handlePress = (event: any) => {
    if (!onPress) return;

    // Prevent single tap from firing if long press is in progress
    if (isLongPressing) {
      setIsLongPressing(false);
      return;
    }

    const { nativeEvent } = event;

    const tapX = nativeEvent.locationX;
    const tapY = nativeEvent.locationY;

    const placementId = findClosestPlacement(tapX, tapY);

    if (placementId !== null) {
      const currentRoleId = placements.get(placementId) || null;
      onPress({
        originalEvent: event,
        placementId,
        currentRoleId,
      });
    }
  };

  const handleLongPress = (event: any) => {
    if (!onLongPress) return;

    // Mark that a long press is happening to prevent single tap from firing
    setIsLongPressing(true);

    const { nativeEvent } = event;

    const tapX = nativeEvent.locationX;
    const tapY = nativeEvent.locationY;

    const placementId = findClosestPlacement(tapX, tapY);

    if (placementId !== null) {
      const currentRoleId = placements.get(placementId) || null;
      onLongPress({
        originalEvent: event,
        placementId,
        currentRoleId,
      });
    }
  };

  return (
    <View
      style={styles.imageZoomContainer}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setContainerDimensions({ width, height });
      }}
    >
      {containerDimensions.width > 0 && (
        <ReactNativeZoomableView
          maxZoom={4}
          minZoom={1}
          zoomStep={1.5}
          initialZoom={1}
          bindToBorders={true}
          disablePanOnInitialZoom={true}
          onSingleTap={handlePress}
          onLongPress={handleLongPress}
        >
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/45-1.png')}
              style={styles.layeredImage}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/46-1.png')}
              style={styles.layeredImage}
              resizeMode="contain"
            />
            {placementData &&
              roles &&
              Array.from(placements.entries()).map(([placementId, roleId]) =>
                renderPlacement(placementId, roleId),
              )}
          </View>
        </ReactNativeZoomableView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageZoomContainer: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  layeredImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  placementIndicator: {
    position: 'absolute',
    zIndex: 5,
  },
});
