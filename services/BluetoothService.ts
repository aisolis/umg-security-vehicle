/**
 * BluetoothService - Servicio para comunicación Bluetooth BLE
 * Integrado con react-native-ble-plx
 */

import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { encode } from 'react-native-base64';

type VehicleCommand = 'lock' | 'unlock' | 'status';
type CommandResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

class BluetoothServiceClass {
  private manager: BleManager;
  private isInitialized: boolean = false;
  private isConnected: boolean = false;
  private connectedDevice: Device | null = null;
  private scanSubscription: any = null;
  
  // Configuración específica para dispositivos BLE del vehículo
  private readonly VEHICLE_DEVICE_PATTERNS = [
    'VehicleControl',     // Nombre personalizado del dispositivo
    'HC-05',              // Módulo Bluetooth común
    'HC-06',              // Módulo Bluetooth común
    'ESP32',              // Si usas ESP32 con Bluetooth
    'Arduino',            // Nombre genérico
  ];
  
  // UUID de servicio específico para tu dispositivo BLE
  private readonly VEHICLE_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'; // Nordic UART Service UUID
  private readonly VEHICLE_CHARACTERISTIC_RX = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
  private readonly VEHICLE_CHARACTERISTIC_TX = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
  
  private readonly CONNECTION_TIMEOUT = 10000; // 10 segundos
  private readonly SCAN_TIMEOUT = 10000; // 10 segundos para escaneo

  constructor() {
    this.manager = new BleManager();
  }

