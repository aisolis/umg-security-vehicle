/**
 * HC06BluetoothService - Implementación Web (Mock)
 * Esta es una implementación mock para web ya que Bluetooth no está disponible
 */

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

  constructor() {
    if (HC06BluetoothServiceClass.instance) {
      return HC06BluetoothServiceClass.instance;
    }
    HC06BluetoothServiceClass.instance = this;
  }

  /**
   * Inicializar el servicio Bluetooth (Mock para web)
   */
  async initialize(): Promise<boolean> {
    console.log('🌐 Bluetooth no disponible en web - usando implementación mock');
    this.notifyConnectionChange({
      isConnected: false,
      device: null,
      error: 'Bluetooth no disponible en plataforma web'
    });
    return false;
  }

  /**
   * Buscar específicamente el dispositivo "Command-Receiver" (Mock)
   */
  async findCommandReceiver(): Promise<BluetoothDevice | null> {
    console.log('🌐 Mock: Simulando búsqueda de Command-Receiver...');
    return null;
  }

  /**
   * Conectar al dispositivo Command-Receiver (Mock)
   */
  async connectToCommandReceiver(): Promise<boolean> {
    console.log('🌐 Mock: Bluetooth no disponible en web');
    this.notifyConnectionChange({
      isConnected: false,
      device: null,
      error: 'Bluetooth requiere dispositivo móvil nativo'
    });
    return false;
  }

  /**
   * Enviar comando serial al HC-06 (Mock)
   */
  async sendSerialCommand(command: string): Promise<boolean> {
    console.log('🌐 Mock: Enviando comando:', command);
    throw new Error('Bluetooth no disponible en plataforma web');
  }

  /**
   * Leer respuesta del HC-06 (Mock)
   */
  async readSerialResponse(timeout: number = 5000): Promise<string> {
    console.log('🌐 Mock: Leyendo respuesta...');
    throw new Error('Bluetooth no disponible en plataforma web');
  }

  /**
   * Enviar comando y esperar respuesta (Mock)
   */
  async sendCommandAndWaitResponse(command: string, timeout: number = 5000): Promise<string> {
    console.log('🌐 Mock: Comando y respuesta:', command);
    throw new Error('Bluetooth no disponible en plataforma web');
  }

  /**
   * Desconectar del dispositivo (Mock)
   */
  async disconnect(): Promise<void> {
    console.log('🌐 Mock: Desconectando...');
    this.handleDisconnection();
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
    return false; // Siempre false en web
  }

  /**
   * Obtener dispositivo conectado
   */
  getConnectedDevice(): BluetoothDevice | null {
    return null; // Siempre null en web
  }

  /**
   * Verificar si está escaneando
   */
  isCurrentlyScanning(): boolean {
    return false; // Siempre false en web
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