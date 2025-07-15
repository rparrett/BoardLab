import { create } from 'zustand';
import { BleManager, Device, State } from 'react-native-ble-plx';

const ADVERTISING_SERVICE_UUID = '4488B571-7806-4DF6-BCFF-A2897E4953FF';
const DATA_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const DATA_CHARACTERISTIC_UUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';

interface BluetoothState {
  // State
  bleManager: BleManager;
  bluetoothState: State;
  isScanning: boolean;
  devices: Device[];
  connectedDevice: Device | null;
  showDeviceScanner: boolean;

  // Actions
  setBluetoothState: (state: State) => void;
  setIsScanning: (scanning: boolean) => void;
  setDevices: (devices: Device[]) => void;
  addOrUpdateDevice: (device: Device) => void;
  setConnectedDevice: (device: Device | null) => void;
  setShowDeviceScanner: (show: boolean) => void;

  // BLE Operations
  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  handleBluetoothPress: () => void;
  writeToCharacteristic: (data: Uint8Array) => Promise<boolean>;

  // Lifecycle
  initializeBluetooth: () => void;
  cleanup: () => void;
}

export const useBluetoothState = create<BluetoothState>((set, get) => {
  const bleManager = new BleManager();
  let stateSubscription: any = null;

  return {
    // State
    bleManager,
    bluetoothState: 'Unknown',
    isScanning: false,
    devices: [],
    connectedDevice: null,
    showDeviceScanner: false,

    // Actions
    setBluetoothState: state => set({ bluetoothState: state }),
    setIsScanning: scanning => set({ isScanning: scanning }),
    setDevices: devices => set({ devices }),
    addOrUpdateDevice: device =>
      set(state => {
        const existingIndex = state.devices.findIndex(d => d.id === device.id);
        if (existingIndex >= 0) {
          const updated = [...state.devices];
          updated[existingIndex] = device;
          return { devices: updated };
        } else {
          return { devices: [...state.devices, device] };
        }
      }),
    setConnectedDevice: device => set({ connectedDevice: device }),
    setShowDeviceScanner: show => set({ showDeviceScanner: show }),

    // BLE Operations
    startScan: async () => {
      const {
        setIsScanning,
        setDevices,
        setShowDeviceScanner,
        addOrUpdateDevice,
      } = get();

      try {
        // Stop any existing scan first
        bleManager.stopDeviceScan();

        // Check and enable Bluetooth
        const state = await bleManager.state();
        console.debug('Bluetooth state:', state);

        if (state !== 'PoweredOn') {
          console.debug('Bluetooth is not powered on, enabling...');
          await bleManager.enable();
        }

        setIsScanning(true);
        setDevices([]);
        setShowDeviceScanner(true);

        console.debug('Starting BLE scan...');

        bleManager.startDeviceScan(
          [ADVERTISING_SERVICE_UUID],
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              console.error('BLE scan error:', error);
              setIsScanning(false);
              setShowDeviceScanner(false);
              return;
            }

            if (device) {
              console.debug(
                'Found device:',
                device.name || device.localName || device.id,
              );
              addOrUpdateDevice(device);
            }
          },
        );
      } catch (error) {
        console.error('Failed to start BLE scan:', error);
        setIsScanning(false);
        setShowDeviceScanner(false);
      }
    },

    stopScan: () => {
      const { setIsScanning } = get();
      bleManager.stopDeviceScan();
      setIsScanning(false);
    },

    connectToDevice: async (device: Device) => {
      const { stopScan, setConnectedDevice, setShowDeviceScanner } = get();

      try {
        stopScan();
        const connected = await device.connect();

        // Monitor connection state
        connected.onDisconnected((error, disconnectedDevice) => {
          console.debug('Device disconnected:', disconnectedDevice?.id, error);
          setConnectedDevice(null);
        });

        setConnectedDevice(connected);
        setShowDeviceScanner(false);
        console.debug('Connected to device:', device.name || device.id);
      } catch (error) {
        console.error('Connection error:', error);
        setConnectedDevice(null);
      }
    },

    disconnectDevice: async () => {
      const { connectedDevice, setConnectedDevice } = get();

      if (connectedDevice) {
        try {
          await connectedDevice.cancelConnection();
          setConnectedDevice(null);
          console.debug('Disconnected from device');
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }
    },

    writeToCharacteristic: async (data: Uint8Array) => {
      const { connectedDevice } = get();

      if (!connectedDevice) {
        console.error('No connected device for BLE write');
        return false;
      }

      try {
        // Discover services if not already done
        await connectedDevice.discoverAllServicesAndCharacteristics();

        // Convert Uint8Array to base64 string (required by react-native-ble-plx)
        const base64Data = btoa(String.fromCharCode(...data));

        console.log(`BLE: Writing to characteristic (${data.length} bytes):`);

        // Log the data for debugging
        data.forEach((byte, index) => {
          const ascii =
            byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '·';
          console.log(
            `BLE: [${index.toString().padStart(3)}]: 0x${byte
              .toString(16)
              .padStart(2, '0')
              .toUpperCase()} (${byte.toString().padStart(3)}) ${ascii}`,
          );
        });

        // Write to characteristic
        await connectedDevice.writeCharacteristicWithResponseForService(
          DATA_SERVICE_UUID,
          DATA_CHARACTERISTIC_UUID,
          base64Data,
        );

        console.log('BLE: Successfully wrote data to characteristic');
        return true;
      } catch (error) {
        console.error('BLE write error:', error);
        return false;
      }
    },

    handleBluetoothPress: () => {
      const { bluetoothState, connectedDevice, disconnectDevice, startScan } =
        get();

      if (bluetoothState !== 'PoweredOn') {
        return;
      }

      if (connectedDevice) {
        disconnectDevice();
      } else {
        startScan();
      }
    },

    // Lifecycle
    initializeBluetooth: () => {
      const { setBluetoothState, setConnectedDevice, connectedDevice } = get();

      // Verify connected device is still actually connected
      if (connectedDevice) {
        connectedDevice
          .isConnected()
          .then(isConnected => {
            if (!isConnected) {
              console.debug(
                'Device was not actually connected, clearing state',
              );
              setConnectedDevice(null);
            }
          })
          .catch(() => {
            console.debug('Error checking connection state, clearing');
            setConnectedDevice(null);
          });
      }

      // Monitor BLE state changes
      stateSubscription = bleManager.onStateChange(state => {
        console.debug('BLE state changed:', state);
        setBluetoothState(state);

        if (state !== 'PoweredOn' && get().connectedDevice) {
          console.debug('BLE powered off, clearing connected device');
          setConnectedDevice(null);
        }
      }, true);
    },

    cleanup: () => {
      const { stopScan, connectedDevice } = get();

      stopScan();
      if (connectedDevice) {
        connectedDevice
          .cancelConnection()
          .catch(e => console.debug('Error during cleanup disconnect:', e));
      }
      if (stateSubscription) {
        stateSubscription.remove();
      }
    },
  };
});
