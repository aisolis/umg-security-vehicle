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
const int STATUS_LED_PIN = 12; // LED adicional para indicar estado de bloqueo

// Variables para manejo de conexión
unsigned long lastCommandTime = 0;
const unsigned long CONNECTION_TIMEOUT = 8000; // 8 segundos sin comandos = desconexión
const unsigned long HEARTBEAT_INTERVAL = 15000; // Verificar conexión cada 15 segundos
unsigned long lastHeartbeat = 0;

// Variables para seguridad
bool vehicleIsLocked = true; // Estado por defecto: BLOQUEADO
bool connectionActive = false;
unsigned long lastConnectionTime = 0;
const unsigned long DISCONNECT_LOCK_DELAY = 2000; // 2 segundos después de desconexión, bloquear

void setup() {
  Serial.begin(9600);
  while (!Serial);

  // Configurar pines
  pinMode(LED_PIN, OUTPUT);
  pinMode(LOCK_PIN, OUTPUT);
  pinMode(UNLOCK_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  // Estado inicial de seguridad: BLOQUEADO
  lockVehicle();
  Serial.println("🔒 Estado inicial: Vehículo BLOQUEADO por seguridad");

  // Inicializar BLE
  if (!BLE.begin()) {
    Serial.println("❌ Error iniciando BLE!");
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
  txCharacteristic.writeValue("READY_LOCKED");

  // Iniciar publicidad
  BLE.advertise();

  Serial.println("🚗 Arduino BLE Vehicle Control (Modo Seguro)");
  Serial.println("📡 Esperando conexiones...");
  Serial.println("🔒 SEGURIDAD: Vehículo se bloquea automáticamente sin conexión");
  
  digitalWrite(LED_PIN, HIGH); // Indicar que está listo para conexiones
  updateStatusLED();
}

void loop() {
  // Esperar conexión BLE
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("📱 Conectado a: ");
    Serial.println(central.address());
    
    connectionActive = true;
    lastConnectionTime = millis();
    digitalWrite(LED_PIN, LOW); // Indicar conexión activa
    lastCommandTime = millis(); // Resetear timeout
    lastHeartbeat = millis();

    while (central.connected()) {
      unsigned long currentTime = millis();
      
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
        Serial.print("📨 Comando recibido: ");
        Serial.println(command);

        // Actualizar tiempo del último comando
        lastCommandTime = currentTime;
        
        // Procesar comando
        processCommand(command);
      }
      
      // Verificar timeout de conexión (si no hay comandos por mucho tiempo)
      if (currentTime - lastCommandTime > CONNECTION_TIMEOUT) {
        Serial.println("⏰ Timeout de conexión - forzando desconexión por seguridad");
        central.disconnect();
        break;
      }
      
      // Heartbeat periódico para verificar conexión
      if (currentTime - lastHeartbeat > HEARTBEAT_INTERVAL) {
        Serial.println("💓 Heartbeat - conexión activa");
        lastHeartbeat = currentTime;
        
        // Enviar heartbeat para mantener conexión activa
        String heartbeatMsg = vehicleIsLocked ? "HEARTBEAT_LOCKED" : "HEARTBEAT_UNLOCKED";
        txCharacteristic.writeValue(heartbeatMsg.c_str());
      }
      
      // Pequeño delay para no saturar el procesador
      delay(100);
    }

    // CONEXIÓN PERDIDA - ACTIVAR SEGURIDAD
    Serial.print("🔌 Desconectado de: ");
    Serial.println(central.address());
    connectionActive = false;
    lastConnectionTime = millis();
    
    digitalWrite(LED_PIN, HIGH); // Indicar desconexión
    
    // MEDIDA DE SEGURIDAD: Bloquear automáticamente tras desconexión
    Serial.println("🚨 SEGURIDAD ACTIVADA: Bloqueando vehículo tras desconexión");
    delay(DISCONNECT_LOCK_DELAY); // Pequeño delay antes de bloquear
    lockVehicle();
    
    // Reset de variables
    lastCommandTime = 0;
    lastHeartbeat = 0;
    
    // Delay antes de aceptar nuevas conexiones
    delay(1000);
    
  } else {
    // Sin conexión activa - verificar estado de seguridad
    unsigned long currentTime = millis();
    
    // Si ha pasado tiempo sin conexión y el vehículo no está bloqueado, bloquearlo
    if (!connectionActive && !vehicleIsLocked && 
        (currentTime - lastConnectionTime > DISCONNECT_LOCK_DELAY)) {
      Serial.println("🚨 SEGURIDAD: Tiempo sin conexión excedido - Bloqueando vehículo");
      lockVehicle();
    }
    
    // Actualizar LED de estado periódicamente
    static unsigned long lastStatusUpdate = 0;
    if (currentTime - lastStatusUpdate > 1000) { // Cada segundo
      updateStatusLED();
      lastStatusUpdate = currentTime;
    }
  }
}

