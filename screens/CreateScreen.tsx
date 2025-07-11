import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Icon } from '@rneui/themed';
import BoardDisplay, { PlacementPressEvent } from '../components/BoardDisplay';
import BluetoothHeaderButton from '../components/BluetoothHeaderButton';
import BluetoothBottomSheet from '../components/BluetoothBottomSheet';
import { useAppState } from '../stores/AppState';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useAsync } from 'react-async-hook';
import { useLayoutEffect } from 'react';

type Props = StaticScreenProps<{
  uuid: string | undefined;
}>;

export default function CreateScreen({}: Props) {
  const navigation = useNavigation();
  const {
    climbInProgress,
    updatePlacement,
    removePlacement,
    clearClimbInProgress,
  } = useAppState();
  const { getRoles, ready } = useDatabase();

  const asyncRoles = useAsync(() => {
    return getRoles(1);
  }, [ready]);

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
            <Icon name="recycle" type="materialicons" size={24} color="#FF5722" />
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
    // TODO experiment with radial menu
    console.log('Long pressed placement:', event.placementId);
  };

  return (
    <View style={styles.container}>
      <BoardDisplay
        placements={climbInProgress}
        onLongPress={handleLongPress}
        onPress={handlePress}
      />
      <BluetoothBottomSheet />
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
