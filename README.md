# VehicleGuard - Control Vehicular Móvil

Aplicación móvil desarrollada en React Native con Expo para el control de bloqueo/desbloqueo vehicular vía Bluetooth.

## 🚗 Características Principales

- **Autenticación Segura**: Sistema de login con validación
- **Control Vehicular**: Botones de bloqueo/desbloqueo intuitivos
- **Conexión Bluetooth**: Preparado para módulos Arduino Bluetooth
- **Diseño Corporativo**: Interfaz minimalista y profesional
- **Feedback Háptico**: Respuesta táctil en dispositivos móviles

## 📱 Pantallas

### LoginScreen (`app/index.tsx`)
- Formulario de autenticación con validación
- Estados de carga y error
- Animaciones suaves de transición
- Diseño responsivo

### MainScreen (`app/main.tsx`)
- Botones principales de control vehicular
- Indicador de estado del vehículo
- Monitor de conexión Bluetooth
- Header con información del usuario

## 🏗️ Arquitectura

### Servicios
- **AuthService**: Manejo de autenticación (stub)
- **BluetoothService**: Comunicación Bluetooth (stub)

### Componentes
- **ActionButton**: Botones de acción reutilizables
- **VehicleStatusCard**: Tarjeta de estado del vehículo
- **Header**: Componente de encabezado

### Estilos
- Sistema de colores corporativo
- Tipografía escalable
- Espaciado consistente (sistema 8px)
- Sombras y efectos visuales

## 🔧 Próximos Pasos de Implementación

### 1. Integración Bluetooth Real
```bash
npm install react-native-bluetooth-serial
```

### 2. Autenticación con Backend
- Integrar con microservicio de autenticación
- Implementar JWT tokens
- Configurar renovación automática de tokens

### 3. Permisos Nativos
- Configurar permisos de Bluetooth en `app.json`
- Manejar permisos en tiempo de ejecución

### 4. Notificaciones Push (Opcional)
```bash
expo install expo-notifications
```

## 🛠️ Configuración para Producción

### Bluetooth Integration
Reemplazar `BluetoothService.ts` con implementación real:

```typescript
import BluetoothSerial from 'react-native-bluetooth-serial';

// Ejemplo de integración real
const connectToVehicle = async () => {
  const devices = await BluetoothSerial.list();
  const vehicleDevice = devices.find(d => d.name === 'VehicleControl_BT');
  
  if (vehicleDevice) {
    await BluetoothSerial.connect(vehicleDevice.id);
  }
};
```

### Autenticación Real
Actualizar `AuthService.ts` para llamadas a API:

```typescript
const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  return response.json();
};
```

## 📄 Estructura de Archivos

```
app/
├── index.tsx              # Pantalla de Login
├── main.tsx               # Pantalla Principal
└── _layout.tsx            # Layout raíz

components/
├── common/
│   ├── ActionButton.tsx   # Botones de acción
│   └── Header.tsx         # Componente de header
└── vehicle/
    └── VehicleStatusCard.tsx # Tarjeta de estado

services/
├── AuthService.ts         # Servicio de autenticación
└── BluetoothService.ts    # Servicio Bluetooth

styles/
└── index.ts              # Sistema de diseño

utils/
├── haptics.ts            # Utilidades hápticas
└── validation.ts         # Validaciones

types/
└── index.ts              # Definiciones de tipos
```

## 🎨 Sistema de Diseño

### Colores
- **Primario**: #2C3E50 (Azul corporativo)
- **Acento**: #F39C12 (Dorado sutil)
- **Éxito**: #27AE60 (Verde)
- **Error**: #E74C3C (Rojo)

### Tipografía
- Sistema escalable con 3 pesos máximo
- Line height optimizado (120% headings, 150% body)

### Espaciado
- Sistema basado en 8px para consistencia
- Espaciado generoso para legibilidad

## 🚀 Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para web
npm run build:web

# Lint del código
npm run lint
```

## 📝 Notas de Implementación

- ✅ Cascaron completo funcional
- ✅ Navegación configurada
- ✅ Servicios stub preparados
- ✅ Diseño corporativo implementado
- ⏳ Pendiente: Integración Bluetooth real
- ⏳ Pendiente: Backend de autenticación
- ⏳ Pendiente: Configuración de permisos nativos

---

**Versión**: 1.0.0  
**Plataformas**: iOS, Android, Web (desarrollo)  
**Framework**: React Native + Expo SDK 53