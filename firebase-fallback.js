/**
 * Sistema de Fallback para Firebase - Sistema de Votos 2025
 * Permite que el sistema funcione completamente sin Firebase
 */

class FirebaseFallback {
    constructor() {
        this.isFirebaseAvailable = false;
        this.fallbackMode = false;
        this.localData = {
            votes: [],
            ubchConfig: {},
            userData: null
        };
        
        this.init();
    }

    init() {
        console.log('🔄 Inicializando sistema de fallback...');
        
        // Verificar si Firebase está realmente disponible
        this.checkFirebaseAvailability();
        
        // Configurar fallback si es necesario
        if (!this.isFirebaseAvailable) {
            this.setupFallback();
        }
        
        // Cargar datos locales
        this.loadLocalData();
    }

    checkFirebaseAvailability() {
        try {
            // Verificar si Firebase está configurado
            if (window.firebaseDB && window.firebaseDB.isAvailable) {
                this.isFirebaseAvailable = true;
                console.log('✅ Firebase disponible');
                return true;
            }
            
            // Verificar si hay configuración de Firebase
            if (window.firebaseConfig && window.firebaseConfig.apiKey !== "TU_API_KEY_AQUI") {
                this.isFirebaseAvailable = true;
                console.log('✅ Firebase configurado');
                return true;
            }
            
            // Firebase no disponible
            this.isFirebaseAvailable = false;
            this.fallbackMode = true;
            console.log('⚠️ Firebase no disponible - Activando modo fallback');
            return false;
            
        } catch (error) {
            console.error('❌ Error verificando Firebase:', error);
            this.isFirebaseAvailable = false;
            this.fallbackMode = true;
            return false;
        }
    }

    setupFallback() {
        console.log('🛡️ Configurando modo fallback...');
        
        // Crear objetos mock para Firebase
        this.createFirebaseMocks();
        
        // Configurar sistema de votación con fallback
        this.setupVotingSystemFallback();
        
        // Configurar notificaciones de fallback
        this.setupNotificationFallback();
        
        console.log('✅ Modo fallback configurado correctamente');
    }

