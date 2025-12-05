/**
 * Configuración de aplicaciones
 * 
 * Este archivo define las apps disponibles en el Back Office.
 * Para agregar una nueva app:
 * 1. Añade las variables MONGODB_APP{N}_URI y MONGODB_APP{N}_NAME en .env
 * 2. Añade la configuración aquí siguiendo el patrón existente
 */

const apps = {
  'banners-all-over': {
    id: 'banners-all-over',
    name: process.env.MONGODB_APP1_NAME || 'Banners All Over',
    mongoUri: process.env.MONGODB_APP1_URI,
    // Colecciones que esta app expone al backoffice
    collections: ['users', 'templates', 'orders', 'settings', 'shops', 'banners'],
    // Permisos específicos de la app (opcional)
    features: {
      canEditTemplates: true,
      canEditUsers: true,
      canViewMetrics: true,
      canManageBanners: true,
    }
  },
  // Descomentado cuando tengas la segunda app configurada:
  // 'app2': {
  //   id: 'app2',
  //   name: process.env.MONGODB_APP2_NAME || 'App Two',
  //   mongoUri: process.env.MONGODB_APP2_URI,
  //   collections: ['users', 'templates', 'orders', 'settings'],
  //   features: {
  //     canEditTemplates: true,
  //     canEditUsers: true,
  //     canViewMetrics: true,
  //   }
  // },
  // Añade más apps aquí siguiendo el mismo patrón
};

/**
 * Obtiene todas las apps configuradas
 */
const getAllApps = () => {
  return Object.values(apps).map(app => ({
    id: app.id,
    name: app.name,
    features: app.features,
  }));
};

/**
 * Obtiene la configuración de una app específica
 */
const getAppConfig = (appId) => {
  const app = apps[appId];
  if (!app) {
    throw new Error(`App "${appId}" not found in configuration`);
  }
  return app;
};

/**
 * Valida que una app existe
 */
const appExists = (appId) => {
  return !!apps[appId];
};

module.exports = {
  apps,
  getAllApps,
  getAppConfig,
  appExists,
};
