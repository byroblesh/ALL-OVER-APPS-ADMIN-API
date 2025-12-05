const controller = require('./controller');
const { errorResponse, securityScheme, appIdParam, paginationQuery } = require('../../shared/swagger-schemas');

/**
 * Templates Routes (Fastify Plugin)
 *
 * Prefijo: /api/:appId/templates
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function templatesRoutes(fastify, options) {
  // Rutas especiales primero
  fastify.get('/categories', {
    schema: {
      tags: ['Templates'],
      summary: 'Categorías de templates',
      description: 'Obtiene todas las categorías de templates disponibles',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      }
    }
  }, controller.getCategories);

  // CRUD
  fastify.get('/', {
    schema: {
      tags: ['Templates'],
      summary: 'Lista de templates',
      description: 'Obtiene lista paginada de templates de email',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      querystring: {
        type: 'object',
        properties: {
          ...paginationQuery,
          shop: { type: 'string' },
          category: { type: 'string' },
          isActive: { type: 'boolean' },
          search: { type: 'string' }
        }
      }
    }
  }, controller.list);

  fastify.post('/', {
    schema: {
      tags: ['Templates'],
      summary: 'Crear template',
      description: 'Crea un nuevo template de email',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      },
      body: {
        type: 'object',
        required: ['shop', 'name', 'slug'],
        properties: {
          shop: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          subject: { type: 'string' },
          htmlContent: { type: 'string' },
          category: { type: 'string' }
        }
      }
    }
  }, controller.create);

  fastify.get('/:templateId', {
    schema: {
      tags: ['Templates'],
      summary: 'Obtener template por ID',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          templateId: { type: 'string' }
        }
      }
    }
  }, controller.getById);

  fastify.put('/:templateId', {
    schema: {
      tags: ['Templates'],
      summary: 'Actualizar template',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          templateId: { type: 'string' }
        }
      }
    }
  }, controller.update);

  fastify.delete('/:templateId', {
    schema: {
      tags: ['Templates'],
      summary: 'Eliminar template',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          templateId: { type: 'string' }
        }
      }
    }
  }, controller.remove);

  // Acciones especiales
  fastify.patch('/:templateId/toggle', {
    schema: {
      tags: ['Templates'],
      summary: 'Activar/Desactivar template',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          templateId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean' }
        }
      }
    }
  }, controller.toggleActive);

  fastify.post('/:templateId/duplicate', {
    schema: {
      tags: ['Templates'],
      summary: 'Duplicar template',
      security: securityScheme,
      params: {
        type: 'object',
        properties: {
          appId: appIdParam,
          templateId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Slug para el template duplicado' }
        }
      }
    }
  }, controller.duplicate);
}

module.exports = templatesRoutes;
