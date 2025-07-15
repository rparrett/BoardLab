import { useCallback } from 'react';
import {
  convertFramesToBleData,
  encodeHoldsData,
  ApiLevel,
} from '../lib/ble-protocol';
import { useDatabase } from '../contexts/DatabaseProvider';
import { useBluetoothState } from '../stores/BluetoothState';
import { useAsync } from 'react-async-hook';
import { type ClimbPlacements } from '../lib/frames-utils';

export function useBleClimbSender() {
  const { connectedDevice, writeToCharacteristic } = useBluetoothState();
  const { getPlacementData, getRoles, ready } = useDatabase();

  const asyncPlacementData = useAsync(() => {
    return getPlacementData();
  }, [ready]);

  const asyncRoles = useAsync(() => {
    return getRoles(1); // TODO: Get product ID from somewhere
  }, [ready]);

  const sendToBoard = useCallback(
    async (climbPlacements: ClimbPlacements): Promise<boolean> => {
      if (
        !climbPlacements ||
        !asyncPlacementData.result ||
        !asyncRoles.result ||
        !connectedDevice
      ) {
        console.log('Cannot send to board - missing data or connection');
        return false;
      }

      const placementData = asyncPlacementData.result;
      const roles = asyncRoles.result;

      console.log('=== BLE Debug Info ===');
      console.log('Climb placements:', Array.from(climbPlacements.entries()));

      // Convert to BLE data format using the climb placements
      const bleData = convertFramesToBleData(
        climbPlacements,
        placementData,
        roles,
      );
      console.log('BLE data (position, [r,g,b]):', bleData);

      // Always encode and send, even if empty (to clear the board)
      const encodedData = encodeHoldsData(bleData, ApiLevel.Three);
      console.log('Encoded packet length:', encodedData.length, 'bytes');

      // Send to the board
      const success = await writeToCharacteristic(encodedData);
      if (success) {
        console.log(
          bleData.length > 0
            ? 'Successfully sent climb data to board'
            : 'Successfully cleared board (empty climb)',
        );
      } else {
        console.error('Failed to send data to board');
      }
      console.log('=== End BLE Debug ===');
      return success;
    },
    [
      asyncPlacementData.result,
      asyncRoles.result,
      connectedDevice,
      writeToCharacteristic,
    ],
  );

  return { sendToBoard };
}
