/**
 * AuthService - Servicio de autenticación integrado con API Supabase
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  session: Session;
}

interface ApiError {
  error: string;
}

interface BiometricSettings {
  enabled: boolean;
  preferredMethod: 'fingerprint' | 'face' | 'pin' | null;
}

interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

class AuthServiceClass {
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  private isAuthenticated: boolean = false;
  
  private readonly API_BASE_URL = 'https://kipzizzkkvxuadnjpvna.supabase.co/functions/v1';
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
  };

  constructor() {
    this.loadStoredSession();
  }

  /**
   * Cargar sesión almacenada al inicializar
   */
  private async loadStoredSession(): Promise<void> {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        SecureStore.getItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(this.STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken && userData) {
        this.currentUser = JSON.parse(userData);
        this.currentSession = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: 0, // Simplificado por ahora
        };
        this.isAuthenticated = true;
        console.log('✅ Sesión cargada desde almacenamiento');
      }
    } catch (error) {
      console.log('⚠️ No hay sesión almacenada o error al cargar:', error);
    }
  }

  /**
   * Método de login usando API real
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      console.log('🔐 Intentando login con:', email);
      
      const response = await fetch(`${this.API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Login exitoso');
        
        // Almacenar datos del usuario y sesión
        this.currentUser = data.user;
        this.currentSession = data.session;
        this.isAuthenticated = true;

        // Guardar en almacenamiento seguro
        await this.saveSession(data.user, data.session);
        
        // Guardar datos del usuario para biométricos futuros
        await this.saveBiometricUserData(data.user);
        
        return true;
      } else {
        console.log('❌ Login fallido:', data.error);
        throw new Error(data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('❌ Error durante login:', error);
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentSession = null;
      throw error;
    }
  }

  /**
   * Guardar sesión en almacenamiento seguro
   */
  private async saveSession(user: User, session: Session): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN, session.access_token),
        SecureStore.setItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token),
        SecureStore.setItemAsync(this.STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);
      console.log('✅ Sesión guardada en almacenamiento seguro');
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
    }
  }

  /**
   * Guardar datos del usuario para uso con biométricos
   */
  private async saveBiometricUserData(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync('biometric_user_data', JSON.stringify(user));
      console.log('✅ Datos de usuario guardados para biométricos');
    } catch (error) {
      console.error('❌ Error guardando datos biométricos de usuario:', error);
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      // Limpiar datos en memoria
      this.currentUser = null;
      this.currentSession = null;
      this.isAuthenticated = false;

      // Limpiar almacenamiento seguro
      await Promise.all([
        SecureStore.deleteItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(this.STORAGE_KEYS.USER_DATA),
      ]);

      console.log('✅ Sesión cerrada y almacenamiento limpiado');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obtener token de acceso actual
   */
  getAccessToken(): string | null {
    return this.currentSession?.access_token || null;
  }

  /**
   * Renovar token de autenticación
   * TODO: Implementar renovación usando refresh_token
   */
  async refreshToken(): Promise<boolean> {
    // Por ahora retornamos el estado actual
    // En el futuro se puede implementar renovación automática
    return this.isAuthenticated;
  }

  /**
   * Validar credenciales localmente
   */
  validateCredentials(credentials: LoginCredentials): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validar email
    if (!credentials.email || credentials.email.trim().length === 0) {
      errors.push('El email es requerido');
    } else if (!this.isValidEmail(credentials.email)) {
      errors.push('El email no tiene un formato válido');
    }
    
    // Validar contraseña
    if (!credentials.password || credentials.password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validar formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============== MÉTODOS BIOMÉTRICOS ==============

  /**
   * Verificar capacidades biométricas del dispositivo
   */
  async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  /**
   * Verificar si un tipo de autenticación específico está disponible
   */
  async isBiometricTypeAvailable(type: 'fingerprint' | 'face' | 'pin'): Promise<boolean> {
    try {
      const capabilities = await this.getBiometricCapabilities();
      
      if (!capabilities.hasHardware || !capabilities.isEnrolled) {
        return false;
      }

      const typeMap = {
        fingerprint: LocalAuthentication.AuthenticationType.FINGERPRINT,
        face: LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        pin: LocalAuthentication.AuthenticationType.PASSCODE,
      };

      return capabilities.supportedTypes.includes(typeMap[type]);
    } catch (error) {
      console.error('Error checking biometric type availability:', error);
      return false;
    }
  }

  /**
   * Configurar autenticación biométrica
   */
  async setupBiometricAuthentication(method: 'fingerprint' | 'face' | 'pin'): Promise<boolean> {
    try {
      // Verificar capacidades del dispositivo
      const isAvailable = await this.isBiometricTypeAvailable(method);
      
      if (!isAvailable) {
        throw new Error(`${method} no está disponible en este dispositivo`);
      }

      // Probar autenticación
      const result = await this.authenticateWithBiometrics(method);
      
      if (result.success) {
        // Guardar configuración
        const settings: BiometricSettings = {
          enabled: true,
          preferredMethod: method,
        };
        
        await SecureStore.setItemAsync('biometric_settings', JSON.stringify(settings));
        console.log(`✅ Biometric ${method} configured successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting up biometric authentication:', error);
      throw error;
    }
  }

  /**
   * Autenticar con biométricos
   */
  async authenticateWithBiometrics(method?: 'fingerprint' | 'face' | 'pin'): Promise<{success: boolean; error?: string}> {
    try {
      // Obtener configuración guardada si no se especifica método
      let authMethod = method;
      if (!authMethod) {
        const settings = await this.getBiometricSettings();
        if (!settings.enabled || !settings.preferredMethod) {
          return { success: false, error: 'Biométricos no configurados' };
        }
        authMethod = settings.preferredMethod;
      }

      // Verificar disponibilidad
      const isAvailable = await this.isBiometricTypeAvailable(authMethod);
      if (!isAvailable) {
        return { success: false, error: `${authMethod} no está disponible` };
      }

      // Configurar prompt según el método
      const promptMessage = {
        fingerprint: 'Coloque su dedo en el sensor',
        face: 'Mire a la cámara',
        pin: 'Ingrese su PIN',
      };

      const fallbackLabel = {
        fingerprint: 'Usar contraseña',
        face: 'Usar contraseña', 
        pin: 'Usar contraseña',
      };

      // Ejecutar autenticación
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage[authMethod],
        fallbackLabel: fallbackLabel[authMethod],
        disableDeviceFallback: false,
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        console.log(`✅ Biometric authentication successful: ${authMethod}`);
        return { success: true };
      } else {
        console.log(`❌ Biometric authentication failed: ${result.error}`);
        return { success: false, error: result.error || 'Autenticación fallida' };
      }

    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return { success: false, error: 'Error en autenticación biométrica' };
    }
  }

  /**
   * Login con biométricos (estilo app bancaria)
   */
  async loginWithBiometrics(): Promise<boolean> {
    try {
      // Verificar que hay un usuario registrado para biométricos
      const hasUserForBiometrics = await this.hasUserForBiometrics();
      if (!hasUserForBiometrics) {
        throw new Error('No hay usuario configurado para biométricos. Inicie sesión primero con email y contraseña.');
      }

      // Autenticar con biométricos
      const biometricResult = await this.authenticateWithBiometrics();
      
      if (biometricResult.success) {
        // Cargar datos del usuario desde almacenamiento local
        const userData = await SecureStore.getItemAsync('biometric_user_data');
        if (userData) {
          this.currentUser = JSON.parse(userData);
          this.isAuthenticated = true;
          
          // Generar una nueva sesión local (sin llamar a la API)
          this.currentSession = {
            access_token: 'biometric_session_' + Date.now(),
            refresh_token: 'biometric_refresh_' + Date.now(),
            expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
          };
          
          console.log('✅ Biometric login successful');
          return true;
        }
      } else {
        throw new Error(biometricResult.error || 'Autenticación biométrica fallida');
      }
      
      return false;
    } catch (error) {
      console.error('❌ Biometric login failed:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay usuario configurado para biométricos
   */
  private async hasUserForBiometrics(): Promise<boolean> {
    try {
      const userData = await SecureStore.getItemAsync('biometric_user_data');
      const settings = await this.getBiometricSettings();
      return !!(userData && settings.enabled);
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar si hay sesión almacenada
   */
  private async hasStoredSession(): Promise<boolean> {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        SecureStore.getItemAsync(this.STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(this.STORAGE_KEYS.USER_DATA),
      ]);

      return !!(accessToken && refreshToken && userData);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener configuración biométrica
   */
  async getBiometricSettings(): Promise<BiometricSettings> {
    try {
      const settings = await SecureStore.getItemAsync('biometric_settings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.log('No biometric settings found:', error);
    }
    
    return { enabled: false, preferredMethod: null };
  }

  /**
   * Desactivar autenticación biométrica
   */
  async disableBiometricAuthentication(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('biometric_settings'),
        SecureStore.deleteItemAsync('biometric_user_data'),
      ]);
      console.log('✅ Biometric authentication disabled');
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
    }
  }

  /**
   * Obtener método biométrico activo
   */
  async getActiveBiometricMethod(): Promise<'fingerprint' | 'face' | 'pin' | null> {
    try {
      const settings = await this.getBiometricSettings();
      if (settings.enabled && settings.preferredMethod) {
        // Verificar que sigue disponible
        const isAvailable = await this.isBiometricTypeAvailable(settings.preferredMethod);
        return isAvailable ? settings.preferredMethod : null;
      }
      return null;
    } catch (error) {
      console.error('Error getting active biometric method:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario puede usar login biométrico
   */
  async canUseBiometricLogin(): Promise<boolean> {
    try {
      const activeBiometric = await this.getActiveBiometricMethod();
      const hasUserData = await this.hasUserForBiometrics();
      return !!(activeBiometric && hasUserData);
    } catch (error) {
      return false;
    }
  }
}

export const AuthService = new AuthServiceClass();