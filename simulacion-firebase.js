// Simulación de 50 registros simultáneos en Firebase
// Requiere: npm install firebase-admin

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Ruta al archivo de credenciales de servicio (descargar desde Firebase Console)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const collection = db.collection('votes'); // Cambia el nombre si tu colección es diferente

function generarRegistroTest(i) {
  return {
    name: `TEST_Usuario_${i}`,
    cedula: `${10000000 + i}`,
    telefono: `0412${Math.floor(1000000 + Math.random() * 8999999)}`,
    sexo: i % 2 === 0 ? 'M' : 'F',
    edad: 18 + (i % 50),
    ubch: `UBCH TEST ${i % 5}`,
    community: `Comunidad TEST ${i % 10}`,
    voted: false,
    registeredBy: 'simulador',
    registeredAt: new Date().toISOString(),
    id: uuidv4()
  };
}

async function simularRegistros() {
  const promesas = [];
  for (let i = 1; i <= 50; i++) {
    const registro = generarRegistroTest(i);
    promesas.push(collection.add(registro));
  }
  const resultados = await Promise.allSettled(promesas);
  const exitos = resultados.filter(r => r.status === 'fulfilled').length;
  const errores = resultados.filter(r => r.status === 'rejected').length;
  console.log(`Simulación completada: ${exitos} éxitos, ${errores} errores.`);
  if (errores > 0) {
    resultados.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.log(`Error en registro ${idx + 1}:`, r.reason);
      }
    });
  }
  process.exit(0);
}

simularRegistros(); 