/**
 * Apps configuration
 *
 * This file defines the apps available in the Back Office.
 * To add a new app:
 * 1. Add MONGODB_APP{N}_URI and MONGODB_APP{N}_NAME variables to .env
 * 2. Add the configuration here following the existing pattern
 */

const apps = {
  'banners-all-over': {
    id: 'banners-all-over',
    name: process.env.MONGODB_APP1_NAME || 'Banners All Over',
    mongoUri: process.env.MONGODB_APP1_URI,
    // Collections that this app exposes to the backoffice
    collections: ['email-templates', 'shops', 'banners', 'metricevents', 'metricsaggregates', 'feedbacks', 'logs', 'screenshots', 'sessions', 'support-messages', 'feature-flags', 'plans'],
    // App-specific permissions (optional)
    features: {
      canEditTemplates: true,
      canManageShops: true,
      canViewMetrics: true,
      canManageBanners: true,
    }
  },
  // Uncomment when you have the second app configured:
  // 'app2': {
  //   id: 'app2',
  //   name: process.env.MONGODB_APP2_NAME || 'App Two',
  //   mongoUri: process.env.MONGODB_APP2_URI,
  //   collections: ['email-templates', 'shops'],
  //   features: {
  //     canEditTemplates: true,
  //     canManageShops: true,
  //     canViewMetrics: true,
  //   }
  // },
  // Add more apps here following the same pattern
};

/**
 * Get all configured apps
 */
const getAllApps = () => {
  return Object.values(apps).map(app => ({
    id: app.id,
    name: app.name,
    features: app.features,
  }));
};

/**
 * Get configuration for a specific app
 */
const getAppConfig = (appId) => {
  const app = apps[appId];
  if (!app) {
    throw new Error(`App "${appId}" not found in configuration`);
  }
  return app;
};

/**
 * Validate that an app exists
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
