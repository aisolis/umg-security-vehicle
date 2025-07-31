import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Bluetooth, BluetoothOff, Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, shadows } from '@/styles';
import { BluetoothDevice } from '@/services/HC06BluetoothService';

interface HC06ConnectionCardProps {
  isConnected: boolean;
  isConnecting: boolean;
  isScanning: boolean;
  connectedDevice: BluetoothDevice | null;
  error: string | null;
  lastConnected: Date | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onRetry: () => void;
}

export function HC06ConnectionCard({
  isConnected,
  isConnecting,
  isScanning,
  connectedDevice,
  error,
  lastConnected,
  onConnect,
  onDisconnect,
  onRetry,
}: HC06ConnectionCardProps) {
  const getStatusConfig = () => {
    if (isConnecting || isScanning) {
      return {
        icon: <ActivityIndicator size={24} color={colors.accent.main} />,
        title: isScanning ? 'Buscando Command-Receiver...' : 'Conectando...',
        subtitle: 'Por favor espere',
        backgroundColor: colors.accent.light + '20',
        borderColor: colors.accent.main,
        showButton: false,
      };
    }

    if (isConnected && connectedDevice) {
      return {
        icon: <Bluetooth size={24} color={colors.success.main} />,
        title: 'Conectado a Command-Receiver',
        subtitle: `Dirección: ${connectedDevice.address}`,
        backgroundColor: colors.success.light + '20',
        borderColor: colors.success.main,
        showButton: true,
        buttonText: 'Desconectar',
        buttonAction: onDisconnect,
        buttonColor: colors.error.main,
      };
    }

    if (error) {
      return {
        icon: <BluetoothOff size={24} color={colors.error.main} />,
        title: 'Error de Conexión',
        subtitle: error,
        backgroundColor: colors.error.light + '20',
        borderColor: colors.error.main,
        showButton: true,
        buttonText: 'Reintentar',
        buttonAction: onRetry,
        buttonColor: colors.accent.main,
      };
    }

    return {
      icon: <BluetoothOff size={24} color={colors.neutral.medium} />,
      title: 'Desconectado',
      subtitle: lastConnected 
        ? `Última conexión: ${lastConnected.toLocaleTimeString()}`
        : 'Nunca conectado',
      backgroundColor: colors.neutral.light + '20',
      borderColor: colors.neutral.medium,
      showButton: true,
      buttonText: 'Conectar',
      buttonAction: onConnect,
      buttonColor: colors.success.main,
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={[styles.container, shadows.small]}>
      <View style={[
        styles.statusIndicator,
        { backgroundColor: statusConfig.backgroundColor }
      ]}>
        {statusConfig.icon}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{statusConfig.title}</Text>
          <Text style={styles.subtitle}>{statusConfig.subtitle}</Text>
        </View>

        {statusConfig.showButton && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: statusConfig.buttonColor }
            ]}
            onPress={statusConfig.buttonAction}
            disabled={isConnecting || isScanning}
          >
            <Text style={styles.buttonText}>{statusConfig.buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Indicador de dispositivo específico */}
      <View style={styles.deviceInfo}>
        <View style={styles.deviceBadge}>
          <Text style={styles.deviceBadgeText}>HC-06</Text>
        </View>
        <Text style={styles.deviceName}>Command-Receiver</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    marginVertical: spacing.medium,
    overflow: 'hidden',
  },
  statusIndicator: {
    padding: spacing.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  content: {
    padding: spacing.medium,
    paddingTop: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  title: {
    ...typography.body.medium,
    fontWeight: '600',
    color: colors.neutral.dark,
    textAlign: 'center',
    marginBottom: spacing.xsmall,
  },
  subtitle: {
    ...typography.caption.medium,
    color: colors.neutral.medium,
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button.small,
    color: colors.neutral.white,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.small,
    backgroundColor: colors.neutral.light,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.light,
  },
  deviceBadge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.small,
  },
  deviceBadgeText: {
    ...typography.caption.small,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  deviceName: {
    ...typography.caption.medium,
    color: colors.neutral.dark,
    fontWeight: '500',
  },
});