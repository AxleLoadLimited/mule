import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useEffect, useState } from 'react';
import { Button, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import { BleManager, Characteristic, Device } from 'react-native-ble-plx';


const DEVICE_NAME = 'MyBLEDevice'; // Change to your target device name
const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc'; // Replace with actual
const CHARACTERISTIC_UUID = 'abcdefab-1234-1234-1234-abcdefabcdef'; // Replace with actual

const manager = new BleManager({});

export default function TabTwoScreen() {
  const [device, setDevice] = useState<Device | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error('Scan error:', error);
      setErrors((prevErrors) => [...prevErrors, error.message]);
      return;
    }

    if (typeof device?.name === 'string') {
      setDeviceNames([...deviceNames, device.name]);
    }
  });

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        const allGranted = Object.values(granted).every((g) => g === PermissionsAndroid.RESULTS.GRANTED);
        if (!allGranted) {
          console.warn('Bluetooth permissions not granted');
        }
      }
    };

    init();

    return () => {
      manager.destroy();
    };
  }, []);

  const scanAndConnect = () => {
    manager.startDeviceScan(null, null, async (error, scannedDevice) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (scannedDevice?.name === DEVICE_NAME) {
        manager.stopDeviceScan();

        try {
          const connectedDevice = await scannedDevice.connect();
          await connectedDevice.discoverAllServicesAndCharacteristics();
          setDevice(connectedDevice);
          readData(connectedDevice);
        } catch (err) {
          console.error('Connection error:', err);
        }
      }
    });
  };

  const readData = async (connectedDevice: Device) => {
    try {
      const characteristic: Characteristic = await connectedDevice.readCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID
      );

      if (characteristic.value) {
        const decoded = Buffer.from(characteristic.value, 'base64').toString('utf-8');
        setData(decoded);
      }
    } catch (err) {
      console.error('Read error:', err);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
    <View style={{ padding: 20 }}>
      <Button title="Scan & Connect" onPress={scanAndConnect} />
      {device && <Text>Connected to: {device.name}</Text>}
      {data && <Text>Data: {data}</Text>}
      <Text>Scanned Devices:</Text>
      {deviceNames.map((name, index) => (
        <Text key={index}>{name}</Text>
      ))}
      {errors.map((error, index) => (
        <Text key={index}>{error}</Text>
      ))}
    </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
