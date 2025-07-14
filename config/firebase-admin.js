// Firebase Admin SDK Configuration
// Este archivo es para uso del lado del servidor (Node.js)
// NO usar en el navegador

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://sistema-votos-2025.firebaseio.com`
    });
}

const db = admin.firestore();

module.exports = {
    admin,
    db
}; 