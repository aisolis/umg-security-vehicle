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
import { Lock, Clock as Unlock, LogOut, Bluetooth, BluetoothOff, Car, Shield, ShieldCheck } from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';
import { BluetoothService } from '@/services/BluetoothService';
import { AuthService } from '@/services/AuthService';
import { VehicleStatusCard } from '@/components/vehicle/VehicleStatusCard';
import { ActionButton } from '@/components/common/ActionButton';

const { width } = Dimensions.get('window');

type VehicleState = 'locked' | 'unlocked' | 'unknown';

export default function MainScreen() {
  const [vehicleState, setVehicleState] = useState<VehicleState>('unknown');
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setUserInfo(user);

    initializeBluetoothConnection();
  }, []);

  const initializeBluetoothConnection = async () => {
    try {
      console.log('🔵 Inicializando Bluetooth...');
      const initialized = await BluetoothService.initialize();
      
      if (!initialized) {
        console.log('❌ Bluetooth initialization failed');
        setIsConnected(false);
        return;
      }

      console.log('✅ Bluetooth initialized, buscando Arduino...');
      
      // Intentar conectar al Arduino
      const connected = await BluetoothService.autoConnect();
      
      if (connected) {
        const device = BluetoothService.getConnectedDevice();
        console.log('✅ Conectado al Arduino:', device?.name);
        setIsConnected(true);
        setVehicleState('locked');
      } else {
        console.log('❌ No se pudo conectar al Arduino');
        setIsConnected(false);
        
        // Mostrar alerta al usuario
        Alert.alert(
          'Arduino no encontrado',
          'No se pudo conectar al Arduino. Asegúrate de que esté encendido y cerca.',
          [
            { text: 'Reintentar', onPress: () => initializeBluetoothConnection() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
      
    } catch (error) {
      console.log('❌ Error durante conexión Bluetooth:', error);
      setIsConnected(false);
      
      Alert.alert(
        'Error de Bluetooth',
        'Error al conectar con el dispositivo. Revisa los permisos y que el Bluetooth esté activado.'
      );
    }
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleVehicleAction = async (action: 'lock' | 'unlock') => {
    // Verificar si realmente está conectado al Arduino
    const actuallyConnected = BluetoothService.isDeviceConnected();
    
    if (!actuallyConnected) {
      Alert.alert(
        'Sin Conexión', 
        'No hay conexión con el Arduino. ¿Desea intentar reconectar?',
        [
          { text: 'Reconectar', onPress: () => initializeBluetoothConnection() },
          { text: 'Cancelar', style: 'cancel' }
        ]
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
        
        Alert.alert(
          'Éxito',
          `Vehículo ${action === 'lock' ? 'bloqueado' : 'desbloqueado'} correctamente`
        );
      } else {
        console.log(`❌ Error enviando comando ${action}`);
        Alert.alert('Error', 'No se pudo completar la acción. Verifique la conexión.');
      }
    } catch (error) {
      console.log('❌ Error durante envío de comando:', error);
      Alert.alert(
        'Error de Comunicación', 
        'Error al comunicarse con el Arduino. ¿Desea intentar reconectar?',
        [
          { text: 'Reconectar', onPress: () => initializeBluetoothConnection() },
          { text: 'Cancelar', style: 'cancel' }
        ]
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
          onPress: () => {
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