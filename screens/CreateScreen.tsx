import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Icon } from '@rn-vui/themed';
import BoardDisplay, { PlacementPressEvent } from '../components/BoardDisplay';
import BluetoothHeaderButton from '../components/BluetoothHeaderButton';
import BluetoothBottomSheet from '../components/BluetoothBottomSheet';
import {
  RadialMenu,
  RadialMenuCenter,
  RadialMenuItem,
  type RadialMenuRef,
} from '../components/RadialMenu';
import { useAppState } from '../stores/AppState';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBleClimbSender } from '../lib/useBleClimbSender';

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
  const headerHeight = useHeaderHeight();

  const [radialMenuVisible, setRadialMenuVisible] = useState(false);
  const [radialMenuPosition, setRadialMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedPlacementId, setSelectedPlacementId] = useState<number | null>(
    null,
  );
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [showSpecialMenu, setShowSpecialMenu] = useState(false);
  const menuRef = useRef<RadialMenuRef>(null);

  const asyncRoles = useAsync(() => {
    return getRoles(1);
  }, [ready]);

  const { sendToBoard } = useBleClimbSender();

  // Send climb in progress to board whenever it changes (including empty to clear board)
  useEffect(() => {
    sendToBoard(climbInProgress);
  }, [climbInProgress, sendToBoard]);

  // Map role IDs to appropriate icons
  const roleIconMap: Record<number, { iconName: string; iconType: string }> = {
    12: { iconName: 'play', iconType: 'ionicon' },
    14: { iconName: 'stop', iconType: 'ionicon' },
    15: { iconName: 'footsteps', iconType: 'ionicon' },
    99: { iconName: 'hands-pray', iconType: 'material-community' },
    98: { iconName: 'child-friendly', iconType: 'materialicons' },
    97: { iconName: 'flag', iconType: 'materialicons' },
    96: { iconName: 'circle', iconType: 'materialicons' },
  };

  // Define which roles are special (non-standard)
  const specialRoleIds = [99, 98, 97, 96];

  // Filter roles based on current menu mode
  const getFilteredRoles = () => {
    if (!asyncRoles.result) return [];
    const allRoles = Array.from(asyncRoles.result.values());

    if (showSpecialMenu) {
      // For special menu, show only special roles
      return allRoles.filter(role => specialRoleIds.includes(role.id));
    } else {
      // For standard menu, filter out any special role IDs
      return allRoles.filter(role => !specialRoleIds.includes(role.id));
    }
  };

  // Header buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={clearClimbInProgress}>
            <Icon name="eraser" type="material-community" size={24} />
          </TouchableOpacity>
          <BluetoothHeaderButton />
        </View>
      ),
    });
  }, [navigation, clearClimbInProgress]);

  const handlePress = (event: PlacementPressEvent) => {
    setSelectedPlacementId(event.placementId);
    setRadialMenuPosition({
      x: event.placementScreenX,
      y: event.placementScreenY - headerHeight,
    });
    setRadialMenuVisible(true);
  };

  const closeRadialMenu = () => {
    setRadialMenuVisible(false);
    setSelectedPlacementId(null);
    setShowSpecialMenu(false); // Reset to standard menu when closing
  };

  const toggleMenuMode = () => {
    setShowSpecialMenu(!showSpecialMenu);
    menuRef.current?.bounce();
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
      <BoardDisplay placements={climbInProgress} onPress={handlePress} />
      <BluetoothBottomSheet />

      <RadialMenu
        visible={radialMenuVisible}
        centerX={radialMenuPosition.x}
        centerY={radialMenuPosition.y}
        onClose={closeRadialMenu}
        containerWidth={containerDimensions.width}
        containerHeight={containerDimensions.height}
        ref={menuRef}
      >
        <RadialMenuCenter
          backgroundColor={
            colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(0, 0, 0, 0.6)'
          }
        />
        {/* Toggle button for switching between standard and special menus */}
        <RadialMenuItem
          onPress={toggleMenuMode}
          iconName="more-horiz"
          iconType="materialicons"
          iconColor="#fff"
          backgroundColor="#666"
        />

        <RadialMenuItem
          onPress={
            selectedPlacementId !== null &&
            climbInProgress.has(selectedPlacementId)
              ? handleRemovePlacement
              : closeRadialMenu
          }
          iconName="delete"
          iconType="materialicons"
          iconColor="#fff"
          backgroundColor="#999"
        />
        {getFilteredRoles().map(role => {
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
    gap: 16,
  },
});
