/**
 * Shared Swagger/OpenAPI Schemas
 */

// Common responses
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

// Common parameters
const appIdParam = {
  type: 'string',
  description: 'Application ID (e.g.: banners-all-over)',
  example: 'banners-all-over'
};

const paginationQuery = {
  page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
  limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Items per page' }
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
