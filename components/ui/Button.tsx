import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: colors.primary[900],
          borderColor: 'transparent',
        };
      case 'destructive':
        return {
          backgroundColor: colors.destructive[500],
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          borderWidth: 1,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary[100],
          borderColor: 'transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'link':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.primary[900],
          borderColor: 'transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 36,
          paddingHorizontal: spacing[3],
          borderRadius: borderRadius.md,
        };
      case 'lg':
        return {
          height: 44,
          paddingHorizontal: spacing[8],
          borderRadius: borderRadius.md,
        };
      case 'icon':
        return {
          height: 40,
          width: 40,
          paddingHorizontal: 0,
          borderRadius: borderRadius.md,
        };
      default:
        return {
          height: 40,
          paddingHorizontal: spacing[4],
          borderRadius: borderRadius.md,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.mutedForeground;
    
    switch (variant) {
      case 'default':
      case 'destructive':
        return colors.primary[50];
      case 'outline':
      case 'ghost':
        return colors.foreground;
      case 'secondary':
        return colors.foreground;
      case 'link':
        return colors.primary[600];
      default:
        return colors.primary[50];
    }
  };

  const getTextStyles = () => {
    switch (size) {
      case 'sm':
        return typography.button.small;
      case 'lg':
        return typography.button.large;
      default:
        return typography.button.default;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();
  const textStyles = getTextStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles,
        sizeStyles,
        disabled && styles.disabled,
        !disabled && variant !== 'ghost' && variant !== 'link' && shadows.sm,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[textStyles, { color: textColor }, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
});