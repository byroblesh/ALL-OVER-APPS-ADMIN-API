const { auth } = require('../middleware/auth');
const { appSelector } = require('../middleware/appSelector');
const { errorResponse, securityScheme } = require('../shared/swagger-schemas');

// Rutas de módulos
const authRoutes = require('../modules/auth/routes');
const usersRoutes = require('../modules/users/routes');
const templatesRoutes = require('../modules/templates/routes');
const metricsRoutes = require('../modules/metrics/routes');
const aggregateMetricsRoutes = require('../modules/metrics/aggregate-routes');

// Config
const { getAllApps } = require('../config/apps.config');
const mongoConnector = require('../shared/mongoConnector');

/**
 * Plugin de rutas principales (Fastify)
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function routes(fastify, options) {
  /**
   * Health check
   */
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check del servidor',
      description: 'Verifica el estado del servidor y las conexiones a bases de datos',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            databases: {
              type: 'object',
              properties: {
                connected: { type: 'integer', description: 'Número de DBs conectadas' },
                total: { type: 'integer', description: 'Número total de DBs configuradas' },
                failed: { type: 'integer', description: 'Número de DBs con error' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const dbStatus = mongoConnector.getHealthStatus();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      databases: dbStatus,
    };
  });

  /**
   * Auth (sin protección)
   */
  await fastify.register(authRoutes, { prefix: '/auth' });

  /**
   * Lista de apps disponibles (protegido)
   */
  fastify.get('/apps', {
    schema: {
      tags: ['Apps'],
      summary: 'Lista de aplicaciones disponibles',
      description: 'Obtiene la lista de todas las aplicaciones Shopify configuradas en el Back Office',
      security: securityScheme,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'banners-all-over' },
                  name: { type: 'string', example: 'Banners All Over' },
                  features: {
                    type: 'object',
                    properties: {
                      canEditTemplates: { type: 'boolean' },
                      canEditUsers: { type: 'boolean' },
                      canViewMetrics: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        },
        401: errorResponse
      }
    },
    onRequest: [auth]
  }, async (request, reply) => {
    const apps = getAllApps();
    return {
      success: true,
      data: apps,
    };
  });

  /**
   * Métricas agregadas (todas las apps)
   *
   * Estas rutas consultan TODAS las aplicaciones a la vez:
   * - Requieren autenticación (auth hook)
   * - NO requieren appId (trabajan con todas las apps)
   *
   * Prefijo: /api/metrics/aggregate
   */
  await fastify.register(async (fastify) => {
    fastify.addHook('onRequest', auth);
    await fastify.register(aggregateMetricsRoutes, { prefix: '/metrics/aggregate' });
  });

  /**
   * Rutas específicas por app
   *
   * Todas estas rutas:
   * 1. Requieren autenticación (auth hook)
   * 2. Requieren selección de app (appSelector hook)
   *
   * El appId se pasa como parámetro de ruta: /api/:appId/...
   */
  await fastify.register(async (fastify) => {
    // Aplica los hooks a todas las rutas de este scope
    fastify.addHook('onRequest', auth);
    fastify.addHook('onRequest', appSelector);

    await fastify.register(usersRoutes, { prefix: '/:appId/users' });
    await fastify.register(templatesRoutes, { prefix: '/:appId/templates' });
    await fastify.register(metricsRoutes, { prefix: '/:appId/metrics' });
  });

  /**
   * 404 para rutas de API no encontradas
   */
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: 'API endpoint not found',
      path: request.url,
    });
  });
}

module.exports = routes;
