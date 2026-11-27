/*
 * D.I.R.T. — conexión con la página web y LED de cada lado
 * ---------------------------------------------------------------------------
 * Arduino UNO R4 WiFi. La página se conecta por el Bluetooth LE que la placa
 * ya trae integrado.
 *
 *  - Prueba de conexión: la página manda "?" y el Arduino responde "OK D1RT".
 *    Los dos LED parpadean para ver en la placa que la prueba llegó.
 *  - Cuando alguien registra un alimento, la página manda el lado:
 *      FRIO      enciende el LED AZUL  (lácteos, frutas, bebidas)
 *      CALIENTE  enciende el LED ROJO  (fritos)
 *      APAGAR    apaga los dos (cuando se toca "Listo" en la página)
 *    Si nadie toca "Listo", el LED se apaga solo a los 15 segundos.
 *
 * CONEXIÓN DE LOS LED (cada uno con su resistencia de 220 Ω)
 *   Pin 1 ──[220 Ω]──▶|── GND    LED azul  (lado frío)
 *   Pin 2 ──[220 Ω]──▶|── GND    LED rojo  (lado caliente)
 *   La pata larga del LED (+) va hacia el pin; la corta (−) a GND.
 *   En el UNO R4 el pin 1 está libre: el monitor serie va por el USB.
 *
 * REQUISITO: instalar la librería "ArduinoBLE"
 *   Herramientas -> Administrar Bibliotecas -> buscar "ArduinoBLE" -> Instalar
 *
 * UUID (coinciden con assets/app.js de la página web)
 *   Servicio:        19b10000-e8f2-537e-4f6c-d104768a1214
 *   Comando (write): 19b10001-e8f2-537e-4f6c-d104768a1214
 *   Estado (notify): 19b10002-e8f2-537e-4f6c-d104768a1214
 */

#include <ArduinoBLE.h>

// ------------------------------ LED ----------------------------------------
const int LED_AZUL = 1;   // lado frío
const int LED_ROJO = 2;   // lado caliente
const unsigned long LED_MAX_MS = 15000;   // se apaga solo después de esto

unsigned long ledDesde = 0;   // cuándo se encendió (0 = apagados)

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
  pinMode(LED_AZUL, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  apagarLados();

  // Al arrancar se prenden los dos un momento, para comprobar los cables.
  digitalWrite(LED_AZUL, HIGH); digitalWrite(LED_ROJO, HIGH);
  delay(600);
  apagarLados();

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
  Serial.println("D.I.R.T. - conexion y LED de cada lado");
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
    digitalWrite(LED_BUILTIN, HIGH);   // LED de la placa = hay una página conectada
    caracEstado.writeValue("CONECTADO");

    while (central.connected()) {
      if (caracComando.written()) {
        atender(caracComando.value());
      }
      revisarApagado();
    }

    Serial.println("Pagina desconectada.");
    digitalWrite(LED_BUILTIN, LOW);
    apagarLados();

    // Volver a anunciarse explícitamente. Sin esto, tras una desconexión
    // brusca la placa puede quedar visible en la lista del teléfono pero
    // sin aceptar conexiones, y el navegador responde
    // "Connection attempt failed".
    BLE.advertise();
    Serial.println("Anunciandose de nuevo como DIRT.");
  }

  revisarApagado();
}


// ---------------------------------------------------------------------------
// Lo que manda la página.
// ---------------------------------------------------------------------------
void atender(String cmd) {
  cmd.trim();
  cmd.toUpperCase();
  Serial.print("Recibido: '");
  Serial.print(cmd);
  Serial.println("'");

  if (cmd == "FRIO") {
    encenderLado(LED_AZUL);
    caracEstado.writeValue("OK FRIO");
  } else if (cmd == "CALIENTE") {
    encenderLado(LED_ROJO);
    caracEstado.writeValue("OK CALIENTE");
  } else if (cmd == "APAGAR") {
    apagarLados();
    caracEstado.writeValue("OK APAGAR");
  } else {
    // "?" o cualquier otra cosa: es la prueba de conexión.
    pruebaConexion();
  }
}

void encenderLado(int pin) {
  apagarLados();               // solo un lado encendido a la vez
  digitalWrite(pin, HIGH);
  ledDesde = millis();
  if (ledDesde == 0) ledDesde = 1;
}

void apagarLados() {
  digitalWrite(LED_AZUL, LOW);
  digitalWrite(LED_ROJO, LOW);
  ledDesde = 0;
}

void revisarApagado() {
  if (ledDesde != 0 && millis() - ledDesde >= LED_MAX_MS) {
    apagarLados();
  }
}

// Responde "OK D1RT" y hace parpadear los dos LED tres veces.
void pruebaConexion() {
  pruebas++;
  Serial.print("Prueba de conexion #");
  Serial.println(pruebas);
  caracEstado.writeValue("OK D1RT");

  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_AZUL, HIGH); digitalWrite(LED_ROJO, HIGH); delay(120);
    digitalWrite(LED_AZUL, LOW);  digitalWrite(LED_ROJO, LOW);  delay(120);
  }
  ledDesde = 0;
}
