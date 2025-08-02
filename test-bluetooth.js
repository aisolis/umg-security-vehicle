/**
 * Test script para verificar la funcionalidad de Bluetooth
 * Este es un test básico para verificar que las funciones principales funcionan
 */

// Importar el servicio de Bluetooth
const { BluetoothService } = require('./services/BluetoothService.ts');

async function testBluetoothFunctionality() {
  console.log('🔵 Iniciando pruebas de Bluetooth...\n');

  try {
    // Test 1: Inicialización
    console.log('1️⃣ Probando inicialización...');
    const initialized = await BluetoothService.initialize();
    console.log(`   ✅ Inicialización: ${initialized ? 'EXITOSA' : 'FALLIDA'}\n`);

    if (!initialized) {
      console.log('❌ No se puede continuar sin inicialización exitosa');
      return;
    }

    // Test 2: Escanear dispositivos
    console.log('2️⃣ Probando escaneo de dispositivos...');
    try {
      const devices = await BluetoothService.scanDevices();
      console.log(`   ✅ Dispositivos encontrados: ${devices.length}`);
      
      devices.forEach((device, index) => {
        console.log(`   📱 ${index + 1}. ${device.name || 'Sin nombre'} (${device.id}) - RSSI: ${device.rssi}`);
      });
      console.log('');

      // Test 3: Filtrar dispositivos del vehículo
      console.log('3️⃣ Probando filtro de dispositivos del vehículo...');
      const vehicleDevices = BluetoothService.filterVehicleDevices(devices);
      console.log(`   ✅ Dispositivos del vehículo encontrados: ${vehicleDevices.length}`);
      
      vehicleDevices.forEach((device, index) => {
        console.log(`   🚗 ${index + 1}. ${device.name} (${device.id}) - RSSI: ${device.rssi}`);
      });
      console.log('');

      // Test 4: Auto-conexión (solo si hay dispositivos del vehículo)
      if (vehicleDevices.length > 0) {
        console.log('4️⃣ Probando auto-conexión...');
        const connected = await BluetoothService.autoConnect();
        console.log(`   ${connected ? '✅' : '❌'} Auto-conexión: ${connected ? 'EXITOSA' : 'FALLIDA'}`);
        
        if (connected) {
          const connectedDevice = BluetoothService.getConnectedDevice();
          console.log(`   📲 Conectado a: ${connectedDevice?.name} (${connectedDevice?.id})`);
          
          // Test 5: Enviar comando
          console.log('\n5️⃣ Probando envío de comando...');
          const commandSent = await BluetoothService.sendCommand('status');
          console.log(`   ${commandSent ? '✅' : '❌'} Comando enviado: ${commandSent ? 'EXITOSO' : 'FALLIDO'}`);
          
          // Test 6: Desconexión
          console.log('\n6️⃣ Probando desconexión...');
          await BluetoothService.disconnect();
          const stillConnected = BluetoothService.isDeviceConnected();
          console.log(`   ${!stillConnected ? '✅' : '❌'} Desconexión: ${!stillConnected ? 'EXITOSA' : 'FALLIDA'}`);
        }
      } else {
        console.log('⚠️  No se encontraron dispositivos del vehículo para probar conexión');
      }

    } catch (scanError) {
      console.log(`   ❌ Error durante escaneo: ${scanError.message}`);
    }

  } catch (error) {
    console.error('❌ Error general durante las pruebas:', error.message);
  }

  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar las pruebas
testBluetoothFunctionality();