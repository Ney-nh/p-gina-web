/*
 * D.I.R.T. — prueba de conexión con la página web
 * ---------------------------------------------------------------------------
 * Arduino UNO R4 WiFi. La página se conecta por el Bluetooth LE que la placa
 * ya trae integrado y le manda "?". El Arduino responde "OK D1RT" y hace
 * parpadear su LED, para ver en la placa que la prueba llegó.
 *
 * Esta versión ya NO mueve compuertas ni servomotores: no hace falta
 * conectarle nada, solo el cable USB.
 *
 * REQUISITO: instalar la librería "ArduinoBLE"
 *   Herramientas -> Administrar Bibliotecas -> buscar "ArduinoBLE" -> Instalar
 *
 * PROTOCOLO (texto plano)
 *   ?  o  PING     responde "OK D1RT"
 *   cualquier otro responde "OK D1RT" igual, para que la prueba no falle
 *                  por un comando viejo
 *
 * UUID (coinciden con assets/app.js de la página web)
 *   Servicio:        19b10000-e8f2-537e-4f6c-d104768a1214
 *   Comando (write): 19b10001-e8f2-537e-4f6c-d104768a1214
 *   Estado (notify): 19b10002-e8f2-537e-4f6c-d104768a1214
 */

#include <ArduinoBLE.h>

// ------------------------------- BLE ---------------------------------------
BLEService servicioDirt("19b10000-e8f2-537e-4f6c-d104768a1214");

BLEStringCharacteristic caracComando(
  "19b10001-e8f2-537e-4f6c-d104768a1214",
  BLEWrite | BLEWriteWithoutResponse, 24);

BLEStringCharacteristic caracEstado(
  "19b10002-e8f2-537e-4f6c-d104768a1214",
  BLERead | BLENotify, 48);

unsigned long pruebas = 0;   // cuántas pruebas se han respondido


void setup() {
  Serial.begin(115200);
  unsigned long inicio = millis();
  while (!Serial && millis() - inicio < 3000) { }

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  if (!BLE.begin()) {
    Serial.println("ERROR: no se pudo iniciar el Bluetooth del Arduino.");
    while (true) {
      // Parpadeo rápido sin fin: algo falló al arrancar el Bluetooth.
      digitalWrite(LED_BUILTIN, HIGH); delay(100);
      digitalWrite(LED_BUILTIN, LOW);  delay(100);
    }
  }

  BLE.setLocalName("DIRT");
  BLE.setDeviceName("DIRT");
  BLE.setAdvertisedService(servicioDirt);

  servicioDirt.addCharacteristic(caracComando);
  servicioDirt.addCharacteristic(caracEstado);
  BLE.addService(servicioDirt);

  caracEstado.writeValue("LISTO");
  BLE.advertise();

  Serial.println("------------------------------------------");
  Serial.println("D.I.R.T. - prueba de conexion");
  Serial.println("Dispositivo Bluetooth: DIRT");
  Serial.print("Direccion MAC: ");
  Serial.println(BLE.address());
  Serial.println("Esperando que la pagina web se conecte...");
  Serial.println("------------------------------------------");
}


void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.print("Pagina conectada desde: ");
    Serial.println(central.address());
    digitalWrite(LED_BUILTIN, HIGH);   // LED encendido = hay una página conectada
    caracEstado.writeValue("CONECTADO");

    while (central.connected()) {
      if (caracComando.written()) {
        responder(caracComando.value());
      }
    }

    Serial.println("Pagina desconectada.");
    digitalWrite(LED_BUILTIN, LOW);

    // Volver a anunciarse explícitamente. Sin esto, tras una desconexión
    // brusca la placa puede quedar visible en la lista del teléfono pero
    // sin aceptar conexiones, y el navegador responde
    // "Connection attempt failed".
    BLE.advertise();
    Serial.println("Anunciandose de nuevo como DIRT.");
  }
}


// ---------------------------------------------------------------------------
// Responde a la prueba de la página y parpadea el LED tres veces.
// ---------------------------------------------------------------------------
void responder(String cmd) {
  cmd.trim();
  pruebas++;
  Serial.print("Prueba #");
  Serial.print(pruebas);
  Serial.print(" recibida: '");
  Serial.print(cmd);
  Serial.println("'");

  caracEstado.writeValue("OK D1RT");

  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_BUILTIN, LOW);  delay(90);
    digitalWrite(LED_BUILTIN, HIGH); delay(90);
  }
}