    createFirebaseMocks() {
        // Mock de firebaseDB
        window.firebaseDB = {
            isAvailable: false,
            db: null,
            votesCollection: {
                add: async (data) => {
                    const id = 'local_' + Date.now() + '_' + Math.random();
                    const voteData = { id, ...data, isLocal: true, createdAt: new Date().toISOString() };
                    this.localData.votes.push(voteData);
                    this.saveLocalData();
                    console.log('💾 Voto guardado localmente:', voteData);
                    return { id };
                },
                get: async () => {
                    return {
                        docs: this.localData.votes.map(vote => ({
                            id: vote.id,
                            data: () => vote
                        }))
                    };
                },
                where: (field, operator, value) => ({
                    get: async () => {
                        const filteredVotes = this.localData.votes.filter(vote => {
                            if (operator === '==') {
                                return vote[field] === value;
                            }
                            return true;
                        });
                        return {
                            docs: filteredVotes.map(vote => ({
                                id: vote.id,
                                data: () => vote
                            }))
                        };
                    }
                }),
                limit: (num) => ({
                    get: async () => {
                        const limitedVotes = this.localData.votes.slice(0, num);
                        return {
                            docs: limitedVotes.map(vote => ({
                                id: vote.id,
                                data: () => vote
                            }))
                        };
                    }
                }),
                onSnapshot: (callback) => {
                    // Simular listener en tiempo real
                    console.log('📡 Listener local configurado');
                    return () => console.log('📡 Listener local removido');
                }
            },
            ubchCollection: {
                doc: (id) => ({
                    get: async () => {
                        return {
                            exists: false,
                            data: () => this.localData.ubchConfig
                        };
                    },
                    set: async (data) => {
                        this.localData.ubchConfig = data;
                        this.saveLocalData();
                        console.log('💾 Configuración UBCH guardada localmente');
                    }
                })
            },
            defaultUBCHConfig: {
                "COLEGIO ASUNCION BELTRAN": ["EL VALLE", "VILLA OASIS", "VILLAS DEL CENTRO 3ERA ETAPA B", "VILLAS DEL CENTRO 3ERA ETAPA C", "VILLAS DEL CENTRO 4A ETAPA", "LA CAMACHERA"],
                "LICEO JOSE FELIX RIBAS": ["EL CUJIJAL", "LAS FLORES", "LAS ESPERANZA 200", "VILLAS DEL CENTRO 2ERA ETAPA A", "LOS PALOMARES", "EL LAGO", "CAIPARICALLY I II", "EL BANCO", "CAIPARICHA I Y II"],
                "ESCUELA PRIMARIA BOLIVARIANA LA PRADERA": ["EL SAMAN", "GUADALUPE", "PALOS GRANDES II", "PALOS GRANDES I", "TIERRA DEL SOL", "LA CASTELLANA", "GARDENIAS I", "GARDENIAS II", "EL CERCADITO", "ALTAMIRA", "LA ADJUNTADA", "BUCARES", "GUAYABAL", "APARTATE", "EL REFUGIO", "LOS ROBLES", "ARAUCARIA"],
                "CASA COMUNAL JOSE TOMAS GALLARDO": ["JOSE TOMAS GALLARDO A", "LA PRIMAVERA"],
                "ESCUELA 5 DE JULIO": ["10 DE AGOSTO", "CAMPO ALEGRE I", "CAMPO ALEGRE II", "5 DE JULIO"],
                "ESCUELA CECILIO ACOSTA": ["VOLUNTAD DE DIOS", "LAS MATWINAS", "BRISAS DEL LAGO", "MANDANTO", "INDIANAPOLIS", "SUR DE ACOSTA"],
                "ESCUELA BASICA FE Y ALEGRIA": ["FE Y ALEGRIA", "BARRIO SOLIDARIO", "COMUNIDAD FUTURO"],
                "ESCUELA GRADUADA ANTONIO JOSE DE SUCRE": ["JESUS DE NAZARETH", "SECTOR BOLIVAR", "PALO NEGRO ESTE"],
                "CASA COMUNAL": ["LOS JABILLOS"],
                "UNIDAD EDUCATIVA MONSEÑOR JOSÉ JACINTO SOTO LAYA": ["PROLONGACION MIRANDA", "SANTA EDUVIGES II"],
                "BASE DE MISIONES LUISA CACERES DE ARISMENDI": ["24 DE ENERO", "19 DE ABRIL", "EL PROGRESO"],
                "ESCUELA ESTADAL ALEJO ZULOAGA": ["MAIQUETIA", "SAENZ", "PANAMERICANO"],
                "UNIDAD EDUCATIVA MONSEÑOR MONTES DE OCA": ["REMEDIOS"],
                "ESCUELA BASICA NACIONAL CONCENTRADA LA ESTACION": ["18 DE OCTUBRE"],
                "ESCUELA RECEPTORIA": ["CARMEN CENTRO"],
                "GRUPO ESCOLAR DR RAFAEL PEREZ": ["VIRGEN DEL CARMEN"],
                "LICEO ALFREDO PIETRI": ["LOS OJITOS", "LOS VENECIANOS"],
                "ESCUELA BOLIVARIANA ROMERO GARCIA": ["SAN BERNARDO", "LA HACIENDA"],
                "ESCUELA GRADUADA PEDRO GUAL": ["INDIANOS NORTE"]
            },
            initializeUBCHConfig: async () => {
                console.log('🔧 Inicializando configuración UBCH local');
                return true;
            }
        };
        
        console.log('✅ Objetos mock de Firebase creados');
    }

