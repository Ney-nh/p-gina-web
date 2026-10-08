/*
 * D.I.R.T. Comunitario — compuerta de doble lado
 * ---------------------------------------------------------------------------
 * Arduino UNO R4 WiFi con DOS servos: un lado frío y un lado caliente.
 * La página web se conecta por el Bluetooth LE que la placa ya trae
 * integrada, así que NO hace falta el módulo HC-06.
 *
 * REQUISITO: instalar la librería "ArduinoBLE"
 *   Herramientas -> Administrar Bibliotecas -> buscar "ArduinoBLE" -> Instalar
 *
 * CONEXIONES
 *   Servo FRÍO      señal (naranja) -> pin D9
 *   Servo CALIENTE  señal (naranja) -> pin D10
 *   Ambos servos    rojo  (+5V)     -> riel positivo de la fuente externa
 *   Ambos servos    marrón (GND)    -> riel negativo, unido al GND del Arduino
 *
 *   La masa común entre la fuente y el Arduino es obligatoria. Con dos
 *   servos el consumo se duplica: usa fuente externa de 5 V y al menos 2 A,
 *   y un capacitor de 1000 µF entre los rieles, cerca de los servos.
 *
 * PROTOCOLO (texto plano, sin salto de línea obligatorio)
 *   FRIO:<0-180>       posiciona el servo del lado frío
 *   CALIENTE:<0-180>   posiciona el servo del lado caliente
 *   CERRAR             lleva ambos servos a 0 grados
 *   ?                  responde con el ángulo actual de cada lado
 *
 *   Compatibilidad con la versión anterior de un solo servo:
 *   "A" abre el lado frío a 90 grados, "C" cierra todo, y un número suelto
 *   (por ejemplo "120") mueve el lado frío a ese ángulo.
 *
 * UUID (coinciden con assets/app.js de la página web)
 *   Servicio:        19b10000-e8f2-537e-4f6c-d104768a1214
 *   Comando (write): 19b10001-e8f2-537e-4f6c-d104768a1214
 *   Estado (notify): 19b10002-e8f2-537e-4f6c-d104768a1214
 */

#include <ArduinoBLE.h>
#include <Servo.h>

// --------------------------- Configuración ---------------------------------
const int PIN_SERVO_FRIO     = 9;
const int PIN_SERVO_CALIENTE = 10;

const int ANG_CERRADO = 0;    // posición de reposo de ambos servos
const int ANG_ABIERTO = 90;   // apertura por defecto del comando "A"

// Tiempo máximo que un lado puede quedar abierto sin recibir orden de
// cierre. Es una red de seguridad: si la app se cierra o el teléfono se
// bloquea, el Arduino cierra solo. Ponlo en 0 para desactivarlo.
const unsigned long MS_CIERRE_SEGURIDAD = 15000;

// --------------------------- Estado interno --------------------------------
Servo servoFrio;
Servo servoCaliente;

int anguloFrio = ANG_CERRADO;
int anguloCaliente = ANG_CERRADO;

unsigned long abiertoDesdeFrio = 0;      // 0 = cerrado
unsigned long abiertoDesdeCaliente = 0;

String comando = "";

// ------------------------------- BLE ---------------------------------------
BLEService servicioDirt("19b10000-e8f2-537e-4f6c-d104768a1214");

BLEStringCharacteristic caracComando(
  "19b10001-e8f2-537e-4f6c-d104768a1214",
  BLEWrite | BLEWriteWithoutResponse, 24);

BLEStringCharacteristic caracEstado(
  "19b10002-e8f2-537e-4f6c-d104768a1214",
  BLERead | BLENotify, 48);


void setup() {
  Serial.begin(115200);
  unsigned long inicio = millis();
  while (!Serial && millis() - inicio < 3000) { }

  servoFrio.attach(PIN_SERVO_FRIO);
  servoCaliente.attach(PIN_SERVO_CALIENTE);
  servoFrio.write(anguloFrio);
  servoCaliente.write(anguloCaliente);

  if (!BLE.begin()) {
    Serial.println("ERROR: no se pudo iniciar el Bluetooth del Arduino.");
    while (true) { }
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
  Serial.println("D.I.R.T. Comunitario - compuerta doble");
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
    caracEstado.writeValue("CONECTADO");

    while (central.connected()) {
      if (caracComando.written()) {
        procesarComando(caracComando.value());
      }
      vigilarCierreSeguridad();
    }

    Serial.println("Pagina desconectada. Cerrando por seguridad.");
    cerrarTodo();

    // Volver a anunciarse explicitamente. Sin esto, tras una desconexion
    // brusca la placa puede quedar visible en la lista del telefono pero
    // sin aceptar conexiones, y el navegador responde
    // "Connection attempt failed".
    BLE.advertise();
    Serial.println("Anunciandose de nuevo como DIRT.");
  }

  // También se vigila sin conexión, por si la app se cerró de golpe.
  vigilarCierreSeguridad();
}


