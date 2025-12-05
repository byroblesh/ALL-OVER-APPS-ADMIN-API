const controller = require('./controller');
const { errorResponse, securityScheme, appIdParam, paginationQuery } = require('../../shared/swagger-schemas');

/**
 * Templates Routes (Fastify Plugin)
 *
 * Prefix: /api/:appId/templates
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function templatesRoutes(fastify, options) {
  // Special routes first
  fastify.get('/categories', {
    schema: {
      tags: ['Templates'],
      summary: 'Template categories',
      description: 'Get all available template categories',
      security: securityScheme,
      params: {
        type: 'object',
        properties: { appId: appIdParam }
      }
    }
  }, controller.getCategories);

  // CRUD operations
  fastify.get('/', {
    schema: {
      tags: ['Templates'],
      summary: 'List templates',
      description: 'Get paginated list of email templates',
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
      summary: 'Create template',
      description: 'Create a new email template',
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
      summary: 'Get template by ID',
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
      summary: 'Update template',
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
      summary: 'Delete template',
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

  // Special actions
  fastify.patch('/:templateId/toggle', {
    schema: {
      tags: ['Templates'],
      summary: 'Toggle template active status',
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
      summary: 'Duplicate template',
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
          slug: { type: 'string', description: 'Slug for the duplicated template' }
        }
      }
    }
  }, controller.duplicate);
}

module.exports = templatesRoutes;
