# Guía de Integración Bluetooth con Arduino

## 📋 Resumen
Esta guía explica cómo integrar la aplicación VehicleGuard con un módulo Arduino Bluetooth para el control vehicular real.

## 🔧 Configuración del Arduino

### Hardware Requerido
- Arduino Uno/Nano/ESP32
- Módulo Bluetooth HC-05 o HC-06
- Relés para control de cerraduras
- Resistencias y cables de conexión

### Código Arduino Ejemplo
```cpp
#include <SoftwareSerial.h>

// Configuración Bluetooth
SoftwareSerial bluetooth(2, 3); // RX, TX

// Pines de control
const int LOCK_RELAY_PIN = 7;
const int UNLOCK_RELAY_PIN = 8;
const int STATUS_LED_PIN = 13;

bool vehicleLocked = true;

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  
  pinMode(LOCK_RELAY_PIN, OUTPUT);
  pinMode(UNLOCK_RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // Estado inicial
  digitalWrite(LOCK_RELAY_PIN, LOW);
  digitalWrite(UNLOCK_RELAY_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, vehicleLocked ? HIGH : LOW);
  
  Serial.println("VehicleControl Arduino Ready");
}

void loop() {
  if (bluetooth.available()) {
    String command = bluetooth.readStringUntil('\n');
    command.trim();
    
    if (command == "LOCK") {
      lockVehicle();
      bluetooth.println("LOCKED_OK");
    }
    else if (command == "UNLOCK") {
      unlockVehicle();
      bluetooth.println("UNLOCKED_OK");
    }
    else if (command == "STATUS") {
      bluetooth.println(vehicleLocked ? "LOCKED" : "UNLOCKED");
    }
    else if (command == "PING") {
      bluetooth.println("PONG_VEHICLE"); // Identificación específica
    }
    else {
      bluetooth.println("UNKNOWN_COMMAND");
    }
  }
}

void lockVehicle() {
  digitalWrite(UNLOCK_RELAY_PIN, LOW);
  digitalWrite(LOCK_RELAY_PIN, HIGH);
  delay(500); // Tiempo de activación del relé
  digitalWrite(LOCK_RELAY_PIN, LOW);
  
  vehicleLocked = true;
  digitalWrite(STATUS_LED_PIN, HIGH);
  Serial.println("Vehicle Locked");
}

void unlockVehicle() {
  digitalWrite(LOCK_RELAY_PIN, LOW);
  digitalWrite(UNLOCK_RELAY_PIN, HIGH);
  delay(500); // Tiempo de activación del relé
  digitalWrite(UNLOCK_RELAY_PIN, LOW);
  
  vehicleLocked = false;
  digitalWrite(STATUS_LED_PIN, LOW);
  Serial.println("Vehicle Unlocked");
}
```

## 📱 Integración en React Native

### 1. Instalar Dependencias
```bash
# Para Expo (requiere desarrollo build)
npx expo install expo-dev-client

# Instalar biblioteca Bluetooth
npm install react-native-bluetooth-classic
```

### 2. Configurar Permisos

#### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Para Android 12+ -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

#### iOS (`ios/VehicleGuard/Info.plist`)
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Esta app necesita Bluetooth para comunicarse con el sistema de control vehicular</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Esta app necesita Bluetooth para comunicarse con el sistema de control vehicular</string>
```

### 3. Implementación Real del BluetoothService

```typescript
import BluetoothClassic from 'react-native-bluetooth-classic';

class BluetoothServiceReal {
  private connectedDevice: any = null;
  
  async initialize(): Promise<boolean> {
    try {
      // Verificar si Bluetooth está habilitado
      const isEnabled = await BluetoothClassic.isBluetoothEnabled();
      if (!isEnabled) {
        await BluetoothClassic.requestBluetoothEnabled();
      }
      
      return true;
    } catch (error) {
      console.error('Bluetooth initialization failed:', error);
      return false;
    }
  }
  
  async scanDevices(): Promise<any[]> {
    try {
      // Escanear dispositivos emparejados
      const pairedDevices = await BluetoothClassic.getBondedDevices();
      
      // Filtrar solo dispositivos Arduino
      return pairedDevices.filter(device => 
        this.isArduinoDevice(device.name)
      );
    } catch (error) {
      console.error('Device scan failed:', error);
      return [];
    }
  }
  
  private isArduinoDevice(deviceName: string): boolean {
    const arduinoPatterns = [
      'VehicleControl',
      'HC-05',
      'HC-06',
      'ESP32',
      'Arduino'
    ];
    
    return arduinoPatterns.some(pattern => 
      deviceName.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      // Conectar al dispositivo
      const device = await BluetoothClassic.connectToDevice(deviceId);
      
      // Validar que es realmente un Arduino
      const isValid = await this.validateArduinoDevice(device);
      
      if (isValid) {
        this.connectedDevice = device;
        return true;
      } else {
        await device.disconnect();
        return false;
      }
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }
  
  private async validateArduinoDevice(device: any): Promise<boolean> {
    try {
      // Enviar comando PING
      await device.write('PING\n');
      
      // Esperar respuesta específica
      const response = await device.read();
      
      return response.trim() === 'PONG_VEHICLE';
    } catch (error) {
      console.error('Device validation failed:', error);
      return false;
    }
  }
  
  async sendCommand(command: 'lock' | 'unlock' | 'status'): Promise<boolean> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }
    
