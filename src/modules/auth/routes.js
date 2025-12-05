const controller = require('./controller');
const { auth } = require('../../middleware/auth');
const { errorResponse, securityScheme } = require('../../shared/swagger-schemas');

/**
 * Auth Routes (Fastify Plugin)
 *
 * Prefijo: /api/auth
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function authRoutes(fastify, options) {
  // Rutas públicas
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login del equipo del Back Office',
      description: 'Autenticación de usuarios del equipo interno usando email y contraseña',
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
            token: { type: 'string', description: 'JWT token para autenticación' },
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
      summary: 'Refrescar token JWT',
      description: 'Genera un nuevo token JWT a partir de uno existente',
      security: securityScheme,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', description: 'Nuevo JWT token' },
            user: { type: 'object' }
          }
        },
        401: errorResponse
      }
    }
  }, controller.refresh);

  // Solo desarrollo
  fastify.post('/hash-password', {
    schema: {
      tags: ['Auth'],
      summary: '[DEV] Generar hash de password',
      description: 'Endpoint de desarrollo para generar hashes bcrypt de contraseñas',
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
            hash: { type: 'string', description: 'Hash bcrypt de la contraseña' }
          }
        }
      }
    }
  }, controller.hashPassword);

  // Rutas protegidas
  fastify.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Información del usuario actual',
      description: 'Obtiene la información del usuario autenticado',
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
