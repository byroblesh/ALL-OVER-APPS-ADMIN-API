const mongoose = require('mongoose');
const { apps } = require('../config/apps.config');

/**
 * MultiDbConnector
 * 
 * Gestiona múltiples conexiones a diferentes bases de datos MongoDB.
 * Implementa un patrón singleton con lazy loading de conexiones.
 */
class MultiDbConnector {
  constructor() {
    this.connections = new Map();
    this.models = new Map();
  }

  /**
   * Obtiene o crea una conexión para una app específica
   */
  async getConnection(appId) {
    // Retorna conexión existente si ya está establecida
    if (this.connections.has(appId)) {
      const conn = this.connections.get(appId);
      if (conn.readyState === 1) { // Connected
        return conn;
      }
    }

    const appConfig = apps[appId];
    if (!appConfig) {
      throw new Error(`App "${appId}" not found in configuration`);
    }

    if (!appConfig.mongoUri) {
      throw new Error(`MongoDB URI not configured for app "${appId}"`);
    }

    try {
      console.log(`🔌 Connecting to MongoDB for ${appConfig.name}...`);
      
      const conn = await mongoose.createConnection(appConfig.mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      conn.on('error', (err) => {
        console.error(`❌ MongoDB error for ${appConfig.name}:`, err);
      });

      conn.on('disconnected', () => {
        console.warn(`⚠️ MongoDB disconnected for ${appConfig.name}`);
        this.connections.delete(appId);
      });

      this.connections.set(appId, conn);
      console.log(`✅ Connected to MongoDB for ${appConfig.name}`);
      
      return conn;
    } catch (error) {
      console.error(`❌ Failed to connect to MongoDB for ${appConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un modelo para una app específica
   * Usa cache para evitar recrear modelos
   */
  getModel(appId, modelName, schema) {
    const cacheKey = `${appId}:${modelName}`;
    
    if (this.models.has(cacheKey)) {
      return this.models.get(cacheKey);
    }

    const conn = this.connections.get(appId);
    if (!conn) {
      throw new Error(`No connection established for app "${appId}". Call getConnection first.`);
    }

    // Evita recrear el modelo si ya existe en la conexión
    const model = conn.models[modelName] || conn.model(modelName, schema);
    this.models.set(cacheKey, model);
    
    return model;
  }

  /**
   * Inicializa conexiones para todas las apps configuradas
   */
  async initializeAll() {
    const appIds = Object.keys(apps);
    const results = await Promise.allSettled(
      appIds.map(appId => this.getConnection(appId))
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} app(s) failed to connect`);
    }

    return {
      total: appIds.length,
      connected: results.filter(r => r.status === 'fulfilled').length,
      failed: failed.length,
    };
  }

  /**
   * Cierra todas las conexiones
   */
  async closeAll() {
    const promises = [];
    for (const [appId, conn] of this.connections) {
      console.log(`Closing connection for ${appId}...`);
      promises.push(conn.close());
    }
    await Promise.all(promises);
    this.connections.clear();
    this.models.clear();
    console.log('All connections closed');
  }

  /**
   * Verifica el estado de salud de todas las conexiones
   */
  getHealthStatus() {
    const status = {};
    for (const [appId, conn] of this.connections) {
      status[appId] = {
        readyState: conn.readyState,
        status: this.getReadyStateLabel(conn.readyState),
      };
    }
    return status;
  }

  getReadyStateLabel(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }
}

// Exporta instancia singleton
module.exports = new MultiDbConnector();
