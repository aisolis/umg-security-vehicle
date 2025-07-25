import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, User, Eye, EyeOff, Shield } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { AuthService } from '@/services/AuthService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

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
      colors={[colors.primary[50], colors.primary[100]]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Shield size={48} color={colors.primary[600]} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>VehicleGuard</Text>
              <Text style={styles.subtitle}>Control Vehicular Seguro</Text>
            </View>

            {/* Login Card */}
            <Card style={styles.loginCard}>
              <CardHeader>
                <Text style={styles.cardTitle}>Iniciar Sesión</Text>
                <Text style={styles.cardDescription}>
                  Ingresa tus credenciales para acceder al sistema
                </Text>
              </CardHeader>
              
              <CardContent>
                <View style={styles.form}>
                  <Input
                    label="Usuario"
                    placeholder="Ingresa tu usuario"
                    value={credentials.username}
                    onChangeText={(text) => {
                      setCredentials({ ...credentials, username: text });
                      if (errors.username) {
                        setErrors({ ...errors, username: undefined });
                      }
                    }}
                    error={errors.username}
                    leftIcon={<User size={20} color={colors.mutedForeground} />}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Input
                    label="Contraseña"
                    placeholder="Ingresa tu contraseña"
                    value={credentials.password}
                    onChangeText={(text) => {
                      setCredentials({ ...credentials, password: text });
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined });
                      }
                    }}
                    error={errors.password}
                    leftIcon={<Lock size={20} color={colors.mutedForeground} />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff size={20} color={colors.mutedForeground} />
                        ) : (
                          <Eye size={20} color={colors.mutedForeground} />
                        )}
                      </TouchableOpacity>
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Button
                    onPress={handleLogin}
                    disabled={!isFormValid}
                    loading={isLoading}
                    size="lg"
                    style={styles.loginButton}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </View>
              </CardContent>
            </Card>

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
    paddingHorizontal: spacing[6],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: colors.background,
    borderRadius: borderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.heading.h1,
    color: colors.primary[900],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.large,
    color: colors.secondary[600],
    textAlign: 'center',
  },
  loginCard: {
    marginBottom: spacing[8],
  },
  cardTitle: {
    ...typography.heading.h3,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  cardDescription: {
    ...typography.body.default,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  form: {
    gap: spacing[4],
  },
  loginButton: {
    marginTop: spacing[2],
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    ...typography.label.default,
    color: colors.secondary[500],
    marginBottom: spacing[1],
  },
  footerSubtext: {
    ...typography.label.small,
    color: colors.secondary[400],
  },
});