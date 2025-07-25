import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing, shadows } from '@/styles';

interface ActionButtonProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  type: 'lock' | 'unlock';
}

export function ActionButton({
  title,
  icon,
  onPress,
  disabled = false,
  loading = false,
  style,
  type,
}: ActionButtonProps) {
  const getButtonColors = () => {
    if (disabled) {
      return {
        backgroundColor: colors.neutral.medium,
        shadowColor: 'transparent',
      };
    }
    
    switch (type) {
      case 'lock':
        return {
          backgroundColor: colors.error.main,
          shadowColor: colors.error.main,
        };
      case 'unlock':
        return {
          backgroundColor: colors.success.main,
          shadowColor: colors.success.main,
        };
      default:
        return {
          backgroundColor: colors.primary.main,
          shadowColor: colors.primary.main,
        };
    }
  };

  const buttonColors = getButtonColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: buttonColors.backgroundColor,
          shadowColor: buttonColors.shadowColor,
        },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.neutral.white} />
            <Text style={styles.loadingText}>Procesando...</Text>
          </View>
        ) : (
          <>
            <View style={styles.iconContainer}>
              {icon}
            </View>
            <Text style={[
              styles.buttonText,
              disabled && styles.buttonTextDisabled
            ]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 70,
    justifyContent: 'center',
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.small,
  },
  buttonText: {
    ...typography.button.medium,
    color: colors.neutral.white,
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: colors.neutral.light,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    ...typography.caption.medium,
    color: colors.neutral.white,
    marginTop: spacing.small,
  },
});