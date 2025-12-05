const controller = require('./controller');
const { auth } = require('../../middleware/auth');
const { errorResponse, securityScheme } = require('../../shared/swagger-schemas');

/**
 * Auth Routes (Fastify Plugin)
 *
 * Prefix: /api/auth
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function authRoutes(fastify, options) {
  // Public routes
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Back Office team login',
      description: 'Authentication for internal team users using email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@bannersallover.com' },
          password: { type: 'string', format: 'password', example: 'password123' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', description: 'JWT token for authentication' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', example: 'admin' }
              }
            }
          }
        },
        400: errorResponse,
        401: errorResponse
      }
    }
  }, controller.login);

  fastify.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh JWT token',
      description: 'Generate a new JWT token from an existing one',
      security: securityScheme,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', description: 'New JWT token' },
            user: { type: 'object' }
          }
        },
        401: errorResponse
      }
    }
  }, controller.refresh);

  // Development only
  fastify.post('/hash-password', {
    schema: {
      tags: ['Auth'],
      summary: '[DEV] Generate password hash',
      description: 'Development endpoint to generate bcrypt hashes for passwords',
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', example: 'mypassword123' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            hash: { type: 'string', description: 'Bcrypt hash of the password' }
          }
        }
      }
    }
  }, controller.hashPassword);

  // Protected routes
  fastify.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Current user information',
      description: 'Get authenticated user information',
      security: securityScheme,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        401: errorResponse
      }
    },
    onRequest: [auth]
  }, controller.me);
}

module.exports = authRoutes;
