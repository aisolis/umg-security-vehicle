/**
 * HC06BluetoothService - Servicio específico para dispositivo HC-06 "Command-Receiver"
 * Maneja la conexión serial Bluetooth con el dispositivo específico
 */

import * as Bluetooth from 'expo-bluetooth';
import { Platform } from 'react-native';

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi?: number;
  isConnected: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  device: BluetoothDevice | null;
  lastConnected?: Date;
  error?: string;
}

class HC06BluetoothServiceClass {
  private static instance: HC06BluetoothServiceClass;
  private connectedDevice: BluetoothDevice | null = null;
  private isScanning: boolean = false;
  private connectionListeners: ((status: ConnectionStatus) => void)[] = [];
  
  // Configuración específica para HC-06
  private readonly TARGET_DEVICE_NAME = 'Command-Receiver';
  private readonly DEVICE_PIN = '2025';
  private readonly CONNECTION_TIMEOUT = 15000; // 15 segundos
  private readonly SCAN_TIMEOUT = 10000; // 10 segundos
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    if (HC06BluetoothServiceClass.instance) {
      return HC06BluetoothServiceClass.instance;
    }
    HC06BluetoothServiceClass.instance = this;
  }

  /**
   * Inicializar el servicio Bluetooth
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔵 Inicializando servicio Bluetooth HC-06...');
      
      // Verificar si Bluetooth está disponible
      const isAvailable = await Bluetooth.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Bluetooth no está disponible en este dispositivo');
      }

      // Verificar si Bluetooth está habilitado
      const isEnabled = await Bluetooth.isEnabledAsync();
      if (!isEnabled) {
        console.log('📱 Solicitando habilitar Bluetooth...');
        const enabled = await Bluetooth.requestEnableAsync();
        if (!enabled) {
          throw new Error('Bluetooth debe estar habilitado para continuar');
        }
      }

      // Solicitar permisos necesarios
      await this.requestPermissions();

      console.log('✅ Servicio Bluetooth inicializado correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error inicializando Bluetooth:', error);
      this.notifyConnectionChange({
        isConnected: false,
        device: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      return false;
    }
  }

  /**
   * Solicitar permisos necesarios para Bluetooth
   */
  private async requestPermissions(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // En Android se necesitan permisos específicos
        const permissions = await Bluetooth.requestPermissionsAsync();
        if (!permissions.granted) {
          throw new Error('Permisos de Bluetooth denegados');
        }
      }
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      throw error;
    }
  }

  /**
   * Buscar específicamente el dispositivo "Command-Receiver"
   */
  async findCommandReceiver(): Promise<BluetoothDevice | null> {
    try {
      console.log('🔍 Buscando dispositivo "Command-Receiver"...');
      this.isScanning = true;

      // Primero buscar en dispositivos emparejados
      const pairedDevice = await this.findInPairedDevices();
      if (pairedDevice) {
        console.log('✅ Dispositivo encontrado en emparejados:', pairedDevice.name);
        return pairedDevice;
      }

      // Si no está emparejado, escanear dispositivos cercanos
      console.log('🔍 Escaneando dispositivos cercanos...');
      const scannedDevice = await this.scanForDevice();
      
      this.isScanning = false;
      return scannedDevice;

    } catch (error) {
      console.error('❌ Error buscando dispositivo:', error);
      this.isScanning = false;
      return null;
    }
  }

  /**
   * Buscar en dispositivos emparejados
   */
  private async findInPairedDevices(): Promise<BluetoothDevice | null> {
    try {
      const pairedDevices = await Bluetooth.getBondedDevicesAsync();
      
      const targetDevice = pairedDevices.find(device => 
        device.name === this.TARGET_DEVICE_NAME
      );

      if (targetDevice) {
        return {
          id: targetDevice.id,
          name: targetDevice.name,
          address: targetDevice.address || 'Unknown',
          isConnected: false,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo dispositivos emparejados:', error);
      return null;
    }
  }

  /**
   * Escanear dispositivos cercanos
   */
  private async scanForDevice(): Promise<BluetoothDevice | null> {
    return new Promise((resolve) => {
      let foundDevice: BluetoothDevice | null = null;
      
      // Configurar timeout para el escaneo
      const scanTimeout = setTimeout(() => {
        Bluetooth.stopScanningAsync();
        resolve(foundDevice);
      }, this.SCAN_TIMEOUT);

      // Iniciar escaneo
      Bluetooth.startScanningAsync({
        onDeviceFound: (device) => {
          console.log('📱 Dispositivo encontrado:', device.name);
          
          if (device.name === this.TARGET_DEVICE_NAME) {
            console.log('🎯 ¡Command-Receiver encontrado!');
            foundDevice = {
              id: device.id,
              name: device.name,
              address: device.address || 'Unknown',
              rssi: device.rssi,
              isConnected: false,
            };
            
            // Detener escaneo inmediatamente
            clearTimeout(scanTimeout);
            Bluetooth.stopScanningAsync();
            resolve(foundDevice);
          }
        },
        onError: (error) => {
          console.error('❌ Error durante escaneo:', error);
          clearTimeout(scanTimeout);
          resolve(null);
        }
      });
    });
  }

  /**
   * Conectar al dispositivo Command-Receiver
   */
  async connectToCommandReceiver(): Promise<boolean> {
    try {
      console.log('🔗 Iniciando conexión a Command-Receiver...');

      // Buscar el dispositivo
      const device = await this.findCommandReceiver();
      if (!device) {
        throw new Error('Dispositivo "Command-Receiver" no encontrado');
      }

      // Intentar conexión con reintentos
      let connected = false;
      for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
        console.log(`🔄 Intento de conexión ${attempt}/${this.MAX_RETRY_ATTEMPTS}...`);
        
        try {
          connected = await this.attemptConnection(device);
          if (connected) break;
        } catch (error) {
          console.log(`❌ Intento ${attempt} falló:`, error);
          if (attempt < this.MAX_RETRY_ATTEMPTS) {
            await this.delay(2000); // Esperar 2 segundos antes del siguiente intento
          }
        }
      }

      if (connected) {
        this.connectedDevice = { ...device, isConnected: true };
        console.log('✅ Conectado exitosamente a Command-Receiver');
        
        this.notifyConnectionChange({
          isConnected: true,
          device: this.connectedDevice,
          lastConnected: new Date()
        });
        
        return true;
      } else {
        throw new Error('No se pudo establecer conexión después de múltiples intentos');
      }

    } catch (error) {
      console.error('❌ Error conectando a Command-Receiver:', error);
      this.notifyConnectionChange({
        isConnected: false,
        device: null,
        error: error instanceof Error ? error.message : 'Error de conexión'
      });
      return false;
    }
  }

  /**
   * Intentar conexión individual
   */
  private async attemptConnection(device: BluetoothDevice): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Timeout de conexión'));
      }, this.CONNECTION_TIMEOUT);

      Bluetooth.connectToDeviceAsync(device.id, {
        pin: this.DEVICE_PIN, // PIN específico para HC-06
        onConnected: () => {
          clearTimeout(connectionTimeout);
          console.log('🔗 Conexión establecida');
          resolve(true);
        },
        onDisconnected: () => {
          clearTimeout(connectionTimeout);
          console.log('🔌 Dispositivo desconectado');
          this.handleDisconnection();
          resolve(false);
        },
        onError: (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ Error de conexión:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Enviar comando serial al HC-06
   */
  async sendSerialCommand(command: string): Promise<boolean> {
    if (!this.connectedDevice?.isConnected) {
      throw new Error('No hay dispositivo conectado');
    }

    try {
      console.log('📤 Enviando comando:', command);
      
      // Formatear comando para HC-06 (agregar terminador de línea)
      const formattedCommand = command.endsWith('\n') ? command : command + '\n';
      
      // Enviar comando
      await Bluetooth.writeAsync(this.connectedDevice.id, formattedCommand);
      
      console.log('✅ Comando enviado exitosamente');
      return true;

    } catch (error) {
      console.error('❌ Error enviando comando:', error);
      throw error;
    }
  }

  /**
   * Leer respuesta del HC-06
   */
  async readSerialResponse(timeout: number = 5000): Promise<string> {
    if (!this.connectedDevice?.isConnected) {
      throw new Error('No hay dispositivo conectado');
    }

    try {
      console.log('📥 Esperando respuesta...');
      
      const response = await Promise.race([
        Bluetooth.readAsync(this.connectedDevice.id),
        this.delay(timeout).then(() => { throw new Error('Timeout esperando respuesta'); })
      ]);

      console.log('✅ Respuesta recibida:', response);
      return response.trim();

    } catch (error) {
      console.error('❌ Error leyendo respuesta:', error);
      throw error;
    }
  }

  /**
   * Enviar comando y esperar respuesta
   */
  async sendCommandAndWaitResponse(command: string, timeout: number = 5000): Promise<string> {
    await this.sendSerialCommand(command);
    return await this.readSerialResponse(timeout);
  }

  /**
   * Desconectar del dispositivo
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice?.isConnected) {
      try {
        console.log('🔌 Desconectando de Command-Receiver...');
        await Bluetooth.disconnectFromDeviceAsync(this.connectedDevice.id);
        this.handleDisconnection();
        console.log('✅ Desconectado exitosamente');
      } catch (error) {
        console.error('❌ Error desconectando:', error);
      }
    }
  }

  /**
   * Manejar desconexión
   */
  private handleDisconnection(): void {
    this.connectedDevice = null;
    this.notifyConnectionChange({
      isConnected: false,
      device: null
    });
  }

  /**
   * Verificar estado de conexión
   */
  isConnected(): boolean {
    return this.connectedDevice?.isConnected || false;
  }

  /**
   * Obtener dispositivo conectado
   */
  getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  /**
   * Verificar si está escaneando
   */
  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  /**
   * Suscribirse a cambios de conexión
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notificar cambios de conexión
   */
  private notifyConnectionChange(status: ConnectionStatus): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('❌ Error en callback de conexión:', error);
      }
    });
  }

  /**
   * Utilidad para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance(): HC06BluetoothServiceClass {
    if (!HC06BluetoothServiceClass.instance) {
      HC06BluetoothServiceClass.instance = new HC06BluetoothServiceClass();
    }
    return HC06BluetoothServiceClass.instance;
  }
}

export const HC06BluetoothService = HC06BluetoothServiceClass.getInstance();