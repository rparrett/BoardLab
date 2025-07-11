import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Icon } from '@rneui/themed';
import BoardDisplay, { PlacementPressEvent } from '../components/BoardDisplay';
import BluetoothHeaderButton from '../components/BluetoothHeaderButton';
import BluetoothBottomSheet from '../components/BluetoothBottomSheet';
import {
  RadialMenu,
  RadialMenuCenter,
  RadialMenuItem,
} from '../components/RadialMenu';
import { useAppState } from '../stores/AppState';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useLayoutEffect, useState } from 'react';

type Props = StaticScreenProps<{
  uuid: string | undefined;
}>;

export default function CreateScreen({}: Props) {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const {
    climbInProgress,
    updatePlacement,
    removePlacement,
    clearClimbInProgress,
  } = useAppState();
  const { getRoles, ready } = useDatabase();

  const [radialMenuVisible, setRadialMenuVisible] = useState(false);
  const [radialMenuPosition, setRadialMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedPlacementId, setSelectedPlacementId] = useState<number | null>(
    null,
  );
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  const asyncRoles = useAsync(() => {
    return getRoles(1);
  }, [ready]);

  // Map role IDs to appropriate icons
  const roleIconMap: Record<number, { iconName: string; iconType: string }> = {
    12: { iconName: 'play', iconType: 'ionicon' },
    14: { iconName: 'stop', iconType: 'ionicon' },
    15: { iconName: 'footsteps', iconType: 'ionicon' },
  };

  // Header buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <BluetoothHeaderButton />
          <TouchableOpacity
            onPress={clearClimbInProgress}
            style={styles.clearButton}
          >
            <Icon
              name="backspace"
              type="materialicons"
              size={24}
              color="#FF5722"
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, clearClimbInProgress]);

  const handlePress = (event: PlacementPressEvent) => {
    if (!asyncRoles.result) return;

    const roles = Array.from(asyncRoles.result.values());
    let nextRoleId = null;

    if (event.currentRoleId === null) {
      // No role assigned, assign first role
      nextRoleId = roles[0].id;
      updatePlacement(event.placementId, nextRoleId);
    } else {
      // Find current role index and cycle to next
      const currentIndex = roles.findIndex(
        role => role.id === event.currentRoleId,
      );

      if (currentIndex === -1) {
        // Current role not found, assign first role
        nextRoleId = roles[0].id;
        updatePlacement(event.placementId, nextRoleId);
      } else if (currentIndex === roles.length - 1) {
        // Last role, remove placement (cycle back to empty)
        nextRoleId = null;
        removePlacement(event.placementId);
      } else {
        // Cycle to next role
        nextRoleId = roles[currentIndex + 1].id;
        updatePlacement(event.placementId, nextRoleId);
      }
    }

    console.log(
      'Tapped placement:',
      event.placementId,
      'current role:',
      event.currentRoleId,
      'next role:',
      nextRoleId,
      'x/y:',
      event.originalEvent.nativeEvent.locationX,
      event.originalEvent.nativeEvent.locationY,
    );
  };

  const handleLongPress = (event: PlacementPressEvent) => {
    console.log('Long pressed placement:', event.placementId);

    // Use placement coordinates for consistent menu positioning
    setSelectedPlacementId(event.placementId);
    setRadialMenuPosition({ x: event.placementX, y: event.placementY });
    setRadialMenuVisible(true);
  };

  const closeRadialMenu = () => {
    setRadialMenuVisible(false);
    setSelectedPlacementId(null);
  };

  const handleRoleSelect = (roleId: number) => {
    return () => {
      if (selectedPlacementId !== null) {
        updatePlacement(selectedPlacementId, roleId);
      }
      closeRadialMenu();
    };
  };

  const handleRemovePlacement = () => {
    if (selectedPlacementId !== null) {
      removePlacement(selectedPlacementId);
    }
    closeRadialMenu();
  };

  return (
    <View
      style={styles.container}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setContainerDimensions({ width, height });
      }}
    >
      <BoardDisplay
        placements={climbInProgress}
        onLongPress={handleLongPress}
        onPress={handlePress}
      />
      <BluetoothBottomSheet />

      <RadialMenu
        visible={radialMenuVisible}
        centerX={radialMenuPosition.x}
        centerY={radialMenuPosition.y}
        onClose={closeRadialMenu}
        containerWidth={containerDimensions.width}
        containerHeight={containerDimensions.height}
      >
        <RadialMenuCenter
          backgroundColor={
            colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.4)'
          }
        />

        {asyncRoles.result &&
          Array.from(asyncRoles.result.values()).map(role => {
            const roleIcon = roleIconMap[role.id] || {
              iconName: 'circle',
              iconType: 'materialicons',
            };
            return (
              <RadialMenuItem
                key={role.id}
                onPress={handleRoleSelect(role.id)}
                iconName={roleIcon.iconName}
                iconType={roleIcon.iconType}
                iconColor="#fff"
                backgroundColor={`#${role.screenColor}`}
              />
            );
          })}
        {selectedPlacementId !== null &&
          climbInProgress.has(selectedPlacementId) && (
            <RadialMenuItem
              onPress={handleRemovePlacement}
              iconName="delete"
              iconType="materialicons"
              iconColor="#fff"
              backgroundColor="#FF5722"
            />
          )}
      </RadialMenu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
});
