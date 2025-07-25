import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Car, Shield, ShieldCheck, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { colors, typography, spacing, shadows } from '@/styles';

interface VehicleStatusCardProps {
  state: 'locked' | 'unlocked' | 'unknown';
  isConnected: boolean;
}

export function VehicleStatusCard({ state, isConnected }: VehicleStatusCardProps) {
  const getStatusConfig = () => {
    switch (state) {
      case 'locked':
        return {
          icon: <ShieldCheck size={48} color={colors.success.main} strokeWidth={2} />,
          title: 'Vehículo Bloqueado',
          subtitle: 'El vehículo está seguro',
          backgroundColor: colors.success.light,
          borderColor: colors.success.main,
        };
      case 'unlocked':
        return {
          icon: <Shield size={48} color={colors.warning.main} strokeWidth={2} />,
          title: 'Vehículo Desbloqueado',
          subtitle: 'El vehículo está disponible',
          backgroundColor: colors.warning.light,
          borderColor: colors.warning.main,
        };
      default:
        return {
          icon: <AlertTriangle size={48} color={colors.neutral.medium} strokeWidth={2} />,
          title: 'Estado Desconocido',
          subtitle: isConnected ? 'Verificando estado...' : 'Sin conexión',
          backgroundColor: colors.neutral.light,
          borderColor: colors.neutral.medium,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={[styles.container, shadows.small]}>
      <View style={styles.content}>
        {/* Vehicle Icon */}
        <View style={styles.vehicleIcon}>
          <Car size={48} color={colors.neutral.dark} strokeWidth={1.5} />
        </View>

        {/* Status Icon */}
        <View style={[
          styles.statusIcon,
          { backgroundColor: statusConfig.backgroundColor + '20' }
        ]}>
          {statusConfig.icon}
        </View>

        {/* Status Text */}
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>{statusConfig.title}</Text>
          <Text style={styles.statusSubtitle}>{statusConfig.subtitle}</Text>
        </View>

        {/* Connection Indicator */}
        <View style={[
          styles.connectionIndicator,
          {
            backgroundColor: isConnected 
              ? colors.success.main + '20' 
              : colors.error.main + '20'
          }
        ]}>
          <View style={[
            styles.connectionDot,
            {
              backgroundColor: isConnected 
                ? colors.success.main 
                : colors.error.main
            }
          ]} />
          <Text style={[
            styles.connectionText,
            {
              color: isConnected 
                ? colors.success.dark 
                : colors.error.dark
            }
          ]}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
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
  content: {
    padding: spacing.medium,
    alignItems: 'center',
  },
  vehicleIcon: {
    marginBottom: spacing.small,
  },
  statusIcon: {
    padding: spacing.small,
    borderRadius: 50,
    marginBottom: spacing.small,
  },
  statusText: {
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  statusTitle: {
    ...typography.body.large,
    color: colors.neutral.dark,
    textAlign: 'center',
    marginBottom: spacing.xsmall,
  },
  statusSubtitle: {
    ...typography.body.small,
    color: colors.neutral.medium,
    textAlign: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.small,
    borderRadius: 12,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.small,
  },
  connectionText: {
    ...typography.caption.medium,
    fontWeight: '500',
  },
});