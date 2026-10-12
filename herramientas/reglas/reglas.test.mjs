import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const fallos = [];
const ok  = m => console.log('  OK   ' + m);
const mal = m => { console.log('  FALLA ' + m); fallos.push(m); };

const env = await initializeTestEnvironment({
  projectId: 'dirt-prueba',
  firestore: { host: '127.0.0.1', port: 8181, rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8") },
});
await env.clearFirestore();
const db = env.unauthenticatedContext().firestore();

const bueno = (extra = {}) => ({
  tipo: 'entrada', nombre: 'Ana Pérez', documento: '1098765',
  categoria: 'frutas', cantidad: 3, nota: null, lado: 'frio',
  compuerta_abierta: true, created_at: serverTimestamp(), deleted_at: null,
  ...extra,
});

async function permite(desc, datos, id) {
  try { await assertSucceeds(setDoc(doc(db, 'movimientos', id), datos)); ok(desc); }
  catch { mal(desc + ' (debería permitirse)'); }
}
async function rechaza(desc, datos, id) {
  try { await assertFails(setDoc(doc(db, 'movimientos', id), datos)); ok(desc); }
  catch { mal(desc + ' (debería rechazarse)'); }
}

console.log('\n== Lo que la app escribe de verdad ==');
await permite('movimiento válido', bueno(), 'v1');
await permite('con nota de texto', bueno({ nota: 'Dos litros de leche' }), 'v2');
await permite('sin el campo nota', (({nota, ...r}) => r)(bueno()), 'v3');
await permite('salida al lado caliente', bueno({ tipo:'salida', categoria:'fritos', lado:'caliente' }), 'v4');

console.log('\n== Lo que debe rechazar ==');
await rechaza('tipo inventado',        bueno({ tipo: 'robo' }), 'x1');
await rechaza('categoría inventada',   bueno({ categoria: 'dulces' }), 'x2');
await rechaza('lado inventado',        bueno({ lado: 'templado' }), 'x3');
await rechaza('nombre muy corto',      bueno({ nombre: 'A' }), 'x4');
await rechaza('documento muy corto',   bueno({ documento: '12' }), 'x5');
await rechaza('cantidad cero',         bueno({ cantidad: 0 }), 'x6');
await rechaza('cantidad desbordada',   bueno({ cantidad: 5000 }), 'x7');
await rechaza('cantidad como texto',   bueno({ cantidad: '3' }), 'x8');
await rechaza('campo de más',          bueno({ colado: 'basura' }), 'x9');
await rechaza('falta el tipo',         (({tipo, ...r}) => r)(bueno()), 'x10');
await rechaza('fecha puesta a mano',   bueno({ created_at: new Date(2020,0,1) }), 'x11');
await rechaza('nace ya eliminado',     bueno({ deleted_at: new Date() }), 'x12');
await rechaza('nota larguísima',       bueno({ nota: 'x'.repeat(300) }), 'x13');
try { await assertFails(setDoc(doc(db, 'otracosa', 'z'), { a: 1 })); ok('otra colección cerrada'); }
catch { mal('otra colección cerrada'); }

console.log('\n== Leer, actualizar y borrar ==');
try { await assertSucceeds(getDoc(doc(db, 'movimientos', 'v1'))); ok('cualquiera puede leer'); }
catch { mal('no deja leer'); }
try { await assertSucceeds(getDocs(collection(db, 'movimientos'))); ok('cualquiera puede listar'); }
catch { mal('no deja listar'); }
try { await assertSucceeds(updateDoc(doc(db,'movimientos','v1'), { deleted_at: new Date() })); ok('borrado suave permitido'); }
catch { mal('no deja marcar eliminado'); }
try { await assertFails(updateDoc(doc(db,'movimientos','v2'), { cantidad: 999 })); ok('no se puede alterar un registro'); }
catch { mal('deja alterar la cantidad'); }
try { await assertFails(updateDoc(doc(db,'movimientos','v2'), { nombre: 'Otro' })); ok('no se puede cambiar el nombre'); }
catch { mal('deja cambiar el nombre'); }
try { await assertFails(deleteDoc(doc(db,'movimientos','v2'))); ok('borrado definitivo bloqueado'); }
catch { mal('deja borrar de verdad'); }

await env.cleanup();
console.log('\n============================');
console.log(fallos.length ? `${fallos.length} FALLO(S)` : 'LAS REGLAS HACEN LO QUE DEBEN');
process.exit(fallos.length ? 1 : 0);
