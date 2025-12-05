const controller = require('./controller');
const { errorResponse, securityScheme, appIdParam } = require('../../shared/swagger-schemas');

/**
 * Metrics Routes (Fastify Plugin)
 *
 * Prefix: /api/:appId/metrics
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function metricsRoutes(fastify, options) {
  fastify.get('/dashboard', {
    schema: {
      tags: ['Metrics'],
      summary: 'General dashboard',
      description: 'Get aggregated metrics for main dashboard',
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
      summary: 'Users over time',
      description: 'Get statistics of registered users per day',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 30, description: 'Number of days to query' }
        }
      }
    }
  }, controller.getUsersOverTime);

  fastify.get('/top-shops', {
    schema: {
      tags: ['Metrics'],
      summary: 'Top shops',
      description: 'Get shops with most users',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10, description: 'Number of shops to return' }
        }
      }
    }
  }, controller.getTopShops);

  fastify.get('/activity', {
    schema: {
      tags: ['Metrics'],
      summary: 'Recent activity',
      description: 'Get recent activity in the application',
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
      summary: 'Custom metrics',
      description: 'Get stored custom metrics with filters',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Metric type' },
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
