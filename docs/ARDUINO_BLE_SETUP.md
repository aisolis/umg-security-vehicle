# Configuración Arduino Rev 4 WiFi con BLE

## 📱 Código Arduino para BLE

### 1. Instalar ArduinoBLE correctamente

**SOLUCIÓN al error "ArduinoBLE.h: No such file or directory":**

1. **Abrir Arduino IDE**
2. **Ir a Tools → Manage Libraries...**
3. **Buscar "ArduinoBLE"**
4. **Instalar "ArduinoBLE" by Arduino (versión más reciente)**
5. **Seleccionar Board**: Tools → Board → Arduino UNO R4 Boards → Arduino UNO R4 WiFi
6. **Verificar puerto**: Tools → Port → (seleccionar tu puerto COM)

### 2. Código base para Arduino Rev 4 WiFi
```cpp
#include <ArduinoBLE.h>

// UUIDs para el servicio del vehículo
#define VEHICLE_SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define VEHICLE_CHARACTERISTIC_RX   "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"  // Recibir comandos
#define VEHICLE_CHARACTERISTIC_TX   "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"  // Enviar respuestas

// Crear servicio BLE
BLEService vehicleService(VEHICLE_SERVICE_UUID);

// Crear características
BLECharacteristic rxCharacteristic(VEHICLE_CHARACTERISTIC_RX, BLEWrite, 20);
BLECharacteristic txCharacteristic(VEHICLE_CHARACTERISTIC_TX, BLERead | BLENotify, 20);

// Pines para control del vehículo (ajusta según tu circuito)
const int LED_PIN = 13;
const int LOCK_PIN = 2;
const int UNLOCK_PIN = 3;

void setup() {
  Serial.begin(9600);
  while (!Serial);

  // Configurar pines
  pinMode(LED_PIN, OUTPUT);
  pinMode(LOCK_PIN, OUTPUT);
  pinMode(UNLOCK_PIN, OUTPUT);

  // Inicializar BLE
  if (!BLE.begin()) {
    Serial.println("Error iniciando BLE!");
    while (1);
  }

  // Configurar el dispositivo BLE
  BLE.setLocalName("VehicleControl_Arduino");  // Nombre que aparecerá en el escaneo
  BLE.setAdvertisedService(vehicleService);

  // Agregar características al servicio
  vehicleService.addCharacteristic(rxCharacteristic);
  vehicleService.addCharacteristic(txCharacteristic);

  // Agregar servicio
  BLE.addService(vehicleService);

  // Configurar valores iniciales
  txCharacteristic.writeValue("READY");

  // Iniciar publicidad
  BLE.advertise();

  Serial.println("Arduino BLE Vehicle Control");
  Serial.println("Esperando conexiones...");
  digitalWrite(LED_PIN, HIGH); // Indicar que está listo
}

void loop() {
  // Esperar conexión BLE
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Conectado a: ");
    Serial.println(central.address());
    digitalWrite(LED_PIN, LOW); // Indicar conexión

    while (central.connected()) {
      // Verificar si hay comandos recibidos
      if (rxCharacteristic.written()) {
        String command = "";
        
        // Leer el comando
        int length = rxCharacteristic.valueLength();
        const uint8_t* value = rxCharacteristic.value();
        
        for (int i = 0; i < length; i++) {
          command += (char)value[i];
        }
        
        command.trim(); // Remover espacios y \n
        Serial.print("Comando recibido: ");
        Serial.println(command);

        // Procesar comando
        processCommand(command);
      }
    }

    Serial.print("Desconectado de: ");
    Serial.println(central.address());
    digitalWrite(LED_PIN, HIGH); // Indicar desconexión
  }
}

void processCommand(String command) {
  String response = "";
  
  if (command == "LOCK") {
    // Lógica para bloquear el vehículo
    digitalWrite(LOCK_PIN, HIGH);
    delay(500);
    digitalWrite(LOCK_PIN, LOW);
    response = "LOCKED";
    Serial.println("🔒 Vehículo bloqueado");
    
  } else if (command == "UNLOCK") {
    // Lógica para desbloquear el vehículo
    digitalWrite(UNLOCK_PIN, HIGH);
    delay(500);
    digitalWrite(UNLOCK_PIN, LOW);
    response = "UNLOCKED";
    Serial.println("🔓 Vehículo desbloqueado");
    
  } else if (command == "STATUS") {
    // Enviar estado del vehículo
    response = "ONLINE";
    Serial.println("📊 Estado solicitado");
    
  } else {
    response = "UNKNOWN_COMMAND";
    Serial.println("❓ Comando desconocido: " + command);
  }

  // Enviar respuesta
  txCharacteristic.writeValue(response.c_str());
  Serial.println("Respuesta enviada: " + response);
}
```

