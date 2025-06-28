// Configuración de Firebase para Sistema de Votos 2025
const firebaseConfig = {
    // Configuración de ejemplo - Reemplazar con tu proyecto real
    apiKey: "AIzaSyBtuEjemplo123456789",
    authDomain: "sistema-votos-2025.firebaseapp.com",
    projectId: "sistema-votos-2025",
    storageBucket: "sistema-votos-2025.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a la base de datos
const db = firebase.firestore();
const votesCollection = db.collection('votes');
const ubchCollection = db.collection('ubchData');

// Exportar para uso en otros archivos
window.firebaseDB = {
    db,
    votesCollection,
    ubchCollection
}; 