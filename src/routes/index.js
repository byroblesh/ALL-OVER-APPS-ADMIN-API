const { auth } = require('../middleware/auth');
const { appSelector } = require('../middleware/appSelector');
const { errorResponse, securityScheme } = require('../shared/swagger-schemas');

// Module routes
const authRoutes = require('../modules/auth/routes');
const usersRoutes = require('../modules/users/routes');
const templatesRoutes = require('../modules/templates/routes');
const metricsRoutes = require('../modules/metrics/routes');
const aggregateMetricsRoutes = require('../modules/metrics/aggregate-routes');

// Config
const { getAllApps } = require('../config/apps.config');
const mongoConnector = require('../shared/mongoConnector');

/**
 * Main routes plugin (Fastify)
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
      summary: 'Server health check',
      description: 'Check server status and database connections',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            databases: {
              type: 'object',
              properties: {
                connected: { type: 'integer', description: 'Number of connected DBs' },
                total: { type: 'integer', description: 'Total number of configured DBs' },
                failed: { type: 'integer', description: 'Number of failed DBs' }
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
   * Auth (no protection)
   */
  await fastify.register(authRoutes, { prefix: '/auth' });

  /**
   * List of available apps (protected)
   */
  fastify.get('/apps', {
    schema: {
      tags: ['Apps'],
      summary: 'List of available applications',
      description: 'Get the list of all Shopify applications configured in the Back Office',
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
   * Aggregated metrics (all apps)
   *
   * These routes query ALL applications at once:
   * - Require authentication (auth hook)
   * - Do NOT require appId (work with all apps)
   *
   * Prefix: /api/metrics/aggregate
   */
  await fastify.register(async (fastify) => {
    fastify.addHook('onRequest', auth);
    await fastify.register(aggregateMetricsRoutes, { prefix: '/metrics/aggregate' });
  });

  /**
   * App-specific routes
   *
   * All these routes:
   * 1. Require authentication (auth hook)
   * 2. Require app selection (appSelector hook)
   *
   * The appId is passed as a route parameter: /api/:appId/...
   */
  await fastify.register(async (fastify) => {
    // Apply hooks to all routes in this scope
    fastify.addHook('onRequest', auth);
    fastify.addHook('onRequest', appSelector);

    await fastify.register(usersRoutes, { prefix: '/:appId/users' });
    await fastify.register(templatesRoutes, { prefix: '/:appId/templates' });
    await fastify.register(metricsRoutes, { prefix: '/:appId/metrics' });
  });

  /**
   * 404 for API routes not found
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
