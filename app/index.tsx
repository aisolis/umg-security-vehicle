import React, { useState, useEffect } from 'react';
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
import { Lock, Mail, Eye, EyeOff, Fingerprint, Smartphone } from 'lucide-react-native';
import { colors, typography, spacing } from '@/styles';
import { AuthService } from '@/services/AuthService';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [activeBiometricMethod, setActiveBiometricMethod] = useState<'fingerprint' | 'face' | 'pin' | null>(null);
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(true);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const canUseBiometric = await AuthService.canUseBiometricLogin();
      const activeMethod = await AuthService.getActiveBiometricMethod();
      
      setBiometricAvailable(canUseBiometric);
      setActiveBiometricMethod(activeMethod);
      
      // Si hay biométrico disponible, mostrar primero la opción biométrica
      if (canUseBiometric && activeMethod) {
        setShowTraditionalLogin(false);
      }
      
      console.log('🔐 Biometric status:', { canUseBiometric, activeMethod });
    } catch (error) {
      console.log('No biometric settings found:', error);
    }
  };

  const handleBiometricLogin = async (method: 'fingerprint' | 'face' | 'pin') => {
    try {
      setIsLoading(true);
      console.log(`🔐 Autenticación biométrica: ${method}`);
      
      // Verificar que el método esté disponible
      const isAvailable = await AuthService.isBiometricTypeAvailable(method);
      if (!isAvailable) {
        Alert.alert(
          'No Disponible',
          `${method === 'fingerprint' ? 'Huella digital' : method === 'face' ? 'Face ID' : 'PIN'} no está disponible en este dispositivo.`
        );
        return;
      }

      // Usar login biométrico directo (estilo app bancaria)
      const success = await AuthService.loginWithBiometrics();
      
      if (success) {
        console.log('✅ Biometric login successful, navegando a main');
        router.replace('/(tabs)/main');
      }
    } catch (error: any) {
      console.error('❌ Error en biometric login:', error);
      Alert.alert('Error', error.message || 'Error en autenticación biométrica');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const validation = AuthService.validateCredentials(credentials);
    
    if (!validation.isValid) {
      const newErrors: { email?: string; password?: string } = {};
      
      validation.errors.forEach(error => {
        if (error.includes('email') || error.includes('Email')) {
          newErrors.email = error;
        } else if (error.includes('contraseña') || error.includes('password')) {
          newErrors.password = error;
        }
      });
      
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const success = await AuthService.login(credentials.email, credentials.password);
      
      if (success) {
        console.log('✅ Login exitoso, navegando a main');
        router.replace('/(tabs)/main');
      } else {
        Alert.alert('Error', 'Credenciales incorrectas');
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      Alert.alert(
        'Error de Autenticación', 
        error.message || 'Error de conexión. Verifique su internet e intente nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginMethod = () => {
    setShowTraditionalLogin(!showTraditionalLogin);
  };

  const getBiometricIcon = (method: 'fingerprint' | 'face' | 'pin', size: number = 48) => {
    switch (method) {
      case 'fingerprint':
        return <Fingerprint size={size} color={colors.accent.main} strokeWidth={2} />;
      case 'face':
        return <Eye size={size} color={colors.accent.main} strokeWidth={2} />;
      case 'pin':
        return <Smartphone size={size} color={colors.accent.main} strokeWidth={2} />;
      default:
        return <Lock size={size} color={colors.accent.main} strokeWidth={2} />;
    }
  };

  const getBiometricMethodName = (method: 'fingerprint' | 'face' | 'pin') => {
    switch (method) {
      case 'fingerprint':
        return 'Huella Digital';
      case 'face':
        return 'Face ID';
      case 'pin':
        return 'PIN';
      default:
        return 'Biométrico';
    }
  };

  const isFormValid = credentials.email.includes('@') && credentials.password.length >= 6;

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
                {biometricAvailable && activeBiometricMethod && !showTraditionalLogin 
                  ? getBiometricIcon(activeBiometricMethod, 48)
                  : <Lock size={48} color={colors.accent.main} strokeWidth={2} />
                }
              </View>
              <Text style={styles.title}>VehicleGuard</Text>
              <Text style={styles.subtitle}>Control Vehicular Seguro</Text>
            </View>

            {/* Biometric Section - Prominente */}
            {biometricAvailable && activeBiometricMethod && !showTraditionalLogin && (
              <View style={styles.biometricMainSection}>
                <Text style={styles.biometricWelcomeText}>
                  Bienvenido de vuelta
                </Text>
                <Text style={styles.biometricSubtext}>
                  Use su {getBiometricMethodName(activeBiometricMethod)} para acceder
                </Text>
                
                <TouchableOpacity
                  style={styles.biometricMainButton}
                  onPress={() => handleBiometricLogin(activeBiometricMethod)}
                  disabled={isLoading}
                >
                  {getBiometricIcon(activeBiometricMethod, 64)}
                  <Text style={styles.biometricMainButtonText}>
                    {isLoading ? 'Autenticando...' : `Usar ${getBiometricMethodName(activeBiometricMethod)}`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.usePasswordButton}
                  onPress={toggleLoginMethod}
                >
                  <Text style={styles.usePasswordText}>Usar contraseña</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Form Section - Solo se muestra si no hay biométrico o si se eligió usar contraseña */}
            {(showTraditionalLogin || !biometricAvailable) && (
              <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={colors.neutral.medium} />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError
                  ]}
                  placeholder="Correo electrónico"
                  placeholderTextColor={colors.neutral.medium}
                  value={credentials.email}
                  onChangeText={(text) => {
                    setCredentials({ ...credentials, email: text });
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

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

              {/* Volver a biométrico si está disponible */}
              {biometricAvailable && activeBiometricMethod && (
                <TouchableOpacity
                  style={styles.backToBiometricButton}
                  onPress={toggleLoginMethod}
                >
                  {getBiometricIcon(activeBiometricMethod, 20)}
                  <Text style={styles.backToBiometricText}>
                    Usar {getBiometricMethodName(activeBiometricMethod)}
                  </Text>
                </TouchableOpacity>
              )}
              </View>
            )}

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
  biometricMainSection: {
    alignItems: 'center',
    marginBottom: spacing.xlarge,
    paddingHorizontal: spacing.large,
  },
  biometricWelcomeText: {
    ...typography.heading.medium,
    color: colors.neutral.white,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  biometricSubtext: {
    ...typography.body.medium,
    color: colors.neutral.light,
    textAlign: 'center',
    marginBottom: spacing.xlarge,
  },
  biometricMainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.xlarge,
    paddingHorizontal: spacing.xlarge,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: spacing.large,
    minWidth: 200,
    borderWidth: 2,
    borderColor: colors.accent.main,
  },
  biometricMainButtonText: {
    ...typography.body.large,
    color: colors.neutral.white,
    marginTop: spacing.medium,
    textAlign: 'center',
  },
  usePasswordButton: {
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
  },
  usePasswordText: {
    ...typography.body.medium,
    color: colors.accent.main,
    textAlign: 'center',
  },
  backToBiometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 12,
    marginTop: spacing.large,
    borderWidth: 1,
    borderColor: colors.accent.main,
  },
  backToBiometricText: {
    ...typography.body.medium,
    color: colors.accent.main,
    marginLeft: spacing.small,
  },
  biometricSection: {
    marginTop: spacing.xlarge,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    ...typography.caption.medium,
    color: colors.neutral.light,
    paddingHorizontal: spacing.medium,
  },
  biometricButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.medium,
  },
  biometricButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.large,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  biometricButtonText: {
    ...typography.caption.medium,
    color: colors.neutral.white,
    marginTop: spacing.small,
    textAlign: 'center',
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