  /**
   * Solicitar permisos de Bluetooth necesarios
   */
  private async requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allPermissionsGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allPermissionsGranted) {
          Alert.alert(
            'Permisos requeridos',
            'La aplicación necesita permisos de Bluetooth para funcionar correctamente.'
          );
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn('Error requesting permissions:', error);
        return false;
      }
    }
    return true; // iOS maneja permisos automáticamente
  }

  /**
   * Inicializar el servicio Bluetooth
   */
  async initialize(): Promise<boolean> {
    try {
      // Solicitar permisos
      const permissionsGranted = await this.requestBluetoothPermissions();
      if (!permissionsGranted) {
        return false;
      }

      // Verificar estado del Bluetooth
      const state = await this.manager.state();
      if (state !== State.PoweredOn) {
        Alert.alert(
          'Bluetooth desactivado',
          'Por favor activa el Bluetooth para usar esta funcionalidad.'
        );
        return false;
      }
      
      this.isInitialized = true;
      console.log('Bluetooth service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Bluetooth initialization failed:', error);
      return false;
    }
  }

  /**
   * Conectar a un dispositivo BLE específico
   */
  async connectToDevice(device: Device): Promise<boolean> {
    try {
      console.log(`Conectando a: ${device.name} (${device.id})`);
      
      // Conectar al dispositivo
      const connectedDevice = await device.connect();
      
      // Descubrir servicios y características
      const deviceWithServices = await connectedDevice.discoverAllServicesAndCharacteristics();
      
      this.connectedDevice = deviceWithServices;
      this.isConnected = true;
      
      console.log('Conexión establecida exitosamente');
      
      // Configurar listener para desconexión
      device.onDisconnected(() => {
        console.log('Dispositivo desconectado');
        this.isConnected = false;
        this.connectedDevice = null;
      });
      
      return true;
    } catch (error) {
      console.error('Error connecting to device:', error);
      this.isConnected = false;
      this.connectedDevice = null;
      return false;
    }
  }

  /**
   * Buscar y conectar automáticamente al primer dispositivo del vehículo
   */
  async autoConnect(): Promise<boolean> {
    try {
      console.log('Buscando dispositivos del vehículo...');
      
      const availableDevices = await this.scanDevices();
      const vehicleDevices = this.filterVehicleDevices(availableDevices);
      
      if (vehicleDevices.length === 0) {
        console.log('No se encontraron dispositivos del vehículo');
        return false;
      }
      
      // Intentar conectar al dispositivo con mejor señal
      const bestDevice = vehicleDevices[0];
      console.log(`Intentando conectar a: ${bestDevice.name}`);
      
      return await this.connectToDevice(bestDevice);
      
    } catch (error) {
      console.error('Auto-connection failed:', error);
      return false;
    }
  }

  /**
   * Filtrar dispositivos para encontrar solo los del vehículo
   */
  filterVehicleDevices(devices: Device[]): Device[] {
    return devices.filter(device => {
      if (!device.name) return false;
      
      return this.VEHICLE_DEVICE_PATTERNS.some(pattern => 
        device.name!.toLowerCase().includes(pattern.toLowerCase())
      );
    }).sort((a, b) => (b.rssi || -100) - (a.rssi || -100)); // Ordenar por señal más fuerte
  }

  /**
   * Enviar comando al vehículo via BLE
   */
  async sendCommand(command: VehicleCommand): Promise<boolean> {
    if (!this.isConnected || !this.connectedDevice) {
      throw new Error('No hay conexión Bluetooth');
    }

    try {
      const commandMap = {
        lock: 'LOCK\n',
        unlock: 'UNLOCK\n',
        status: 'STATUS\n',
      };
      
      const commandString = commandMap[command];
      console.log(`Enviando comando: ${commandString.trim()}`);
      
      // Convertir comando a base64
      const commandBase64 = encode(commandString);
      
      // Enviar comando a través de la característica RX
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        this.VEHICLE_SERVICE_UUID,
        this.VEHICLE_CHARACTERISTIC_RX,
        commandBase64
      );
      
      console.log(`Comando ${command} enviado exitosamente`);
      return true;
      
    } catch (error) {
      console.error('Error enviando comando:', error);
      return false;
    }
  }

  /**
   * Verificar estado de conexión
   */
  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Obtener información del dispositivo conectado
   */
  getConnectedDevice(): { name: string; id: string; rssi: number | null } | null {
    if (!this.isConnected || !this.connectedDevice) return null;
    
    return {
      name: this.connectedDevice.name || 'Dispositivo desconocido',
      id: this.connectedDevice.id,
      rssi: this.connectedDevice.rssi,
    };
  }

  /**
   * Reconectar al dispositivo
   */
  async reconnect(): Promise<boolean> {
    try {
      await this.disconnect();
      return await this.autoConnect();
    } catch (error) {
      console.error('Reconnection failed:', error);
      return false;
    }
  }

  /**
   * Desconectar del dispositivo
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connectedDevice) {
        await this.connectedDevice.cancelConnection();
      }
      if (this.scanSubscription) {
        this.manager.stopDeviceScan();
        this.scanSubscription = null;
      }
    } catch (error) {
      console.error('Error during disconnection:', error);
    } finally {
      this.isConnected = false;
      this.connectedDevice = null;
      console.log('Desconectado del dispositivo Bluetooth');
    }
  }

  /**
   * Escanear dispositivos BLE disponibles
   */
  async scanDevices(): Promise<Device[]> {
    if (!this.isInitialized) {
      throw new Error('Bluetooth service not initialized');
    }

    console.log('Escaneando dispositivos BLE...');
    
    const devices: Device[] = [];
    const deviceMap = new Map<string, Device>();

    return new Promise((resolve, reject) => {
      // Detener escaneo previo si existe
      if (this.scanSubscription) {
        this.manager.stopDeviceScan();
        this.scanSubscription = null;
      }

      // Configurar timeout para el escaneo
      const scanTimeout = setTimeout(() => {
        this.manager.stopDeviceScan();
        console.log(`Escaneo completado. Encontrados ${devices.length} dispositivos`);
        resolve(devices);
      }, this.SCAN_TIMEOUT);

      // Iniciar escaneo
      this.scanSubscription = this.manager.startDeviceScan(
        null, // Escanear todos los servicios
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            clearTimeout(scanTimeout);
            this.manager.stopDeviceScan();
            reject(error);
            return;
          }

          if (device && device.name && !deviceMap.has(device.id)) {
            deviceMap.set(device.id, device);
            devices.push(device);
            console.log(`Dispositivo encontrado: ${device.name} (${device.id}) RSSI: ${device.rssi}`);
          }
        }
      );
    });
  }

}

export const BluetoothService = new BluetoothServiceClass();