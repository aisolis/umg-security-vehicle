# Guía de Uso - Módulo Bluetooth HC-06 "Command-Receiver"

## 📋 Resumen
Esta guía explica cómo usar el módulo Bluetooth HC-06 integrado en la aplicación VehicleGuard para conectarse específicamente al dispositivo "Command-Receiver" con PIN 2025.

## 🔧 Configuración del Dispositivo HC-06

### Especificaciones del Dispositivo
- **Nombre del dispositivo**: `Command-Receiver`
- **PIN de emparejamiento**: `2025`
- **Protocolo**: Comunicación serial Bluetooth
- **Baudrate**: 9600 (por defecto HC-06)

### Comandos AT para Configurar HC-06
Si necesitas configurar tu módulo HC-06, usa estos comandos AT:

```
AT+NAME=Command-Receiver    // Establecer nombre
AT+PIN=2025                 // Establecer PIN
AT+BAUD=4                   // Establecer baudrate 9600
```

## 📱 Uso en la Aplicación

### 1. Inicialización Automática
La aplicación inicializa automáticamente el servicio Bluetooth al abrir la pantalla principal:

```typescript
// Se ejecuta automáticamente
const success = await initialize();
```

### 2. Conexión al Dispositivo
La app busca específicamente el dispositivo "Command-Receiver":

1. **Busca en dispositivos emparejados** primero
2. **Escanea dispositivos cercanos** si no está emparejado
3. **Intenta conexión con PIN 2025** automáticamente
4. **Realiza hasta 3 intentos** de conexión

### 3. Envío de Comandos
Una vez conectado, puedes enviar comandos seriales:

```typescript
// Enviar comando simple
await sendCommand('LOCK');
await sendCommand('UNLOCK');

// Enviar comando y esperar respuesta
const response = await sendCommandAndWaitResponse('STATUS', 5000);
```

## 🎯 Componentes Principales

### HC06BluetoothService
Servicio principal que maneja toda la comunicación:

```typescript
import { HC06BluetoothService } from '@/services/HC06BluetoothService';

// Métodos principales
await HC06BluetoothService.initialize();
await HC06BluetoothService.connectToCommandReceiver();
await HC06BluetoothService.sendSerialCommand('LOCK');
await HC06BluetoothService.disconnect();
```

### useHC06Bluetooth Hook
Hook React que facilita el uso en componentes:

```typescript
import { useHC06Bluetooth } from '@/hooks/useHC06Bluetooth';

const {
  isConnected,
  isConnecting,
  connectedDevice,
  error,
  connect,
  disconnect,
  sendCommand,
} = useHC06Bluetooth();
```

### HC06ConnectionCard Component
Componente visual que muestra el estado de conexión:

```typescript
<HC06ConnectionCard
  isConnected={isConnected}
  isConnecting={isConnecting}
  connectedDevice={connectedDevice}
  error={error}
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
  onRetry={handleRetry}
/>
```

## 🔄 Estados de Conexión

### Estados Posibles
1. **Desconectado**: Sin conexión al dispositivo
2. **Escaneando**: Buscando el dispositivo "Command-Receiver"
3. **Conectando**: Intentando establecer conexión
4. **Conectado**: Conexión exitosa, listo para comandos
5. **Error**: Falló la conexión o comunicación

### Manejo de Errores
La aplicación maneja automáticamente:
- **Dispositivo no encontrado**: Muestra mensaje específico
- **PIN incorrecto**: Reintenta automáticamente
- **Timeout de conexión**: Reintenta hasta 3 veces
- **Pérdida de conexión**: Notifica y permite reconexión

## 📡 Protocolo de Comunicación

### Formato de Comandos
Los comandos se envían como texto plano terminado en `\n`:

```
LOCK\n      // Bloquear
UNLOCK\n    // Desbloquear
STATUS\n    // Consultar estado
PING\n      // Verificar conexión
```

### Respuestas Esperadas
El dispositivo HC-06 debe responder:

```
LOCKED_OK\n     // Confirmación de bloqueo
UNLOCKED_OK\n   // Confirmación de desbloqueo
LOCKED\n        // Estado actual: bloqueado
UNLOCKED\n      // Estado actual: desbloqueado
PONG_DEVICE\n   // Respuesta a PING
```

## 🛠️ Configuración del Arduino

### Código Arduino Ejemplo
```cpp
#include <SoftwareSerial.h>

SoftwareSerial bluetooth(2, 3); // RX, TX
bool vehicleLocked = true;

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  Serial.println("Command-Receiver Ready");
}

void loop() {
  if (bluetooth.available()) {
    String command = bluetooth.readStringUntil('\n');
    command.trim();
    
    if (command == "LOCK") {
      vehicleLocked = true;
      bluetooth.println("LOCKED_OK");
      Serial.println("Vehicle Locked");
    }
    else if (command == "UNLOCK") {
      vehicleLocked = false;
      bluetooth.println("UNLOCKED_OK");
      Serial.println("Vehicle Unlocked");
    }
    else if (command == "STATUS") {
      bluetooth.println(vehicleLocked ? "LOCKED" : "UNLOCKED");
    }
    else if (command == "PING") {
      bluetooth.println("PONG_DEVICE");
    }
    else {
      bluetooth.println("UNKNOWN_COMMAND");
    }
  }
}
```

## 🔐 Seguridad

### Medidas Implementadas
1. **PIN específico**: Solo acepta conexiones con PIN 2025
2. **Nombre específico**: Solo busca "Command-Receiver"
3. **Validación de dispositivo**: Verifica respuesta a comando PING
4. **Timeout de conexión**: Evita conexiones colgadas
5. **Reintentos limitados**: Máximo 3 intentos de conexión

### Recomendaciones
- Mantén el dispositivo HC-06 cerca durante la conexión
- Asegúrate de que esté emparejado previamente en configuración del teléfono
- Verifica que no haya otros dispositivos con el mismo nombre
- Usa el PIN 2025 exactamente como está configurado

## 🚨 Troubleshooting

### Problemas Comunes

#### "Dispositivo no encontrado"
- Verifica que el HC-06 esté encendido
- Confirma que el nombre sea exactamente "Command-Receiver"
- Asegúrate de que esté en modo emparejable

#### "Error de conexión"
- Verifica el PIN 2025
- Reinicia el módulo HC-06
- Desempareja y vuelve a emparejar el dispositivo

#### "Timeout de conexión"
- Acerca el teléfono al módulo HC-06
- Verifica que no haya interferencias
- Reinicia Bluetooth en el teléfono

#### "Comando no funciona"
- Verifica que el Arduino esté ejecutando el código correcto
- Confirma la velocidad de baudrate (9600)
- Revisa las conexiones físicas del HC-06

### Logs de Debug
La aplicación genera logs detallados:

```
🔵 Inicializando servicio Bluetooth HC-06...
🔍 Buscando dispositivo "Command-Receiver"...
🎯 ¡Command-Receiver encontrado!
🔗 Conexión establecida
📤 Enviando comando: LOCK
✅ Comando enviado exitosamente
```

## 📞 Soporte

Si tienes problemas con la conexión Bluetooth:

1. Revisa los logs en la consola de desarrollo
2. Verifica la configuración del HC-06
3. Confirma que el Arduino esté ejecutando el código correcto
4. Asegúrate de que los permisos Bluetooth estén habilitados

---

**Versión**: 1.0.0  
**Dispositivo Compatible**: HC-06 "Command-Receiver"  
**PIN**: 2025  
**Protocolo**: Serial Bluetooth