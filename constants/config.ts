/**
 * Configuración global de la aplicación
 */

export const CONFIG = {
  // Configuración de Bluetooth
  BLUETOOTH: {
    DEVICE_NAME: 'VehicleControl_BT',
    CONNECTION_TIMEOUT: 10000, // 10 segundos
    RECONNECT_ATTEMPTS: 3,
    SCAN_DURATION: 10000, // 10 segundos
  },
  
  // Configuración de autenticación
  AUTH: {
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 50,
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    SESSION_TIMEOUT: 3600000, // 1 hora en ms
  },
  
  // Configuración de UI
  UI: {
    ANIMATION_DURATION: 300,
    HAPTIC_FEEDBACK: true,
    AUTO_HIDE_ALERTS: 5000, // 5 segundos
  },
  
  // Configuración del vehículo
  VEHICLE: {
    STATUS_CHECK_INTERVAL: 30000, // 30 segundos
    COMMAND_TIMEOUT: 5000, // 5 segundos
    MAX_RETRY_ATTEMPTS: 2,
  },
  
  // URLs de API (para futuras integraciones)
  API: {
    BASE_URL: 'https://api.vehicleguard.com',
    AUTH_ENDPOINT: '/auth',
    VEHICLE_ENDPOINT: '/vehicle',
    LOGS_ENDPOINT: '/logs',
  },
  
  // Versión de la aplicación
  APP: {
    VERSION: '1.0.0',
    BUILD_NUMBER: 1,
    ENVIRONMENT: 'development', // development | staging | production
  },
};

// Configuración de desarrollo
export const DEV_CONFIG = {
  ENABLE_LOGGING: true,
  MOCK_BLUETOOTH: true,
  MOCK_AUTH: true,
  DEBUG_MODE: true,
};