const controller = require('./controller');
const { errorResponse, securityScheme, appIdParam } = require('../../shared/swagger-schemas');

/**
 * Metrics Routes (Fastify Plugin)
 *
 * Prefijo: /api/:appId/metrics
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function metricsRoutes(fastify, options) {
  fastify.get('/dashboard', {
    schema: {
      tags: ['Metrics'],
      summary: 'Dashboard general',
      description: 'Obtiene métricas agregadas para el dashboard principal',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        }
      }
    }
  }, controller.getDashboard);

  fastify.get('/users-over-time', {
    schema: {
      tags: ['Metrics'],
      summary: 'Usuarios en el tiempo',
      description: 'Obtiene estadísticas de usuarios registrados por día',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 30, description: 'Número de días a consultar' }
        }
      }
    }
  }, controller.getUsersOverTime);

  fastify.get('/top-shops', {
    schema: {
      tags: ['Metrics'],
      summary: 'Top tiendas',
      description: 'Obtiene las tiendas con más usuarios',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10, description: 'Número de tiendas a retornar' }
        }
      }
    }
  }, controller.getTopShops);

  fastify.get('/activity', {
    schema: {
      tags: ['Metrics'],
      summary: 'Actividad reciente',
      description: 'Obtiene la actividad reciente en la aplicación',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 }
        }
      }
    }
  }, controller.getRecentActivity);

  fastify.get('/custom', {
    schema: {
      tags: ['Metrics'],
      summary: 'Métricas personalizadas',
      description: 'Obtiene métricas almacenadas personalizadas con filtros',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Tipo de métrica' },
          shop: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          limit: { type: 'integer', default: 100 }
        }
      }
    }
  }, controller.getStoredMetrics);
}

module.exports = metricsRoutes;
