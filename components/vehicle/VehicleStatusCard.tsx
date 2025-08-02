import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Car, Shield, ShieldCheck, TriangleAlert as AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, shadows } from '@/styles';

interface VehicleStatusCardProps {
  state: 'locked' | 'unlocked' | 'unknown';
  isConnected: boolean;
  isSearching?: boolean;
  onRetryConnection?: () => void;
}

export function VehicleStatusCard({ state, isConnected, isSearching = false, onRetryConnection }: VehicleStatusCardProps) {
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
        if (isSearching) {
          return {
            icon: <ActivityIndicator size="large" color={colors.info.main} />,
            title: 'Buscando Arduino...',
            subtitle: 'Escaneando dispositivos cercanos',
            backgroundColor: colors.info.light,
            borderColor: colors.info.main,
          };
        }
        return {
          icon: <AlertTriangle size={48} color={colors.neutral.medium} strokeWidth={2} />,
          title: 'Estado Desconocido',
          subtitle: isConnected ? 'Verificando estado...' : 'Sin conexión - Toque para reconectar',
          backgroundColor: colors.neutral.light,
          borderColor: colors.neutral.medium,
        };
    }
  };

  const statusConfig = getStatusConfig();
  
  // Determinar si la card debe ser clickeable
  const isClickable = !isConnected && !isSearching && onRetryConnection;

  const CardComponent = isClickable ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[
        styles.container, 
        shadows.small,
        isClickable && styles.clickableCard,
        isSearching && styles.searchingCard
      ]}
      onPress={isClickable ? onRetryConnection : undefined}
      activeOpacity={isClickable ? 0.7 : 1}
    >
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
            backgroundColor: isSearching
              ? colors.info.main + '20'
              : isConnected 
                ? colors.success.main + '20' 
                : colors.error.main + '20'
          }
        ]}>
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.info.main} style={{ marginRight: spacing.small }} />
          ) : (
            <View style={[
              styles.connectionDot,
              {
                backgroundColor: isConnected 
                  ? colors.success.main 
                  : colors.error.main
              }
            ]} />
          )}
          <Text style={[
            styles.connectionText,
            {
              color: isSearching
                ? colors.info.dark
                : isConnected 
                  ? colors.success.dark 
                  : colors.error.dark
            }
          ]}>
            {isSearching ? 'Buscando...' : isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>

        {/* Hint for retry when clickable */}
        {isClickable && (
          <View style={styles.retryHint}>
            <RefreshCw size={16} color={colors.accent.main} />
            <Text style={styles.retryHintText}>Toque para reconectar</Text>
          </View>
        )}
      </View>
    </CardComponent>
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
  clickableCard: {
    borderWidth: 2,
    borderColor: colors.accent.main + '40',
    borderStyle: 'dashed',
  },
  searchingCard: {
    borderWidth: 2,
    borderColor: colors.info.main + '60',
  },
  retryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.small,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    backgroundColor: colors.accent.main + '10',
    borderRadius: 8,
  },
  retryHintText: {
    ...typography.caption.small,
    color: colors.accent.dark,
    marginLeft: spacing.xsmall,
    fontWeight: '500',
  },
});