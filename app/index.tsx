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

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const settings = await AuthService.getBiometricSettings();
      setBiometricAvailable(settings.enabled);
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

      // Ejecutar autenticación biométrica
      const result = await AuthService.authenticateWithBiometrics(method);
      
      if (result.success) {
        // Cargar sesión existente si la autenticación fue exitosa
        const hasSession = await AuthService.loginWithBiometrics();
        
        if (hasSession) {
          console.log('✅ Biometric login successful, navegando a main');
          router.replace('/(tabs)/main');
        } else {
          Alert.alert(
            'Sesión No Encontrada',
            'No hay una sesión previa guardada. Por favor inicie sesión con email y contraseña primero.'
          );
        }
      } else {
        // Autenticación biométrica falló
        Alert.alert(
          'Autenticación Fallida',
          result.error || 'No se pudo verificar la identidad biométrica'
        );
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
                <Lock size={48} color={colors.accent.main} strokeWidth={2} />
              </View>
              <Text style={styles.title}>VehicleGuard</Text>
              <Text style={styles.subtitle}>Control Vehicular Seguro</Text>
            </View>

            {/* Form Section */}
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

              {/* Biometric Options */}
              {biometricAvailable && (
                <View style={styles.biometricSection}>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>o continuar con</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <View style={styles.biometricButtons}>
                    <TouchableOpacity
                      style={styles.biometricButton}
                      onPress={() => handleBiometricLogin('fingerprint')}
                      disabled={isLoading}
                    >
                      <Fingerprint size={28} color={colors.neutral.white} />
                      <Text style={styles.biometricButtonText}>Huella</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.biometricButton}
                      onPress={() => handleBiometricLogin('face')}
                      disabled={isLoading}
                    >
                      <Eye size={28} color={colors.neutral.white} />
                      <Text style={styles.biometricButtonText}>Face ID</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.biometricButton}
                      onPress={() => handleBiometricLogin('pin')}
                      disabled={isLoading}
                    >
                      <Smartphone size={28} color={colors.neutral.white} />
                      <Text style={styles.biometricButtonText}>PIN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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