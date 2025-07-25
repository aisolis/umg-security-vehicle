/**
 * AuthService - Servicio stub para autenticación
 * Preparado para integración con microservicio de autenticación
 */

interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

class AuthServiceClass {
  private currentUser: User | null = null;
  private isAuthenticated: boolean = false;

  /**
   * Método de login simulado
   * TODO: Integrar con microservicio real
   */
  async login(username: string, password: string): Promise<boolean> {
    // Simulación de delay de red
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Validación simulada - En producción, esto debe ser llamada a API
    if (username.length >= 3 && password.length >= 6) {
      this.currentUser = {
        id: 'user_' + Date.now(),
        username,
        email: `${username}@company.com`,
        role: 'driver',
      };
      this.isAuthenticated = true;
      return true;
    }
    
    return false;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.currentUser = null;
    this.isAuthenticated = false;
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
   * Renovar token de autenticación (preparado para JWT)
   * TODO: Implementar renovación de JWT
   */
  async refreshToken(): Promise<boolean> {
    // Stub para renovación de token
    return this.isAuthenticated;
  }

  /**
   * Validar credenciales localmente
   */
  validateCredentials(credentials: LoginCredentials): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!credentials.username || credentials.username.trim().length < 3) {
      errors.push('Usuario debe tener al menos 3 caracteres');
    }
    
    if (!credentials.password || credentials.password.length < 6) {
      errors.push('Contraseña debe tener al menos 6 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const AuthService = new AuthServiceClass();