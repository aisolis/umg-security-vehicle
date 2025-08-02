import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  type,
  title,
  message,
  duration = 4000,
  onHide,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide después del tiempo especificado
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={24} color={colors.success.main} />,
          backgroundColor: colors.success.light,
          borderColor: colors.success.main,
        };
      case 'error':
        return {
          icon: <XCircle size={24} color={colors.error.main} />,
          backgroundColor: colors.error.light,
          borderColor: colors.error.main,
        };
      case 'warning':
        return {
          icon: <AlertCircle size={24} color={colors.warning.main} />,
          backgroundColor: colors.warning.light,
          borderColor: colors.warning.main,
        };
      case 'info':
        return {
          icon: <Info size={24} color={colors.info.main} />,
          backgroundColor: colors.info.light,
          borderColor: colors.info.main,
        };
      default:
        return {
          icon: <Info size={24} color={colors.info.main} />,
          backgroundColor: colors.info.light,
          borderColor: colors.info.main,
        };
    }
  };

  if (!visible) return null;

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
        <View
          style={[
            styles.toast,
            {
              backgroundColor: config.backgroundColor,
              borderLeftColor: config.borderColor,
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              {config.icon}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideToast}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.neutral.medium} />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.medium,
    right: spacing.medium,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toast: {
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: colors.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.medium,
  },
  iconContainer: {
    marginRight: spacing.medium,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.small,
  },
  title: {
    ...typography.body.medium,
    fontWeight: '600',
    color: colors.neutral.dark,
    marginBottom: 2,
  },
  message: {
    ...typography.caption.medium,
    color: colors.neutral.medium,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});