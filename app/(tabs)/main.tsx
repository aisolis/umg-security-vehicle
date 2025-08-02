import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Lock, Clock as Unlock, LogOut, Bluetooth, BluetoothOff, Car, Shield, ShieldCheck } from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';
import { BluetoothService } from '@/services/BluetoothService';
import { AuthService } from '@/services/AuthService';
import { VehicleStatusCard } from '@/components/vehicle/VehicleStatusCard';
import { ActionButton } from '@/components/common/ActionButton';
import { Toast } from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';

const { width } = Dimensions.get('window');

type VehicleState = 'locked' | 'unlocked' | 'unknown';

export default function MainScreen() {
  const [vehicleState, setVehicleState] = useState<VehicleState>('unknown');
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const { toast, showSuccess, showError, showWarning, showInfo, hideToast } = useToast();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setUserInfo(user);

    initializeBluetoothConnection();

    // Verificar estado de conexión cada 5 segundos
    const connectionCheckInterval = setInterval(async () => {
      const actualConnectionState = await BluetoothService.isDeviceConnectedAsync();
      if (actualConnectionState !== isConnected) {
        console.log(`🔄 Actualizando estado de conexión UI: ${actualConnectionState}`);
        setIsConnected(actualConnectionState);
      }
    }, 5000);

    // Manejar cambios de estado de la app
    const handleAppStateChange = (nextAppState: string) => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App va al background - desconectar limpiamente
        console.log('App going to background, disconnecting...');
        BluetoothService.disconnect();
        setIsConnected(false);
      } else if (nextAppState === 'active' && !BluetoothService.isDeviceConnected()) {
        // App vuelve al foreground - reconectar
        console.log('App returning to foreground, reconnecting...');
        setTimeout(() => {
          initializeBluetoothConnection();
        }, 1000); // Pequeño delay para asegurar limpieza
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup al desmontar
    return () => {
      clearInterval(connectionCheckInterval);
      subscription?.remove();
      console.log('Component unmounting, disconnecting...');
      BluetoothService.disconnect();
    };
  }, [isConnected]);

  const initializeBluetoothConnection = async () => {
    try {
      setIsSearching(true);
      console.log('🔵 Inicializando Bluetooth...');
      
      const initialized = await BluetoothService.initialize();
      
      if (!initialized) {
        console.log('❌ Bluetooth initialization failed');
        setIsConnected(false);
        setIsSearching(false);
        return;
      }

      console.log('✅ Bluetooth initialized, buscando Arduino...');
      showInfo(
        'Buscando Arduino',
        'Escaneando dispositivos cercanos...',
        3000
      );
      
      // Intentar conectar al Arduino
      const connected = await BluetoothService.autoConnect();
      
      if (connected) {
        const device = BluetoothService.getConnectedDevice();
        console.log('✅ Conectado al Arduino:', device?.name);
        setIsConnected(true);
        setVehicleState('locked');
        
        showSuccess(
          'Arduino Conectado',
          `Conectado a ${device?.name || 'dispositivo'}`,
          3000
        );
      } else {
        console.log('❌ No se pudo conectar al Arduino');
        setIsConnected(false);
        
        // Mostrar toast de error al usuario
        showError(
          'Arduino no encontrado',
          'No se pudo conectar al Arduino. Asegúrate de que esté encendido y cerca.',
          6000
        );
      }
      
    } catch (error) {
      console.log('❌ Error durante conexión Bluetooth:', error);
      setIsConnected(false);
      
      showError(
        'Error de Bluetooth',
        'Error al conectar con el dispositivo. Revisa los permisos y que el Bluetooth esté activado.',
        5000
      );
    } finally {
      setIsSearching(false);
    }
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleVehicleAction = async (action: 'lock' | 'unlock') => {
    // Verificar si realmente está conectado al Arduino (verificación precisa)
    const actuallyConnected = await BluetoothService.isDeviceConnectedAsync();
    
    if (!actuallyConnected) {
      // Actualizar UI inmediatamente si la conexión se perdió
      setIsConnected(false);
      
      showWarning(
        'Sin Conexión',
        'No hay conexión con el Arduino. Toque la tarjeta de estado para reconectar.',
        5000
      );
      
      return;
    }

    setIsProcessing(true);
    triggerHapticFeedback();

    try {
      console.log(`📤 Enviando comando: ${action}`);
      const success = await BluetoothService.sendCommand(action);
      
      if (success) {
        console.log(`✅ Comando ${action} enviado exitosamente`);
        setVehicleState(action === 'lock' ? 'locked' : 'unlocked');
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        showSuccess(
          '¡Éxito!',
          `Vehículo ${action === 'lock' ? 'bloqueado' : 'desbloqueado'} correctamente`,
          3000
        );
      } else {
        console.log(`❌ Error enviando comando ${action}`);
        showError(
          'Error',
          'No se pudo completar la acción. Verifique la conexión.',
          4000
        );
      }
    } catch (error) {
      console.log('❌ Error durante envío de comando:', error);
      
      showError(
        'Error de Comunicación',
        'Error al comunicarse con el Arduino. Toque la tarjeta de estado para reconectar.',
        5000
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro que desea cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[colors.neutral.dark, colors.primary.main]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Bienvenido</Text>
              <Text style={styles.usernameText}>{userInfo?.name || 'Usuario'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={24} color={colors.neutral.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Bluetooth Status */}
          <View style={styles.bluetoothStatus}>
            <View style={styles.bluetoothIndicator}>
              {isConnected ? (
                <Bluetooth size={20} color={colors.success.main} />
              ) : (
                <BluetoothOff size={20} color={colors.error.main} />
              )}
              <Text style={[
                styles.bluetoothText,
                { color: isConnected ? colors.success.main : colors.error.main }
              ]}>
                {isConnected ? 'Conectado' : 'Sin Conexión'}
              </Text>
            </View>
          </View>

          {/* Vehicle Status Card */}
          <VehicleStatusCard 
            state={vehicleState}
            isConnected={isConnected}
            isSearching={isSearching}
            onRetryConnection={initializeBluetoothConnection}
          />

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <ActionButton
              title="BLOQUEAR"
              icon={<Lock size={28} color={colors.neutral.white} strokeWidth={2.5} />}
              onPress={() => handleVehicleAction('lock')}
              disabled={!isConnected || isProcessing || vehicleState === 'locked'}
              loading={isProcessing && vehicleState !== 'locked'}
              style={[styles.actionButton, styles.lockButton]}
              type="lock"
            />

            <ActionButton
              title="DESBLOQUEAR"
              icon={<Unlock size={28} color={colors.neutral.white} strokeWidth={2.5} />}
              onPress={() => handleVehicleAction('unlock')}
              disabled={!isConnected || isProcessing || vehicleState === 'unlocked'}
              loading={isProcessing && vehicleState !== 'unlocked'}
              style={[styles.actionButton, styles.unlockButton]}
              type="unlock"
            />
          </View>

          {/* Emergency Info */}
          <View style={styles.emergencyInfo}>
            <Shield size={16} color={colors.neutral.medium} />
            <Text style={styles.emergencyText}>
              En caso de emergencia, contacte al administrador
            </Text>
          </View>
        </View>
      </SafeAreaView>
      
      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        duration={toast.duration}
        onHide={hideToast}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.medium,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.caption.medium,
    color: colors.neutral.light,
  },
  usernameText: {
    ...typography.heading.medium,
    color: colors.neutral.white,
  },
  logoutButton: {
    padding: spacing.small,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.large,
  },
  bluetoothStatus: {
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  bluetoothIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 20,
  },
  bluetoothText: {
    ...typography.caption.medium,
    marginLeft: spacing.small,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.medium,
  },
  actionButton: {
    width: width * 0.6,
    height: 70,
  },
  lockButton: {},
  unlockButton: {},
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: spacing.small
  },
  emergencyText: {
    ...typography.caption.small,
    color: colors.neutral.medium,
    marginLeft: spacing.small,
    textAlign: 'center'
  },
});