/**
 * Swagger/OpenAPI Schemas compartidos
 */

// Respuestas comunes
const successResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' }
  }
};

const errorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: { type: 'string' }
  }
};

// Parámetros comunes
const appIdParam = {
  type: 'string',
  description: 'ID de la aplicación (ej: banners-all-over)',
  example: 'banners-all-over'
};

const paginationQuery = {
  page: { type: 'integer', minimum: 1, default: 1, description: 'Número de página' },
  limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Items por página' }
};

// Security
const securityScheme = [{ bearerAuth: [] }];

module.exports = {
  successResponse,
  errorResponse,
  appIdParam,
  paginationQuery,
  securityScheme
};
