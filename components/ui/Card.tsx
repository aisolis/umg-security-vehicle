import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/styles';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outline';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.card,
          ...shadows.sm,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyles(), style]}>
      {children}
    </View>
  );
}

export function CardHeader({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

export function CardContent({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

export function CardFooter({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    padding: spacing[6],
    paddingBottom: 0,
  },
  content: {
    padding: spacing[6],
  },
  footer: {
    padding: spacing[6],
    paddingTop: 0,
  },
});