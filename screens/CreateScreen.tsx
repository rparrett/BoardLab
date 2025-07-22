import {
  StaticScreenProps,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { View, useColorScheme, TouchableOpacity } from 'react-native';
import { Text, makeStyles } from '@rn-vui/themed';
import BoardDisplay, { PlacementPressEvent } from '../components/BoardDisplay';
import BluetoothBottomSheet from '../components/BluetoothBottomSheet';
import CreateScreenHeaderRight from '../components/CreateScreenHeaderRight';
import ClimbEditBottomSheet from '../components/ClimbEditBottomSheet';
import AngleSelectBottomSheet from '../components/AngleSelectBottomSheet';
import {
  RadialMenu,
  RadialMenuCenter,
  RadialMenuItem,
  type RadialMenuRef,
} from '../components/RadialMenu';
import { useAppState } from '../stores/AppState';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBleClimbSender } from '../lib/useBleClimbSender';

type Props = StaticScreenProps<{
  uuid: string | undefined;
}>;

export default function CreateScreen({}: Props) {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const {
    climbFilters,
    climbInProgress,
    updatePlacement,
    removePlacement,
    clearClimbInProgress,
    climbName,
    climbDescription,
    setClimbName,
    setClimbDescription,
    setAngle,
  } = useAppState();
  const { getRoles, insertClimb, ready } = useDatabase();
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

  const [isClimbInfoVisible, setIsClimbInfoVisible] = useState(false);
  const [isAngleSelectVisible, setIsAngleSelectVisible] = useState(false);

  const asyncRoles = useAsync(() => {
    return getRoles(1);
  }, [ready]);

  const { sendToBoard } = useBleClimbSender();

  // Send climb in progress to board when screen is focused (initial render + navigation)
  useFocusEffect(
    useCallback(() => {
      sendToBoard(climbInProgress);
    }, [climbInProgress]),
  );

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
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleSaveClimb}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Text style={{ color: '#007AFF', fontSize: 17 }}>Save</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <CreateScreenHeaderRight
          angle={climbFilters.angle}
          onAnglePress={() => setIsAngleSelectVisible(true)}
          onErasePress={clearClimbInProgress}
        />
      ),
    });
  }, [navigation, clearClimbInProgress, climbFilters.angle]);

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

  const handleSaveClimbInfo = (name: string, description: string) => {
    setClimbName(name);
    setClimbDescription(description);
  };

  const handleAngleSelect = (option: { label: string; value: number }) => {
    setAngle(option.value);
    setIsAngleSelectVisible(false);
  };

  const handleSaveClimb = async () => {
    try {
      // Validate that we have placements
      if (climbInProgress.size === 0) {
        // TODO: Show error message
        return;
      }

      // Save climb to database
      await insertClimb({
        name: climbName || 'Untitled Climb',
        description: climbDescription || '',
        frames: climbInProgress,
        angle: climbFilters.angle,
        setterUsername: 'LocalUser', // TODO: Get actual username
      });

      // Clear the creation state
      clearClimbInProgress();
      setClimbName('');
      setClimbDescription('');

      navigation.navigate('Climbs');
    } catch (error) {
      // TODO: Show error message to user
      console.error('Failed to save climb:', error);
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setContainerDimensions({ width, height });
      }}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsClimbInfoVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>{climbName || 'Untitled Climb'}</Text>
        <Text style={styles.description}>
          {climbDescription || 'Tap to add description'}
        </Text>
      </TouchableOpacity>
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

      <ClimbEditBottomSheet
        isVisible={isClimbInfoVisible}
        onBackdropPress={() => setIsClimbInfoVisible(false)}
        name={climbName}
        description={climbDescription}
        onSave={handleSaveClimbInfo}
      />
      <AngleSelectBottomSheet
        isVisible={isAngleSelectVisible}
        selectedAngle={climbFilters.angle}
        onSelect={handleAngleSelect}
        onBackdropPress={() => setIsAngleSelectVisible(false)}
      />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.grey1,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.grey2,
    minHeight: 20,
  },
}));