void processCommand(String command) {
  String response = "";
  
  // Limpiar el comando de caracteres extra
  command.trim();
  command.replace("\n", "");
  command.replace("\r", "");
  
  Serial.print("🔍 Comando limpio: '");
  Serial.print(command);
  Serial.print("' (longitud: ");
  Serial.print(command.length());
  Serial.println(")");
  
  if (command == "LOCK") {
    lockVehicle();
    response = "LOCKED";
    Serial.println("🔒 Vehículo bloqueado por comando");
    
  } else if (command == "UNLOCK") {
    unlockVehicle();
    response = "UNLOCKED";
    Serial.println("🔓 Vehículo desbloqueado por comando");
    
  } else if (command == "STATUS") {
    // Enviar estado del vehículo
    response = vehicleIsLocked ? "LOCKED" : "UNLOCKED";
    Serial.print("📊 Estado solicitado: ");
    Serial.println(response);
    
  } else {
    response = "UNKNOWN_COMMAND";
    Serial.print("❓ Comando desconocido: '");
    Serial.print(command);
    Serial.println("'");
    
    // Debug: mostrar cada carácter
    Serial.print("🔍 Caracteres ASCII: ");
    for (int i = 0; i < command.length(); i++) {
      Serial.print((int)command.charAt(i));
      Serial.print(" ");
    }
    Serial.println();
  }

  // Enviar respuesta
  txCharacteristic.writeValue(response.c_str());
  Serial.println("📤 Respuesta enviada: " + response);
  
  updateStatusLED();
}

void lockVehicle() {
  // Activar mecanismo de bloqueo
  digitalWrite(LOCK_PIN, HIGH);
  delay(500);
  digitalWrite(LOCK_PIN, LOW);
  
  vehicleIsLocked = true;
  Serial.println("🔒 VEHÍCULO BLOQUEADO");
  updateStatusLED();
}

void unlockVehicle() {
  // Solo desbloquear si hay conexión activa
  if (!connectionActive) {
    Serial.println("🚨 SEGURIDAD: No se puede desbloquear sin conexión activa");
    return;
  }
  
  // Activar mecanismo de desbloqueo
  digitalWrite(UNLOCK_PIN, HIGH);
  delay(500);
  digitalWrite(UNLOCK_PIN, LOW);
  
  vehicleIsLocked = false;
  Serial.println("🔓 VEHÍCULO DESBLOQUEADO");
  updateStatusLED();
}

void updateStatusLED() {
  if (vehicleIsLocked) {
    // LED encendido constante = bloqueado
    digitalWrite(STATUS_LED_PIN, HIGH);
  } else {
    // LED parpadeante = desbloqueado (solo con conexión activa)
    if (connectionActive) {
      // Parpadeo lento para indicar desbloqueado pero seguro
      static unsigned long lastBlink = 0;
      static bool blinkState = false;
      
      if (millis() - lastBlink > 1000) { // Parpadeo cada segundo
        blinkState = !blinkState;
        digitalWrite(STATUS_LED_PIN, blinkState ? HIGH : LOW);
        lastBlink = millis();
      }
    } else {
      // Sin conexión = forzar bloqueo
      lockVehicle();
    }
  }
}