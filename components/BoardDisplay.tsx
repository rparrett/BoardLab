import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useAppState } from '../stores/AppState';

export interface PlacementPressEvent {
  originalEvent: any;
  placementId: number;
  currentRoleId: number | null;
  placementScreenX: number;
  placementScreenY: number;
}

interface BoardDisplayProps {
  /** A list of Placements on the board and their associated Role */
  placements: Map<number, number>;
  /** Called when a placement is pressed */
  onPress?: (event: PlacementPressEvent) => void;
  /** Called when a placement is long pressed */
  onLongPress?: (event: PlacementPressEvent) => void;
  /** Called when user swipes left (only when zoom level is 1) */
  onSwipeLeft?: () => void;
  /** Called when user swipes right (only when zoom level is 1) */
  onSwipeRight?: () => void;
}

export default function BoardDisplay({
  placements,
  onPress,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
}: BoardDisplayProps) {
  const { getPlacementData, getRoles, ready } = useDatabase();
  const { cachedContainerDimensions, setCachedContainerDimensions } =
    useAppState();

  // Cache container dimensions to prevent blank flashes during navigation.
  // Without caching, the component would start with {0,0} dimensions on each
  // render until onLayout fires, causing a brief visual flash when swiping
  // between climbs.
  const [containerDimensions, setContainerDimensions] = useState(
    cachedContainerDimensions || { width: 0, height: 0 },
  );
  const [zoomableRef, setZoomableRef] =
    useState<ReactNativeZoomableView | null>(null);

  const [isLongPressing, setIsLongPressing] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(1);

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

  // This is incredibly janky, perhaps a result of me not really understanding how the
  // offsets in ReactNativeZoomableView work.
  //
  // It feels like this should be possible just by applying RNZV's `offsetX` and `offsetY`,
  // and `zoomLevel` to the `viewPlacementX`, but I clearly don't understand what's going
  // on in this component because I can't get that to produce values that make sense.
  const normalizedPlacementToScreen = (
    placementX: number,
    placementY: number,
    tapX: number,
    tapY: number,
    tapScreenX: number,
    tapScreenY: number,
  ): { x: number; y: number } => {
    const viewPlacementX =
      imageOffsetX + placementX * containerDimensions.width;
    const viewPlacementY = imageOffsetY + placementY * scaledImageHeight;

    let diffX = viewPlacementX - tapX;
    let diffY = viewPlacementY - tapY;

    let scaledDiffX = diffX * currentZoomLevel;
    let scaledDiffY = diffY * currentZoomLevel;

    let placementScreenX = tapScreenX + scaledDiffX;
    let placementScreenY = tapScreenY + scaledDiffY;

    return {
      x: placementScreenX,
      y: placementScreenY,
    };
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
      const placement = placementData?.get(placementId);

      if (placement) {
        let placementScreen = normalizedPlacementToScreen(
          placement.x,
          placement.y,
          tapX,
          tapY,
          event.nativeEvent.screenX,
          event.nativeEvent.screenY,
        );

        onPress({
          originalEvent: event,
          placementId,
          currentRoleId,
          placementScreenX: placementScreen.x,
          placementScreenY: placementScreen.y,
        });
      }
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
      const placement = placementData?.get(placementId);

      if (placement) {
        let placementScreen = normalizedPlacementToScreen(
          placement.x,
          placement.y,
          tapX,
          tapY,
          event.nativeEvent.screenX,
          event.nativeEvent.screenY,
        );

        onLongPress({
          originalEvent: event,
          placementId,
          currentRoleId,
          placementScreenX: placementScreen.x,
          placementScreenY: placementScreen.y,
        });
      }
    }
  };

  // Swipe detection handlers for ReactNativeZoomableView
  const handlePanResponderEnd = (evt: any, gestureState: any) => {
    // Only process swipes when at zoom level 1
    if (currentZoomLevel !== 1) {
      return;
    }

    const { dx, vx, dy } = gestureState;

    // Detect horizontal swipe with sufficient distance and velocity
    if (
      Math.abs(dx) > 50 &&
      Math.abs(vx) > 0.3 &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      if (dx > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
  };

  const handleStartShouldSetPanResponder = (_evt: any, _gestureState: any) => {
    return currentZoomLevel === 1;
  };

  return (
    <View
      style={styles.imageZoomContainer}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        const dimensions = { width, height };
        setContainerDimensions(dimensions);
        setCachedContainerDimensions(dimensions);
      }}
    >
      {containerDimensions.width > 0 && (
        <ReactNativeZoomableView
          ref={r => setZoomableRef(r)}
          maxZoom={4}
          minZoom={1}
          zoomStep={1.5}
          initialZoom={1}
          bindToBorders={true}
          disablePanOnInitialZoom={true}
          visualTouchFeedbackEnabled={false}
          onSingleTap={handlePress}
          onLongPress={handleLongPress}
          onStartShouldSetPanResponder={handleStartShouldSetPanResponder}
          onPanResponderEnd={handlePanResponderEnd}
          onZoomEnd={(event, gestureState, zoomableViewEventObject) => {
            setCurrentZoomLevel(zoomableViewEventObject.zoomLevel);
          }}
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
