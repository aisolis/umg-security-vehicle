import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  Lock, 
  Unlock, 
  LogOut, 
  Bluetooth, 
  BluetoothOff, 
  Car, 
  Shield, 
  ShieldCheck,
  AlertTriangle,
  Settings,
  User,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';
import { BluetoothService } from '@/services/BluetoothService';
import { AuthService } from '@/services/AuthService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
      await BluetoothService.initialize();
      setIsConnected(true);
      setVehicleState('locked');
    } catch (error) {
      console.log('Bluetooth initialization failed:', error);
      setIsConnected(false);
    }
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleVehicleAction = async (action: 'lock' | 'unlock') => {
    if (!isConnected) {
      Alert.alert('Sin Conexión', 'No hay conexión Bluetooth disponible');
      return;
    }

    setIsProcessing(true);
    triggerHapticFeedback();

    try {
      const success = await BluetoothService.sendCommand(action);
      
      if (success) {
        setVehicleState(action === 'lock' ? 'locked' : 'unlocked');
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert(
          'Éxito',
          `Vehículo ${action === 'lock' ? 'bloqueado' : 'desbloqueado'} correctamente`
        );
      } else {
        Alert.alert('Error', 'No se pudo completar la acción. Intente nuevamente.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de comunicación con el vehículo');
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

  const getVehicleStatusConfig = () => {
    switch (vehicleState) {
      case 'locked':
        return {
          icon: <ShieldCheck size={48} color={colors.success[500]} strokeWidth={1.5} />,
          title: 'Vehículo Seguro',
          subtitle: 'El vehículo está bloqueado',
          badgeVariant: 'success' as const,
          badgeText: 'Bloqueado',
        };
      case 'unlocked':
        return {
          icon: <Shield size={48} color={colors.warning[500]} strokeWidth={1.5} />,
          title: 'Vehículo Disponible',
          subtitle: 'El vehículo está desbloqueado',
          badgeVariant: 'default' as const,
          badgeText: 'Desbloqueado',
        };
      default:
        return {
          icon: <AlertTriangle size={48} color={colors.secondary[400]} strokeWidth={1.5} />,
          title: 'Estado Desconocido',
          subtitle: isConnected ? 'Verificando estado...' : 'Sin conexión',
          badgeVariant: 'secondary' as const,
          badgeText: 'Desconocido',
        };
    }
  };

  const statusConfig = getVehicleStatusConfig();

  return (
    <LinearGradient
      colors={[colors.background, colors.primary[50]]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.userAvatar}>
                <User size={24} color={colors.primary[600]} />
              </View>
              <View>
                <Text style={styles.welcomeText}>Bienvenido</Text>
                <Text style={styles.usernameText}>{userInfo?.username || 'Usuario'}</Text>
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Settings size={20} color={colors.secondary[600]} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
                <LogOut size={20} color={colors.secondary[600]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bluetooth Status */}
          <Card style={styles.bluetoothCard}>
            <CardContent style={styles.bluetoothContent}>
              <View style={styles.bluetoothInfo}>
                {isConnected ? (
                  <Bluetooth size={20} color={colors.success[500]} />
                ) : (
                  <BluetoothOff size={20} color={colors.destructive[500]} />
                )}
                <Text style={styles.bluetoothText}>
                  {isConnected ? 'Dispositivo Conectado' : 'Sin Conexión Bluetooth'}
                </Text>
              </View>
              <Badge variant={isConnected ? 'success' : 'destructive'}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </CardContent>
          </Card>

          {/* Vehicle Status */}
          <Card style={styles.vehicleCard}>
            <CardHeader style={styles.vehicleHeader}>
              <View style={styles.vehicleIconContainer}>
                <Car size={64} color={colors.secondary[400]} strokeWidth={1} />
                <View style={styles.statusIconOverlay}>
                  {statusConfig.icon}
                </View>
              </View>
            </CardHeader>
            
            <CardContent style={styles.vehicleContent}>
              <View style={styles.vehicleStatus}>
                <Text style={styles.vehicleTitle}>{statusConfig.title}</Text>
                <Text style={styles.vehicleSubtitle}>{statusConfig.subtitle}</Text>
                <Badge variant={statusConfig.badgeVariant} style={styles.statusBadge}>
                  {statusConfig.badgeText}
                </Badge>
              </View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <Button
              onPress={() => handleVehicleAction('lock')}
              disabled={!isConnected || isProcessing || vehicleState === 'locked'}
              loading={isProcessing && vehicleState !== 'locked'}
              variant="destructive"
              size="lg"
              style={styles.actionButton}
            >
              <View style={styles.buttonContent}>
                <Lock size={24} color={colors.destructive[50]} strokeWidth={2} />
                <Text style={styles.buttonText}>BLOQUEAR</Text>
              </View>
            </Button>

            <Button
              onPress={() => handleVehicleAction('unlock')}
              disabled={!isConnected || isProcessing || vehicleState === 'unlocked'}
              loading={isProcessing && vehicleState !== 'unlocked'}
              variant="default"
              size="lg"
              style={styles.actionButton}
            >
              <View style={styles.buttonContent}>
                <Unlock size={24} color={colors.primary[50]} strokeWidth={2} />
                <Text style={styles.buttonText}>DESBLOQUEAR</Text>
              </View>
            </Button>
          </View>

          {/* Emergency Info */}
          <Card variant="outline" style={styles.emergencyCard}>
            <CardContent style={styles.emergencyContent}>
              <Shield size={16} color={colors.secondary[400]} />
              <Text style={styles.emergencyText}>
                En caso de emergencia, contacte al administrador del sistema
              </Text>
            </CardContent>
          </Card>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginBottom: spacing[6],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  welcomeText: {
    ...typography.label.default,
    color: colors.secondary[500],
  },
  usernameText: {
    ...typography.heading.h4,
    color: colors.foreground,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  bluetoothCard: {
    marginBottom: spacing[4],
  },
  bluetoothContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  bluetoothInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bluetoothText: {
    ...typography.body.default,
    color: colors.foreground,
    marginLeft: spacing[3],
  },
  vehicleCard: {
    marginBottom: spacing[6],
  },
  vehicleHeader: {
    alignItems: 'center',
    paddingBottom: spacing[4],
  },
  vehicleIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconOverlay: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    padding: spacing[2],
    ...shadows.md,
  },
  vehicleContent: {
    paddingTop: 0,
  },
  vehicleStatus: {
    alignItems: 'center',
  },
  vehicleTitle: {
    ...typography.heading.h3,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  vehicleSubtitle: {
    ...typography.body.default,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  statusBadge: {
    alignSelf: 'center',
  },
  actionContainer: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  actionButton: {
    height: 64,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  buttonText: {
    ...typography.button.large,
    fontWeight: '600',
  },
  emergencyCard: {
    marginBottom: spacing[4],
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  emergencyText: {
    ...typography.body.small,
    color: colors.mutedForeground,
    marginLeft: spacing[3],
    flex: 1,
  },
});