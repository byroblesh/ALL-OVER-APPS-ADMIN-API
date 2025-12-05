const controller = require('./controller');
const { errorResponse, securityScheme, appIdParam, paginationQuery } = require('../../shared/swagger-schemas');

/**
 * Users Routes (Fastify Plugin)
 *
 * All routes are prefixed with /api/:appId/users
 * and require authentication + app selection (hooks applied in routes/index.js)
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function usersRoutes(fastify, options) {
  // Stats and metadata routes (before :userId to avoid conflicts)
  fastify.get('/stats', {
    schema: {
      tags: ['Users'],
      summary: 'User statistics',
      description: 'Get aggregated user statistics for an app',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam
        }
      },
      querystring: {
        type: 'object',
        properties: {
          shop: { type: 'string', description: 'Filter by specific shop' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                active: { type: 'integer' },
                inactive: { type: 'integer' }
              }
            }
          }
        },
        401: errorResponse
      }
    }
  }, controller.getStats);

  fastify.get('/shops', {
    schema: {
      tags: ['Users'],
      summary: 'List of unique shops',
      description: 'Get all unique Shopify shops that have users',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        401: errorResponse
      }
    }
  }, controller.getShops);

  // User CRUD operations
  fastify.get('/', {
    schema: {
      tags: ['Users'],
      summary: 'List users',
      description: 'Get paginated list of users with filters',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam
        }
      },
      querystring: {
        type: 'object',
        properties: {
          ...paginationQuery,
          shop: { type: 'string', description: 'Filter by shop' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending', 'blocked'] },
          search: { type: 'string', description: 'Search by email or name' },
          sortBy: { type: 'string', default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        },
        401: errorResponse
      }
    }
  }, controller.list);

  fastify.get('/:userId', {
    schema: {
      tags: ['Users'],
      summary: 'Obtener usuario por ID',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          userId: { type: 'string', description: 'ID del usuario' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        },
        404: errorResponse
      }
    }
  }, controller.getById);

  fastify.patch('/:userId', {
    schema: {
      tags: ['Users'],
      summary: 'Actualizar usuario',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          userId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        404: errorResponse
      }
    }
  }, controller.update);

  fastify.patch('/:userId/status', {
    schema: {
      tags: ['Users'],
      summary: 'Cambiar estado del usuario',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          userId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending', 'blocked'],
            description: 'Nuevo estado del usuario'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        400: errorResponse,
        404: errorResponse
      }
    }
  }, controller.updateStatus);
}

module.exports = usersRoutes;
