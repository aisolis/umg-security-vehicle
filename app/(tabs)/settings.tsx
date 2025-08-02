import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Settings as SettingsIcon, 
  Fingerprint, 
  Smartphone, 
  Eye, 
  Shield, 
  User,
  LogOut,
  Bluetooth,
  Trash2
} from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';
import { AuthService } from '@/services/AuthService';
import { BluetoothService } from '@/services/BluetoothService';
import * as SecureStore from 'expo-secure-store';
import { Toast } from '@/components/common/Toast';
import { useToast } from '@/hooks/useToast';

interface BiometricSettings {
  enabled: boolean;
  preferredMethod: 'fingerprint' | null;
}

export default function SettingsScreen() {
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [biometricSettings, setBiometricSettings] = useState<BiometricSettings>({
    enabled: false,
    preferredMethod: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [arduinoMAC, setArduinoMAC] = useState<string | null>(null);
  const { toast, showSuccess, showError, showWarning, showInfo, hideToast } = useToast();

  useEffect(() => {
    loadUserInfo();
    loadBiometricSettings();
    loadArduinoConfiguration();
  }, []);

  const loadUserInfo = () => {
    const user = AuthService.getCurrentUser();
    setUserInfo(user);
  };

  const loadBiometricSettings = async () => {
    try {
      const settings = await SecureStore.getItemAsync('biometric_settings');
      if (settings) {
        setBiometricSettings(JSON.parse(settings));
      }
    } catch (error) {
      console.log('No biometric settings found:', error);
    }
  };

  const loadArduinoConfiguration = () => {
    const configuredMAC = BluetoothService.getArduinoMAC();
    setArduinoMAC(configuredMAC);
  };

  const handleClearArduinoConfiguration = () => {
    Alert.alert(
      'Limpiar Configuración Arduino',
      '¿Está seguro que desea limpiar la configuración del Arduino? La próxima conexión escaneará todos los dispositivos nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            BluetoothService.clearArduinoMAC();
            setArduinoMAC(null);
            showSuccess(
              'Configuración Limpiada',
              'La configuración del Arduino ha sido eliminada.',
              3000
            );
          },
        },
      ]
    );
  };

  const saveBiometricSettings = async (newSettings: BiometricSettings) => {
    try {
      await SecureStore.setItemAsync('biometric_settings', JSON.stringify(newSettings));
      setBiometricSettings(newSettings);
    } catch (error) {
      console.error('Error saving biometric settings:', error);
    }
  };

  const toggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      // Detectar métodos disponibles y mostrar solo esos
      const capabilities = await AuthService.getBiometricCapabilities();
      
      if (!capabilities.hasHardware || !capabilities.isEnrolled) {
        showError(
          'No Disponible',
          'Este dispositivo no tiene autenticación biométrica configurada. Configure Touch ID o huella digital en las opciones del sistema primero.',
          5000
        );
        return;
      }

      // Solo verificar huella digital
      if (await AuthService.isBiometricTypeAvailable('fingerprint')) {
        setupBiometric('fingerprint');
      } else {
        showError(
          'No Disponible',
          'La huella digital no está disponible en este dispositivo. Configure Touch ID o huella digital en las opciones del sistema primero.',
          5000
        );
      }
    } else {
      // Desactivar biométricos
      await AuthService.disableBiometricAuthentication();
      await saveBiometricSettings({
        enabled: false,
        preferredMethod: null,
      });
      showSuccess('Éxito', 'Autenticación biométrica desactivada', 3000);
    }
  };

  const setupBiometric = async (method: 'fingerprint') => {
    setIsLoading(true);
    try {
      // Verificar disponibilidad del método
      const isAvailable = await AuthService.isBiometricTypeAvailable(method);
      
      if (!isAvailable) {
        showError(
          'No Disponible',
          'La huella digital no está disponible en este dispositivo. Verifique que esté configurado en las opciones del sistema.',
          5000
        );
        return;
      }

      // Configurar autenticación biométrica
      const success = await AuthService.setupBiometricAuthentication(method);
      
      if (success) {
        // Actualizar settings locales
        await saveBiometricSettings({
          enabled: true,
          preferredMethod: method,
        });

        showSuccess(
          'Configuración Exitosa',
          'Huella digital configurada correctamente. Ahora podrá usarla para iniciar sesión.',
          4000
        );
      }
    } catch (error: any) {
      console.error('Error setting up biometric:', error);
      showError(
        'Error',
        error.message || 'No se pudo configurar la autenticación biométrica',
        5000
      );
    } finally {
      setIsLoading(false);
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

  const getBiometricIcon = () => {
    if (biometricSettings.preferredMethod === 'fingerprint') {
      return <Fingerprint size={20} color={colors.success.main} />;
    }
    return <Shield size={20} color={colors.neutral.medium} />;
  };

  return (
    <LinearGradient
      colors={[colors.neutral.dark, colors.primary.main]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configuración</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color={colors.neutral.white} />
              <Text style={styles.sectionTitle}>Información del Usuario</Text>
            </View>
            <View style={styles.userCard}>
              <Text style={styles.userName}>{userInfo?.name || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{userInfo?.email || 'email@ejemplo.com'}</Text>
            </View>
          </View>

          {/* Biometric Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color={colors.neutral.white} />
              <Text style={styles.sectionTitle}>Seguridad</Text>
            </View>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  {getBiometricIcon()}
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Autenticación Biométrica</Text>
                    <Text style={styles.settingDescription}>
                      {biometricSettings.enabled 
                        ? 'Configurado: Huella Digital'
                        : 'Desactivada'
                      }
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricSettings.enabled}
                  onValueChange={toggleBiometrics}
                  trackColor={{ false: colors.neutral.medium, true: colors.success.light }}
                  thumbColor={biometricSettings.enabled ? colors.success.main : colors.neutral.light}
                  disabled={isLoading}
                />
              </View>
              
            </View>
          </View>

          {/* Arduino Configuration Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bluetooth size={20} color={colors.neutral.white} />
              <Text style={styles.sectionTitle}>Configuración Arduino</Text>
            </View>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Bluetooth size={20} color={arduinoMAC ? colors.success.main : colors.neutral.medium} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Arduino Configurado</Text>
                    <Text style={styles.settingDescription}>
                      {arduinoMAC 
                        ? `MAC: ${arduinoMAC.substring(0, 17)}...` 
                        : 'No configurado - se escaneará automáticamente'
                      }
                    </Text>
                  </View>
                </View>
              </View>
              
              {arduinoMAC && (
                <TouchableOpacity 
                  style={styles.clearArduinoButton}
                  onPress={handleClearArduinoConfiguration}
                >
                  <Trash2 size={16} color={colors.error.main} />
                  <Text style={styles.clearArduinoText}>Limpiar Configuración</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SettingsIcon size={20} color={colors.neutral.white} />
              <Text style={styles.sectionTitle}>Aplicación</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>VehicleGuard v1.0.0</Text>
              <Text style={styles.infoSubtext}>Sistema de Control Vehicular</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error.main} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  headerTitle: {
    ...typography.heading.medium,
    color: colors.neutral.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.large,
  },
  section: {
    marginBottom: spacing.xlarge,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    ...typography.heading.small,
    color: colors.neutral.white,
    marginLeft: spacing.small,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.large,
    borderRadius: 12,
  },
  userName: {
    ...typography.heading.small,
    color: colors.neutral.white,
    marginBottom: spacing.small,
  },
  userEmail: {
    ...typography.body.medium,
    color: colors.neutral.light,
  },
  settingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.large,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: spacing.medium,
    flex: 1,
  },
  settingLabel: {
    ...typography.body.medium,
    color: colors.neutral.white,
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.caption.medium,
    color: colors.neutral.light,
  },
  changeMethodButton: {
    marginTop: spacing.medium,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  changeMethodText: {
    ...typography.caption.medium,
    color: colors.accent.main,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.large,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    ...typography.body.medium,
    color: colors.neutral.white,
    marginBottom: spacing.small,
  },
  infoSubtext: {
    ...typography.caption.medium,
    color: colors.neutral.light,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.large,
    borderRadius: 12,
    marginBottom: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  logoutText: {
    ...typography.body.medium,
    color: colors.error.main,
    marginLeft: spacing.small,
  },
  clearArduinoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.medium,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.error.main + '40',
  },
  clearArduinoText: {
    ...typography.caption.medium,
    color: colors.error.main,
    marginLeft: spacing.small,
    fontWeight: '500',
  },
});