## 🔧 Configuración de UUIDs

### UUIDs ya configurados en tu app:
- **Servicio**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` (Nordic UART Service)
- **RX** (recibir): `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` 
- **TX** (transmitir): `6E400003-B5A3-F393-E0A9-E50E24DCCA9E`

### Si quieres generar UUIDs personalizados:
1. Usa un generador online: https://www.uuidgenerator.net/
2. Actualiza tanto el código Arduino como el servicio React Native

## 📡 Cómo probar la conexión

### 1. Cargar código al Arduino
```bash
# Conecta tu Arduino Rev 4 WiFi por USB
# Abre Arduino IDE
# Selecciona Board: "Arduino UNO R4 WiFi"
# Carga el código anterior
```

### 2. Verificar en Serial Monitor
```
Arduino BLE Vehicle Control
Esperando conexiones...
```

### 3. Probar con tu app React Native
```javascript
// Tu app debería encontrar: "VehicleControl_Arduino"
const devices = await BluetoothService.scanDevices();
const vehicleDevices = BluetoothService.filterVehicleDevices(devices);
```

## 🚨 Solución de problemas comunes

### Error: "ArduinoBLE.h: No such file or directory"

**Pasos para solucionarlo:**

1. **Verificar versión Arduino IDE**: Necesitas IDE 2.0 o superior
2. **Instalar boards package**:
   - Tools → Board → Boards Manager
   - Buscar "Arduino UNO R4 Boards"
   - Instalar la versión más reciente

3. **Instalar ArduinoBLE**:
   ```
   Tools → Manage Libraries → ArduinoBLE (by Arduino)
   ```

4. **Verificar selección de board**:
   ```
   Tools → Board → Arduino UNO R4 Boards → Arduino UNO R4 WiFi
   ```

5. **Si persiste el error**:
   - Cerrar Arduino IDE completamente
   - Reiniciar Arduino IDE
   - Intentar compilar nuevamente

### Código de prueba mínimo
Si sigues teniendo problemas, prueba este código mínimo:

```cpp
#include <ArduinoBLE.h>

void setup() {
  Serial.begin(9600);
  while (!Serial);
  
  if (!BLE.begin()) {
    Serial.println("Error BLE!");
    while (1);
  }
  
  Serial.println("BLE iniciado correctamente!");
}

void loop() {
  // Vacío para prueba
}
```

## 🔍 Debugging

### Verificar UUIDs en tu Arduino
Agrega este código al setup():
```cpp
Serial.print("Servicio UUID: ");
Serial.println(VEHICLE_SERVICE_UUID);
Serial.print("RX UUID: ");
Serial.println(VEHICLE_CHARACTERISTIC_RX);
Serial.print("TX UUID: ");
Serial.println(VEHICLE_CHARACTERISTIC_TX);
```

### Herramientas útiles
- **nRF Connect** (app móvil): Para escanear y probar BLE
- **Serial Monitor**: Para ver logs del Arduino
- **BLE Scanner** (app móvil): Para verificar UUIDs

## ⚡ Consejos importantes

1. **Nombre del dispositivo**: Asegúrate que sea "VehicleControl_Arduino" o actualiza `VEHICLE_DEVICE_PATTERNS` en tu app
2. **Distancia**: Mantén el Arduino cerca (~1-2 metros) durante pruebas
3. **Alimentación**: El Arduino Rev 4 WiFi consume más energía con BLE activo
4. **Debugging**: Usa Serial Monitor para ver qué pasa en el Arduino

## 🚗 Próximos pasos

1. Carga el código al Arduino
2. Abre Serial Monitor (115200 baud)
3. Ejecuta tu app React Native
4. ¡Deberías ver la conexión en ambos lados!