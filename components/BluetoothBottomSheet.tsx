import React from 'react';
import { ActivityIndicator } from 'react-native';
import { BottomSheet, ListItem, makeStyles } from '@rn-vui/themed';
import BottomSheetHeader from './BottomSheetHeader';
import { useBluetoothState } from '../stores/BluetoothState';

type ParsedDeviceName = {
  friendlyName: string;
  protocolLevel: number;
  serialNumber: string;
} | null;

const parseDeviceName = (name: string | null): ParsedDeviceName => {
  if (!name || name === 'null' || name === 'undefined') return null;

  // Format: "Friendly Name#SerialNumber@ProtocolLevel" or "Friendly Name@ProtocolLevel"
  const match = name.match(/^(.+?)(?:#(\d+))?@(\d+)$/);
  if (!match) return null;

  return {
    friendlyName: match[1],
    protocolLevel: parseInt(match[3], 10),
    serialNumber: match[2] || '',
  };
};

export default function BluetoothBottomSheet() {
  const {
    showDeviceScanner,
    devices,
    isScanning,
    setShowDeviceScanner,
    stopScan,
    connectToDevice,
  } = useBluetoothState();

  const handleBackdropPress = () => {
    setShowDeviceScanner(false);
    stopScan();
  };
  const styles = useStyles();

  return (
    <BottomSheet
      isVisible={showDeviceScanner}
      onBackdropPress={handleBackdropPress}
      scrollViewProps={{ style: styles.container }}
    >
      <BottomSheetHeader
        title="Bluetooth Devices"
        onClose={handleBackdropPress}
      />

      {isScanning && (
        <ListItem containerStyle={styles.scanningItem}>
          <ActivityIndicator size="small" />
          <ListItem.Content>
            <ListItem.Title>Scanning for devices...</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      )}

      {devices.length === 0 && !isScanning && (
        <ListItem containerStyle={styles.listItemContainer}>
          <ListItem.Content>
            <ListItem.Title>No devices found</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      )}

      {devices.map((device, index) => {
        const parsedName = parseDeviceName(device.localName);

        const noDeviceMetadata = parsedName?.friendlyName === null;
        const displayName =
          parsedName?.friendlyName || device.name || 'Unknown Device';
        const isLastItem = index === devices.length - 1;

        return (
          <ListItem
            key={device.id}
            onPress={() => connectToDevice(device)}
            bottomDivider={!isLastItem}
            containerStyle={[
              styles.listItemContainer,
              noDeviceMetadata && styles.greyedOutContainer,
            ]}
            disabled={noDeviceMetadata}
          >
            <ListItem.Content>
              <ListItem.Title style={noDeviceMetadata && styles.greyedOutText}>
                {displayName}
              </ListItem.Title>
              <ListItem.Subtitle style={styles.greyedOutText}>
                Serial: {parsedName?.serialNumber || '?'} API Level:{' '}
                {parsedName?.protocolLevel ?? '?'}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        );
      })}
    </BottomSheet>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    backgroundColor: theme.colors.secondarySurface,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: 20,
  },
  listItemContainer: {
    backgroundColor: theme.colors.secondarySurface,
  },
  greyedOutContainer: {
    opacity: 0.5,
  },
  greyedOutText: {
    color: theme.colors.grey3,
  },
  scanningItem: {
    backgroundColor: theme.colors.secondarySurface,
    paddingVertical: 16,
  },
}));
