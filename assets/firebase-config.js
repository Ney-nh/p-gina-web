/* =========================================================================
   CONFIGURACIÓN DE FIREBASE
   -------------------------------------------------------------------------
   Pega aquí los datos de tu proyecto. Se obtienen así:

     1. Entra a  https://console.firebase.google.com
     2. Crea un proyecto (o abre el que ya tengas).
     3. Menú lateral → Compilación → Firestore Database → Crear base de datos.
        Elige la región  southamerica-east1  (la más cercana a Colombia).
     4. Rueda dentada (arriba a la izquierda) → Configuración del proyecto.
     5. Baja hasta "Tus apps" → icono  </>  (Web) → registra la app.
     6. Firebase muestra un bloque  const firebaseConfig = { ... }
        Copia los valores y reemplaza los de abajo.

   Mientras los valores digan "PEGA_AQUI_..." la app funciona en MODO LOCAL:
   todo se guarda únicamente en este navegador. En cuanto pegues los datos
   reales, los registros empiezan a ir a Firestore.

   ¿Es seguro que estas claves estén en un repositorio público?
   Sí. La apiKey de Firebase para web NO es un secreto: identifica al
   proyecto, no autoriza nada por sí sola. Quien protege los datos son las
   reglas de seguridad de Firestore (archivo firestore.rules de este mismo
   repositorio). Léelo antes de publicar la página.
   ========================================================================= */

export const firebaseConfig = {
  apiKey:            "AIzaSyCT1qsm1xXnH2lL9FsDC5aMJLXST9JcCrQ",
  authDomain:        "dirt-240c5.firebaseapp.com",
  projectId:         "dirt-240c5",
  storageBucket:     "dirt-240c5.firebasestorage.app",
  messagingSenderId: "85212427379",
  appId:             "1:85212427379:web:01d451302ef0906574a606",
};

/** true cuando la configuración todavía tiene los valores de ejemplo. */
export const sinConfigurar = Object.values(firebaseConfig).some((v) =>
  String(v).startsWith("PEGA_AQUI_"),
);