    try {
      const commandMap = {
        lock: 'LOCK\n',
        unlock: 'UNLOCK\n',
        status: 'STATUS\n'
      };
      
      // Enviar comando
      await this.connectedDevice.write(commandMap[command]);
      
      // Leer respuesta
      const response = await this.connectedDevice.read();
      
      // Validar respuesta
      const expectedResponses = {
        lock: 'LOCKED_OK',
        unlock: 'UNLOCKED_OK',
        status: ['LOCKED', 'UNLOCKED']
      };
      
      if (command === 'status') {
        return expectedResponses.status.includes(response.trim());
      } else {
        return response.trim() === expectedResponses[command];
      }
      
    } catch (error) {
      console.error('Command failed:', error);
      return false;
    }
  }
}
```

## 🔍 Identificación Específica de Arduino

### Métodos de Identificación

#### 1. Por Nombre del Dispositivo
```typescript
const isArduinoDevice = (deviceName: string): boolean => {
  const patterns = [
    'VehicleControl',  // Nombre personalizado
    'HC-05',          // Módulo común
    'HC-06',          // Módulo común
    'ESP32',          // Microcontrolador
  ];
  
  return patterns.some(pattern => 
    deviceName.toLowerCase().includes(pattern.toLowerCase())
  );
};
```

#### 2. Por Comando de Validación
```typescript
const validateDevice = async (device: any): Promise<boolean> => {
  try {
    await device.write('PING\n');
    const response = await device.read();
    
    // Solo tu Arduino responderá con esto
    return response.trim() === 'PONG_VEHICLE';
  } catch {
    return false;
  }
};
```

#### 3. Por UUID de Servicio (Avanzado)
```typescript
const VEHICLE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';

const hasVehicleService = async (device: any): Promise<boolean> => {
  try {
    const services = await device.getServices();
    return services.some(service => service.uuid === VEHICLE_SERVICE_UUID);
  } catch {
    return false;
  }
};
```

## 🛡️ Seguridad y Mejores Prácticas

### 1. Autenticación
```cpp
// En Arduino - agregar autenticación simple
String authToken = "VEHICLE_AUTH_2024";

void authenticateConnection() {
  bluetooth.println("AUTH_REQUIRED");
  String receivedToken = bluetooth.readStringUntil('\n');
  
  if (receivedToken.trim() == authToken) {
    bluetooth.println("AUTH_OK");
    authenticated = true;
  } else {
    bluetooth.println("AUTH_FAILED");
    authenticated = false;
  }
}
```

### 2. Encriptación de Comandos
```typescript
// En React Native - encriptar comandos
const encryptCommand = (command: string): string => {
  // Implementar encriptación simple
  return btoa(command + '_' + Date.now());
};
```

### 3. Timeout y Reintentos
```typescript
const sendCommandWithRetry = async (
  command: string, 
  maxRetries: number = 3
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const success = await sendCommand(command);
      if (success) return true;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
    }
    
    // Esperar antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
};
```

## 🚀 Pasos para Implementación

### 1. Preparar Arduino
- Cargar el código en tu Arduino
- Configurar el módulo Bluetooth
- Probar comandos manualmente

### 2. Configurar App
- Instalar dependencias Bluetooth
- Configurar permisos
- Reemplazar BluetoothService stub

### 3. Pruebas
- Probar conexión y desconexión
- Validar comandos de bloqueo/desbloqueo
- Probar manejo de errores

### 4. Producción
- Implementar autenticación
- Agregar logs y monitoreo
- Configurar manejo de errores robusto

## 📝 Notas Importantes

- **Emparejamiento**: Los dispositivos deben estar emparejados previamente
- **Distancia**: Bluetooth Classic tiene alcance limitado (~10 metros)
- **Batería**: Monitorear consumo de batería del Arduino
- **Seguridad**: Nunca hardcodear credenciales en el código
- **Testing**: Probar en diferentes dispositivos y versiones de Android/iOS

## 🔧 Troubleshooting

### Problemas Comunes
1. **No encuentra dispositivos**: Verificar permisos y que Bluetooth esté habilitado
2. **Conexión falla**: Verificar que el dispositivo esté emparejado
3. **Comandos no funcionan**: Verificar protocolo de comunicación
4. **Desconexiones frecuentes**: Verificar alimentación del Arduino

### Logs Útiles
```typescript
// Habilitar logs detallados
BluetoothClassic.setLogLevel('DEBUG');
```