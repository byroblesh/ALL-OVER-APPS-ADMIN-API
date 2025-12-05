const aggregateController = require('./aggregate-controller');
const { errorResponse, securityScheme } = require('../../shared/swagger-schemas');

/**
 * Aggregate Metrics Routes (Fastify Plugin)
 *
 * Prefijo: /api/metrics/aggregate
 *
 * Endpoints que agregan datos de TODAS las aplicaciones.
 * No requieren appId - consultan todas las apps configuradas.
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function aggregateMetricsRoutes(fastify, options) {
  fastify.get('/dashboard', {
    schema: {
      tags: ['Metrics'],
      summary: 'Dashboard agregado de todas las apps',
      description: 'Obtiene métricas combinadas de todas las aplicaciones configuradas',
      security: securityScheme,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                aggregate: {
                  type: 'object',
                  description: 'Totales agregados de todas las apps',
                  properties: {
                    users: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 1500 },
                        active: { type: 'integer', example: 1200 },
                        newToday: { type: 'integer', example: 5 },
                        newThisWeek: { type: 'integer', example: 42 },
                        newThisMonth: { type: 'integer', example: 180 },
                        byStatus: { type: 'object' }
                      }
                    },
                    shops: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 300 },
                        active: { type: 'integer', example: 250 }
                      }
                    }
                  }
                },
                byApp: {
                  type: 'array',
                  description: 'Dashboard individual de cada app',
                  items: { type: 'object' }
                }
              }
            }
          }
        },
        500: errorResponse
      }
    }
  }, aggregateController.getAggregateDashboard);

  fastify.get('/users-over-time', {
    schema: {
      tags: ['Metrics'],
      summary: 'Usuarios en el tiempo (todas las apps)',
      description: 'Obtiene estadísticas de usuarios registrados por día, agregadas de todas las aplicaciones',
      security: securityScheme,
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 30, description: 'Número de días a consultar' }
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
                aggregate: {
                  type: 'array',
                  description: 'Datos agregados por fecha',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', example: '2024-01-15' },
                      total: { type: 'integer', example: 25 },
                      byApp: { type: 'object' }
                    }
                  }
                },
                byApp: {
                  type: 'array',
                  description: 'Datos individuales de cada app',
                  items: { type: 'object' }
                }
              }
            }
          }
        },
        500: errorResponse
      }
    }
  }, aggregateController.getAggregateUsersOverTime);

  fastify.get('/top-shops', {
    schema: {
      tags: ['Metrics'],
      summary: 'Top shops (todas las apps)',
      description: 'Obtiene las tiendas con más usuarios, agregando datos de todas las aplicaciones. Si una tienda está en múltiples apps, se suman sus usuarios.',
      security: securityScheme,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10, description: 'Número de tiendas a retornar' }
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
                aggregate: {
                  type: 'array',
                  description: 'Top shops agregados',
                  items: {
                    type: 'object',
                    properties: {
                      shop: { type: 'string', example: 'my-store.myshopify.com' },
                      totalUsers: { type: 'integer', example: 150 },
                      totalActiveUsers: { type: 'integer', example: 120 },
                      byApp: { type: 'object' }
                    }
                  }
                },
                byApp: {
                  type: 'array',
                  description: 'Top shops por app',
                  items: { type: 'object' }
                }
              }
            }
          }
        },
        500: errorResponse
      }
    }
  }, aggregateController.getAggregateTopShops);

  fastify.get('/activity', {
    schema: {
      tags: ['Metrics'],
      summary: 'Actividad reciente (todas las apps)',
      description: 'Obtiene la actividad reciente de todas las aplicaciones, combinada y ordenada por timestamp',
      security: securityScheme,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20, description: 'Número de actividades a retornar' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              description: 'Lista de actividades recientes con información de la app',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'new_user' },
                  appId: { type: 'string', example: 'banners-all-over' },
                  appName: { type: 'string', example: 'Banners All Over' },
                  user: { type: 'object' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        500: errorResponse
      }
    }
  }, aggregateController.getAggregateActivity);

  fastify.get('/summary', {
    schema: {
      tags: ['Metrics'],
      summary: 'Resumen rápido (todas las apps)',
      description: 'Obtiene un resumen conciso de métricas clave para todas las aplicaciones',
      security: securityScheme,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                totals: {
                  type: 'object',
                  description: 'Totales agregados',
                  properties: {
                    totalUsers: { type: 'integer', example: 1500 },
                    activeUsers: { type: 'integer', example: 1200 },
                    totalShops: { type: 'integer', example: 300 },
                    activeShops: { type: 'integer', example: 250 }
                  }
                },
                byApp: {
                  type: 'array',
                  description: 'Resumen por app',
                  items: {
                    type: 'object',
                    properties: {
                      appId: { type: 'string' },
                      appName: { type: 'string' },
                      totalUsers: { type: 'integer' },
                      activeUsers: { type: 'integer' },
                      totalShops: { type: 'integer' },
                      activeShops: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        },
        500: errorResponse
      }
    }
  }, aggregateController.getAggregateSummary);
}

module.exports = aggregateMetricsRoutes;
