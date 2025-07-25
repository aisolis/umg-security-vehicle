/**
 * Definiciones de tipos para la aplicación
 */

// Tipos de autenticación
export interface User {
  id: string;
  username: string;
  email?: string;
  role?: 'admin' | 'driver' | 'guest';
  createdAt?: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Tipos de vehículo
export interface VehicleState {
  id: string;
  status: 'locked' | 'unlocked' | 'unknown';
  lastUpdate: Date;
  batteryLevel?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Tipos de Bluetooth
export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi?: number;
  isConnected: boolean;
}

export interface BluetoothConnectionState {
  isConnected: boolean;
  device: BluetoothDevice | null;
  isScanning: boolean;
  availableDevices: BluetoothDevice[];
}

// Tipos de comandos
export type VehicleCommand = 'lock' | 'unlock' | 'status' | 'locate';

export interface CommandResult {
  success: boolean;
  command: VehicleCommand;
  timestamp: Date;
  error?: string;
  data?: any;
}

// Tipos de notificaciones
export interface NotificationPayload {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actionable?: boolean;
}

// Tipos de configuración
export interface AppConfig {
  bluetoothTimeout: number;
  reconnectAttempts: number;
  hapticFeedback: boolean;
  autoLockTimeout?: number;
  notificationsEnabled: boolean;
}