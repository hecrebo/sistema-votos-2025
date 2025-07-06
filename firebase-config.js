// Configuración de Firebase
// IMPORTANTE: Estas credenciales deben ser gestionadas de forma segura,
// preferiblemente a través de variables de entorno o un servicio de configuración.
// NO DEBEN estar hardcodeadas en el código fuente en un repositorio público.

// Intenta cargar desde variables de entorno (simulado para el navegador)
// En un entorno Node.js o durante un proceso de build, usarías process.env
// Para el navegador, esto es una SIMULACIÓN. El usuario deberá reemplazar estos
// placeholders con su configuración real o implementar un sistema seguro.
const firebaseConfig = {
    apiKey: window.FIREBASE_API_KEY || "TU_API_KEY_REAL_AQUI_O_USA_VARIABLES_DE_ENTORNO",
    authDomain: window.FIREBASE_AUTH_DOMAIN || "tu-proyecto-id.firebaseapp.com",
    projectId: window.FIREBASE_PROJECT_ID || "tu-proyecto-id",
    storageBucket: window.FIREBASE_STORAGE_BUCKET || "tu-proyecto-id.appspot.com",
    messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "tu-sender-id",
    appId: window.FIREBASE_APP_ID || "tu-app-id",
    measurementId: window.FIREBASE_MEASUREMENT_ID || "tu-measurement-id" // Opcional, para Analytics
};

// Verificar si la configuración es válida (simplificado)
if (firebaseConfig.apiKey === "TU_API_KEY_REAL_AQUI_O_USA_VARIABLES_DE_ENTORNO" || !firebaseConfig.projectId.includes("tu-proyecto-id") === false) {
    console.warn("⚠️ CONFIGURACIÓN DE FIREBASE INCOMPLETA O DE EJEMPLO. Reemplaza los placeholders en firebase-config.js o configura variables de entorno.");
    // Podrías deshabilitar Firebase aquí o mostrar un mensaje al usuario
    // Por ahora, permitiremos que intente inicializar para no romper el flujo si el usuario ya lo configuró.
}

// Inicializar Firebase
try {
    if (firebase.apps.length === 0) { // Evitar re-inicialización
        firebase.initializeApp(firebaseConfig);
        console.log("🔥 Firebase inicializado correctamente.");
    } else {
        console.log("🔥 Firebase ya está inicializado.");
    }
} catch (error) {
    console.error("❌ Error al inicializar Firebase:", error);
    console.error("   Asegúrate de que la configuración en firebase-config.js sea correcta y que las librerías de Firebase estén cargadas.");
    // Aquí podrías implementar un fallback a modo local si la inicialización falla.
}

// Referencias a la base de datos
const db = firebase.firestore();
const votesCollection = db.collection('votes');
const ubchCollection = db.collection('ubchData');

// Configuración UBCH por defecto
const defaultUBCHConfig = {
    "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO 4A ETAPA", "LA CAMACHERA"],
    "LICEO JOSE FELIX RIBAS": ["EL CUJIJAL", "LAS FLORES", "LAS ESPERANZA 200", "VILLAS DEL CENTRO 2ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CAIPARICALLY I II", "EL BANCO", "CAIPARICHA I Y II"],
    "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUADALUPE", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRA DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ADJUNTADA", "BUCARES", "GUAYABAL", "APARTATE", "EL REFUGIO", "LOS ROBLES", "ARAUCARIA"],
    "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "LA PRIMAVERA"],
    "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO"],
    "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MATWINAS", "BRISAS DEL LAGO", "MANDANTO", "INDIANAPOLIS", "SUR DE ACOSTA"],
    "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "BARRIO SOLIDARIO", "COMUNIDAD FUTURO"],
    "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE"],
    "CASA COMUNAL": ["LOS JABILLOS"],
    "UNIDAD EDUCATIVA MONSEÑOR JACINTO SOTO LAYERA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II"],
    "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["24 DE ENERO", "19 DE ABRIL", "EL PROGRESO"],
    "ESCUELA ESTADAL ALEJO ZULOAGA": ["MAIQUETIA", "SAENZ", "PANAMERICANO"],
    "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMEDIOS"],
    "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE"],
    "ESCUELA RECEPTORIA": ["CARMEN CENTRO"],
    "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN"],
    "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENECIANOS"],
    "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA HACIENDA"],
    "ESCUELA GRADUADA PEDRO GUAL": ["INDIANOS NORTE"]
};

// Función para inicializar configuración UBCH en Firebase
async function initializeUBCHConfig() {
    try {
        const configDoc = await ubchCollection.doc('config').get();
        if (!configDoc.exists) {
            console.log('🔧 Inicializando configuración UBCH en Firebase...');
            await ubchCollection.doc('config').set({
                mapping: defaultUBCHConfig,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                version: '1.0'
            });
            console.log('✅ Configuración UBCH inicializada en Firebase');
        } else {
            console.log('✅ Configuración UBCH ya existe en Firebase');
        }
    } catch (error) {
        console.error('❌ Error inicializando configuración UBCH:', error);
    }
}

// Exportar para uso en otros archivos
window.firebaseDB = {
    db,
    votesCollection,
    ubchCollection,
    defaultUBCHConfig,
    initializeUBCHConfig
};

// Inicializar configuración UBCH al cargar
document.addEventListener('DOMContentLoaded', () => {
    initializeUBCHConfig();
}); 