// ---------------------------------------------------------------------------
// Interpreta un comando recibido por Bluetooth.
// ---------------------------------------------------------------------------
void procesarComando(String cmd) {
  cmd.trim();
  cmd.toUpperCase();
  if (cmd.length() == 0) return;

  Serial.print("Comando recibido: ");
  Serial.println(cmd);

  // ---- Formato LADO:ANGULO ----
  int sep = cmd.indexOf(':');
  if (sep > 0) {
    String lado = cmd.substring(0, sep);
    String valor = cmd.substring(sep + 1);
    valor.trim();

    if (!esNumero(valor)) {
      responder("ERROR: angulo invalido");
      return;
    }
    int angulo = valor.toInt();

    if (lado == "FRIO") {
      moverFrio(angulo);
      responder(String("FRIO:") + anguloFrio);
    } else if (lado == "CALIENTE") {
      moverCaliente(angulo);
      responder(String("CALIENTE:") + anguloCaliente);
    } else {
      responder("ERROR: lado desconocido");
    }
    return;
  }

  // ---- Comandos sueltos ----
  if (cmd == "CERRAR" || cmd == "C") {
    cerrarTodo();
    responder("CERRADO");
  }
  else if (cmd == "A") {                 // compatibilidad: abre el lado frío
    moverFrio(ANG_ABIERTO);
    responder(String("FRIO:") + anguloFrio);
  }
  else if (cmd == "?") {
    responder(String("FRIO:") + anguloFrio + " CALIENTE:" + anguloCaliente);
  }
  else if (esNumero(cmd)) {              // compatibilidad: número suelto
    moverFrio(cmd.toInt());
    responder(String("FRIO:") + anguloFrio);
  }
  else {
    responder("ERROR: comando desconocido");
  }
}


// ---------------------------------------------------------------------------
// Movimiento de cada servo. El ángulo se limita siempre a 0-180.
// ---------------------------------------------------------------------------
void moverFrio(int angulo) {
  anguloFrio = constrain(angulo, 0, 180);
  servoFrio.write(anguloFrio);
  abiertoDesdeFrio = (anguloFrio > ANG_CERRADO) ? millis() : 0;
  Serial.print("  Lado FRIO -> ");
  Serial.print(anguloFrio);
  Serial.println(" grados");
  delay(250);
}

void moverCaliente(int angulo) {
  anguloCaliente = constrain(angulo, 0, 180);
  servoCaliente.write(anguloCaliente);
  abiertoDesdeCaliente = (anguloCaliente > ANG_CERRADO) ? millis() : 0;
  Serial.print("  Lado CALIENTE -> ");
  Serial.print(anguloCaliente);
  Serial.println(" grados");
  delay(250);
}

void cerrarTodo() {
  moverFrio(ANG_CERRADO);
  moverCaliente(ANG_CERRADO);
}


// ---------------------------------------------------------------------------
// Red de seguridad: cierra un lado que lleve demasiado tiempo abierto.
// ---------------------------------------------------------------------------
void vigilarCierreSeguridad() {
  if (MS_CIERRE_SEGURIDAD == 0) return;

  unsigned long ahora = millis();

  if (abiertoDesdeFrio > 0 && ahora - abiertoDesdeFrio > MS_CIERRE_SEGURIDAD) {
    Serial.println("Cierre de seguridad: lado FRIO");
    moverFrio(ANG_CERRADO);
    responder("CERRADO:FRIO (seguridad)");
  }
  if (abiertoDesdeCaliente > 0 && ahora - abiertoDesdeCaliente > MS_CIERRE_SEGURIDAD) {
    Serial.println("Cierre de seguridad: lado CALIENTE");
    moverCaliente(ANG_CERRADO);
    responder("CERRADO:CALIENTE (seguridad)");
  }
}


// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
void responder(String mensaje) {
  caracEstado.writeValue(mensaje);
  Serial.print("  Respuesta: ");
  Serial.println(mensaje);
}

bool esNumero(String s) {
  if (s.length() == 0) return false;
  for (unsigned int i = 0; i < s.length(); i++) {
    if (!isDigit(s[i])) return false;
  }
  return true;
}
