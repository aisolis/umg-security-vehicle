import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LogOut, Settings } from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';

interface HeaderProps {
  title: string;
  username?: string;
  onLogout?: () => void;
  onSettings?: () => void;
  showSettings?: boolean;
}

export function Header({ 
  title, 
  username, 
  onLogout, 
  onSettings, 
  showSettings = false 
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.title}>{title}</Text>
          {username && (
            <Text style={styles.username}>{username}</Text>
          )}
        </View>
        
        <View style={styles.rightSection}>
          {showSettings && onSettings && (
            <TouchableOpacity
              onPress={onSettings}
              style={styles.actionButton}
            >
              <Settings size={24} color={colors.neutral.white} />
            </TouchableOpacity>
          )}
          
          {onLogout && (
            <TouchableOpacity
              onPress={onLogout}
              style={styles.actionButton}
            >
              <LogOut size={24} color={colors.neutral.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.medium,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  title: {
    ...typography.heading.medium,
    color: colors.neutral.white,
  },
  username: {
    ...typography.caption.medium,
    color: colors.neutral.light,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  actionButton: {
    padding: spacing.small,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});