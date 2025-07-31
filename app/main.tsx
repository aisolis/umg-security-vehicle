import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Lock, Clock as Unlock, LogOut, Shield } from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';
import { AuthService } from '@/services/AuthService';
import { VehicleStatusCard } from '@/components/vehicle/VehicleStatusCard';
import { ActionButton } from '@/components/common/ActionButton';
import { HC06ConnectionCard } from '@/components/bluetooth/HC06ConnectionCard';
import { useHC06Bluetooth } from '@/hooks/useHC06Bluetooth';

const { width } = Dimensions.get('window');

type VehicleState = 'locked' | 'unlocked' | 'unknown';

export default function MainScreen() {
  const [vehicleState, setVehicleState] = useState<VehicleState>('unknown');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string } | null>(null);

  // Hook para manejar Bluetooth HC-06
  const {
    isConnected,
    isConnecting,
    isScanning,
    connectedDevice,
    error,
    lastConnected,
    initialize,
    connect,
    disconnect,
    sendCommand,
    clearError,
  } = useHC06Bluetooth();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setUserInfo(user);

    // Inicializar Bluetooth automáticamente
    initializeBluetooth();
  }, []);

  const initializeBluetooth = async () => {
    try {
      const success = await initialize();
      if (success) {
        console.log('✅ Bluetooth inicializado correctamente');
      }
    } catch (error) {
      console.error('❌ Error inicializando Bluetooth:', error);
    }
  };

  const handleConnect = async () => {
    clearError();
    const success = await connect();
    if (success) {
      setVehicleState('locked'); // Estado inicial cuando se conecta
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setVehicleState('unknown');
  };

  const handleRetry = async () => {
    clearError();
    await handleConnect();
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleVehicleAction = async (action: 'lock' | 'unlock') => {
    if (!isConnected) {
      Alert.alert('Sin Conexión', 'Debe conectarse al dispositivo Command-Receiver primero');
      return;
    }

    setIsProcessing(true);
    triggerHapticFeedback();

    try {
      // Enviar comando específico al HC-06
      const command = action === 'lock' ? 'LOCK' : 'UNLOCK';
      const success = await sendCommand(command);
      
      if (success) {
        setVehicleState(action === 'lock' ? 'locked' : 'unlocked');
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert(
          'Éxito',
          `Comando ${command} enviado correctamente al Command-Receiver`
        );
      } else {
        Alert.alert('Error', 'No se pudo enviar el comando. Intente nuevamente.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de comunicación con el dispositivo HC-06');
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
          onPress: () => {
            // Desconectar Bluetooth antes de cerrar sesión
            if (isConnected) {
              disconnect();
            }
            AuthService.logout();
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
              <Text style={styles.usernameText}>{userInfo?.username || 'Usuario'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={24} color={colors.neutral.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* HC-06 Connection Card */}
          <HC06ConnectionCard
            isConnected={isConnected}
            isConnecting={isConnecting}
            isScanning={isScanning}
            connectedDevice={connectedDevice}
            error={error}
            lastConnected={lastConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRetry={handleRetry}
          />

          {/* Vehicle Status Card */}
          <VehicleStatusCard 
            state={vehicleState}
            isConnected={isConnected}
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
              Dispositivo: HC-06 "Command-Receiver" | PIN: 2025
            </Text>
          </View>
        </View>
      </SafeAreaView>
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
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.large,
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
    marginBottom: spacing.large,
  },
  emergencyText: {
    ...typography.caption.small,
    color: colors.neutral.medium,
    marginLeft: spacing.small,
    textAlign: 'center',
  },
});