import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';
import { useBluetoothState } from '../stores/BluetoothState';

export default function BluetoothHeaderButton() {
  const { bluetoothState, connectedDevice, handleBluetoothPress } =
    useBluetoothState();

  const getBluetoothIcon = () => {
    if (bluetoothState !== 'PoweredOn') {
      return {
        name: 'bluetooth-disabled',
        color: '#FF5722', // Orange/red for disabled
      };
    }
    if (connectedDevice) {
      return {
        name: 'bluetooth-connected',
        color: '#4CAF50', // Green for connected
      };
    }
    return {
      name: 'bluetooth',
      color: '#757575', // Gray for disconnected but available
    };
  };

  const { name, color } = getBluetoothIcon();

  return (
    <TouchableOpacity onPress={handleBluetoothPress} style={styles.button}>
      <Icon name={name} type="materialicons" size={24} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginRight: 8,
  },
});
