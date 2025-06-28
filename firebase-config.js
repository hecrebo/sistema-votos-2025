// Configuración de Firebase para Sistema de Votos 2025
const firebaseConfig = {
    apiKey: "AIzaSyAtgIwPlrxpsrVNWIIG8i2fVle-DhX0suY",
    authDomain: "sistema-votos-2025.firebaseapp.com",
    projectId: "sistema-votos-2025",
    storageBucket: "sistema-votos-2025.firebasestorage.app",
    messagingSenderId: "136821740270",
    appId: "1:136821740270:web:a503de06b4cc28af3899ff"
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