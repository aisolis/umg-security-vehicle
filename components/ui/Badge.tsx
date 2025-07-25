import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: colors.primary[900],
          color: colors.primary[50],
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary[100],
          color: colors.secondary[900],
        };
      case 'destructive':
        return {
          backgroundColor: colors.destructive[500],
          color: colors.destructive[50],
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'success':
        return {
          backgroundColor: colors.success[500],
          color: colors.success[50],
        };
      default:
        return {
          backgroundColor: colors.primary[900],
          color: colors.primary[50],
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.badge, { backgroundColor: variantStyles.backgroundColor }, style]}>
      <Text style={[styles.text, { color: variantStyles.color }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.label.small,
    textTransform: 'uppercase',
  },
});