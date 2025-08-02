/**
 * AuthService - Servicio de autenticación integrado con API Supabase
 */

import * as SecureStore from 'expo-secure-store';

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
}

export const AuthService = new AuthServiceClass();