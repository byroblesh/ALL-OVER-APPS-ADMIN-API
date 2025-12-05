const { appExists, getAppConfig } = require('../config/apps.config');
const mongoConnector = require('../shared/mongoConnector');

/**
 * Hook: App Selector (Fastify)
 *
 * Extrae el appId del request (header o param) y:
 * 1. Valida que la app existe
 * 2. Establece la conexión a la DB correspondiente
 * 3. Adjunta la conexión y config al request
 *
 * Uso en rutas:
 * fastify.get('/:appId/users', { onRequest: [auth, appSelector] }, handler)
 */
const appSelector = async (request, reply) => {
  try {
    // El appId puede venir del header o como parámetro de ruta
    const appId = request.headers['x-app-id'] || request.params.appId;

    if (!appId) {
      return reply.status(400).send({
        success: false,
        error: 'App ID is required. Send it via X-App-Id header or :appId param',
      });
    }

    if (!appExists(appId)) {
      return reply.status(404).send({
        success: false,
        error: `App "${appId}" not found`,
      });
    }

    // Obtiene la conexión (lazy loading)
    const connection = await mongoConnector.getConnection(appId);
    const appConfig = getAppConfig(appId);

    // Adjunta al request para uso en controllers
    request.appId = appId;
    request.appConfig = appConfig;
    request.dbConnection = connection;

    // En Fastify no se usa next(), simplemente retorna sin valor
  } catch (error) {
    request.log.error('App selector error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to connect to app database',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Hook: Optional App Selector (Fastify)
 *
 * Similar a appSelector pero no falla si no hay appId.
 * Útil para rutas que pueden funcionar con o sin app específica.
 */
const optionalAppSelector = async (request, reply) => {
  const appId = request.headers['x-app-id'] || request.params.appId;

  if (!appId) {
    return; // Continúa sin error
  }

  return appSelector(request, reply);
};

module.exports = {
  appSelector,
  optionalAppSelector,
};