    setupVotingSystemFallback() {
        // Asegurar que el sistema de votación funcione sin Firebase
        if (window.votingSystem) {
            // Agregar métodos de fallback si no existen
            if (!window.votingSystem.loadDataLocally) {
                window.votingSystem.loadDataLocally = () => {
                    console.log('📥 Cargando datos localmente...');
                    window.votingSystem.votes = this.localData.votes;
                    console.log(`✅ ${window.votingSystem.votes.length} registros cargados localmente`);
                };
            }
            
            if (!window.votingSystem.saveVoteLocally) {
                window.votingSystem.saveVoteLocally = (voteData) => {
                    const id = 'local_' + Date.now() + '_' + Math.random();
                    const localVote = {
                        id,
                        ...voteData,
                        isLocal: true,
                        createdAt: new Date().toISOString(),
                        synced: false
                    };
                    
                    this.localData.votes.push(localVote);
                    this.saveLocalData();
                    
                    console.log('💾 Voto guardado localmente:', localVote);
                    return id;
                };
            }
            
            console.log('✅ Sistema de votación configurado para modo fallback');
        }
    }

    setupNotificationFallback() {
        // Configurar notificaciones para modo fallback
        if (window.notificationSystem) {
            window.notificationSystem.show('Sistema funcionando en modo local', 'info', true, 3000);
        }
        
        console.log('✅ Notificaciones configuradas para modo fallback');
    }

    loadLocalData() {
        try {
            // Cargar votos locales
            const localVotes = localStorage.getItem('localVotes');
            if (localVotes) {
                this.localData.votes = JSON.parse(localVotes);
                console.log(`📥 ${this.localData.votes.length} votos cargados desde localStorage`);
            }
            
            // Cargar configuración UBCH local
            const localUBCH = localStorage.getItem('localUBCHConfig');
            if (localUBCH) {
                this.localData.ubchConfig = JSON.parse(localUBCH);
                console.log('📥 Configuración UBCH cargada desde localStorage');
            }
            
            // Cargar datos de usuario
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                this.localData.userData = JSON.parse(userData);
                console.log('📥 Datos de usuario cargados');
            }
            
        } catch (error) {
            console.error('❌ Error cargando datos locales:', error);
        }
    }

    saveLocalData() {
        try {
            localStorage.setItem('localVotes', JSON.stringify(this.localData.votes));
            localStorage.setItem('localUBCHConfig', JSON.stringify(this.localData.ubchConfig));
            console.log('💾 Datos guardados en localStorage');
        } catch (error) {
            console.error('❌ Error guardando datos locales:', error);
        }
    }

    // Métodos públicos
    isInFallbackMode() {
        return this.fallbackMode;
    }

    getLocalData() {
        return this.localData;
    }

    getVotesCount() {
        return this.localData.votes.length;
    }

    addVote(voteData) {
        return this.localData.votesCollection.add(voteData);
    }

    getVotes() {
        return this.localData.votes;
    }

    // Método para migrar datos cuando Firebase esté disponible
    async migrateToFirebase() {
        if (!this.isFirebaseAvailable || this.localData.votes.length === 0) {
            return;
        }
        
        console.log('🔄 Migrando datos locales a Firebase...');
        
        try {
            for (const vote of this.localData.votes) {
                if (!vote.synced) {
                    await window.firebaseDB.votesCollection.add(vote);
                    vote.synced = true;
                }
            }
            
            this.saveLocalData();
            console.log('✅ Migración completada');
            
        } catch (error) {
            console.error('❌ Error en migración:', error);
        }
    }
}

// Crear instancia global
window.firebaseFallback = new FirebaseFallback();

// Funciones globales para compatibilidad
window.isFirebaseAvailable = () => {
    return window.firebaseFallback && !window.firebaseFallback.isInFallbackMode();
};

window.getLocalVotesCount = () => {
    return window.firebaseFallback ? window.firebaseFallback.getVotesCount() : 0;
};

window.migrateToFirebase = () => {
    return window.firebaseFallback ? window.firebaseFallback.migrateToFirebase() : Promise.resolve();
};

console.log('🛡️ Sistema de fallback para Firebase cargado'); 