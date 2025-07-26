import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';
import { AuthService } from '@/services/AuthService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!credentials.username.trim()) {
      newErrors.username = 'Usuario requerido';
    } else if (credentials.username.length < 3) {
      newErrors.username = 'Usuario debe tener al menos 3 caracteres';
    }
    
    if (!credentials.password.trim()) {
      newErrors.password = 'Contraseña requerida';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const success = await AuthService.login(credentials.username, credentials.password);
      
      if (success) {
        router.replace('/main');
      } else {
        Alert.alert('Error', 'Credenciales incorrectas');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = credentials.username.length >= 3 && credentials.password.length >= 6;

  return (
    <LinearGradient
      colors={[colors.primary.main, colors.primary.dark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.content}>
            {/* Logo/Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Lock size={48} color={colors.accent.main} strokeWidth={2} />
              </View>
              <Text style={styles.title}>VehicleGuard</Text>
              <Text style={styles.subtitle}>Control Vehicular Seguro</Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <User size={20} color={colors.neutral.medium} />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.username && styles.inputError
                  ]}
                  placeholder="Usuario"
                  placeholderTextColor={colors.neutral.medium}
                  value={credentials.username}
                  onChangeText={(text) => {
                    setCredentials({ ...credentials, username: text });
                    if (errors.username) {
                      setErrors({ ...errors, username: undefined });
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={colors.neutral.medium} />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.password && styles.inputError
                  ]}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.neutral.medium}
                  value={credentials.password}
                  onChangeText={(text) => {
                    setCredentials({ ...credentials, password: text });
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.neutral.medium} />
                  ) : (
                    <Eye size={20} color={colors.neutral.medium} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!isFormValid || isLoading) && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>VehicleGuard v1.0.0</Text>
              <Text style={styles.footerSubtext}>Sistema de Control Vehicular</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.large,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxlarge,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  title: {
    ...typography.heading.large,
    color: colors.neutral.white,
    marginBottom: spacing.small,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.neutral.light,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xlarge,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: spacing.medium,
  },
  input: {
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing.large + 32,
    paddingVertical: spacing.medium,
    borderRadius: 12,
    fontSize: 16,
    color: colors.neutral.dark,
    shadowColor: colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.medium,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.medium,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
    padding: 4,
  },
  errorText: {
    color: colors.error.light,
    fontSize: 12,
    marginTop: 4,
    marginLeft: spacing.small,
  },
  loginButton: {
    backgroundColor: colors.accent.main,
    paddingVertical: spacing.medium + 4,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.large,
    shadowColor: colors.accent.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: colors.neutral.medium,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    ...typography.button.large,
    color: colors.neutral.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: spacing.large,
  },
  footerText: {
    ...typography.caption.medium,
    color: colors.neutral.light,
  },
  footerSubtext: {
    ...typography.caption.small,
    color: colors.neutral.medium,
    marginTop: 4,
  },
});