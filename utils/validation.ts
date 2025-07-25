/**
 * Utilidades de validación para formularios
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const ValidationUtils = {
  /**
   * Validar nombre de usuario
   */
  validateUsername: (username: string): ValidationResult => {
    const trimmed = username.trim();
    
    if (!trimmed) {
      return { isValid: false, message: 'Usuario es requerido' };
    }
    
    if (trimmed.length < 3) {
      return { isValid: false, message: 'Usuario debe tener al menos 3 caracteres' };
    }
    
    if (trimmed.length > 50) {
      return { isValid: false, message: 'Usuario no puede exceder 50 caracteres' };
    }
    
    // Regex para alfanumérico y algunos caracteres especiales
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(trimmed)) {
      return { 
        isValid: false, 
        message: 'Usuario solo puede contener letras, números, puntos, guiones y guiones bajos' 
      };
    }
    
    return { isValid: true };
  },

  /**
   * Validar contraseña
   */
  validatePassword: (password: string): ValidationResult => {
    if (!password) {
      return { isValid: false, message: 'Contraseña es requerida' };
    }
    
    if (password.length < 6) {
      return { isValid: false, message: 'Contraseña debe tener al menos 6 caracteres' };
    }
    
    if (password.length > 128) {
      return { isValid: false, message: 'Contraseña no puede exceder 128 caracteres' };
    }
    
    return { isValid: true };
  },

  /**
   * Validar email (para futuras funcionalidades)
   */
  validateEmail: (email: string): ValidationResult => {
    const trimmed = email.trim();
    
    if (!trimmed) {
      return { isValid: false, message: 'Email es requerido' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, message: 'Formato de email inválido' };
    }
    
    return { isValid: true };
  },
};