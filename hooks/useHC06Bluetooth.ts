/**
 * Hook personalizado para manejar la conexión Bluetooth HC-06
 */

import { useState, useEffect, useCallback } from 'react';
import { HC06BluetoothService, ConnectionStatus, BluetoothDevice } from '@/services/HC06BluetoothService';

export interface UseHC06BluetoothReturn {
  // Estados
  isConnected: boolean;
  isConnecting: boolean;
  isScanning: boolean;
  connectedDevice: BluetoothDevice | null;
  error: string | null;
  lastConnected: Date | null;
  
  // Acciones
  initialize: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendCommand: (command: string) => Promise<boolean>;
  sendCommandAndWaitResponse: (command: string, timeout?: number) => Promise<string>;
  clearError: () => void;
}

export function useHC06Bluetooth(): UseHC06BluetoothReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    device: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suscribirse a cambios de conexión
  useEffect(() => {
    const unsubscribe = HC06BluetoothService.onConnectionChange((status) => {
      setConnectionStatus(status);
      if (status.error) {
        setError(status.error);
      }
      setIsConnecting(false);
    });

    return unsubscribe;
  }, []);

  // Inicializar servicio Bluetooth
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const success = await HC06BluetoothService.initialize();
      if (!success) {
        setError('No se pudo inicializar el servicio Bluetooth');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Conectar al dispositivo Command-Receiver
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setIsConnecting(true);
      
      const success = await HC06BluetoothService.connectToCommandReceiver();
      
      if (!success) {
        setError('No se pudo conectar al dispositivo Command-Receiver');
        setIsConnecting(false);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      setIsConnecting(false);
      return false;
    }
  }, []);

  // Desconectar del dispositivo
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await HC06BluetoothService.disconnect();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconectando';
      setError(errorMessage);
    }
  }, []);

  // Enviar comando
  const sendCommand = useCallback(async (command: string): Promise<boolean> => {
    try {
      setError(null);
      return await HC06BluetoothService.sendSerialCommand(command);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error enviando comando';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Enviar comando y esperar respuesta
  const sendCommandAndWaitResponse = useCallback(async (
    command: string, 
    timeout: number = 5000
  ): Promise<string> => {
    try {
      setError(null);
      return await HC06BluetoothService.sendCommandAndWaitResponse(command, timeout);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en comunicación';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    isConnected: connectionStatus.isConnected,
    isConnecting,
    isScanning: HC06BluetoothService.isCurrentlyScanning(),
    connectedDevice: connectionStatus.device,
    error,
    lastConnected: connectionStatus.lastConnected || null,
    
    // Acciones
    initialize,
    connect,
    disconnect,
    sendCommand,
    sendCommandAndWaitResponse,
    clearError,
  };
}