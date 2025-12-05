const aggregateController = require('./aggregate-controller');
const { errorResponse, securityScheme } = require('../../shared/swagger-schemas');

/**
 * Aggregate Metrics Routes (Fastify Plugin)
 *
 * Prefix: /api/metrics/aggregate
 *
 * Endpoints that aggregate data from ALL applications.
 * Do not require appId - query all configured apps.
 *
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function aggregateMetricsRoutes(fastify, options) {
  fastify.get('/dashboard', {
    schema: {
      tags: ['Metrics'],
      summary: 'Aggregated dashboard from all apps',
      description: 'Get combined metrics from all configured applications',
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
                  description: 'Aggregated totals from all apps',
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
                  description: 'Individual dashboard for each app',
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
      summary: 'Users over time (all apps)',
      description: 'Get statistics of registered users per day, aggregated from all applications',
      security: securityScheme,
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'integer', default: 30, description: 'Number of days to query' }
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
                  description: 'Aggregated data by date',
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
                  description: 'Individual data for each app',
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
      summary: 'Top shops (all apps)',
      description: 'Get shops with most users, aggregating data from all applications. If a shop is in multiple apps, their users are summed.',
      security: securityScheme,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10, description: 'Number of shops to return' }
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
                  description: 'Aggregated top shops',
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
                  description: 'Top shops per app',
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
      summary: 'Recent activity (all apps)',
      description: 'Get recent activity from all applications, combined and sorted by timestamp',
      security: securityScheme,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20, description: 'Number of activities to return' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              description: 'List of recent activities with app information',
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
      summary: 'Quick summary (all apps)',
      description: 'Get a concise summary of key metrics for all applications',
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
                  description: 'Aggregated totals',
                  properties: {
                    totalUsers: { type: 'integer', example: 1500 },
                    activeUsers: { type: 'integer', example: 1200 },
                    totalShops: { type: 'integer', example: 300 },
                    activeShops: { type: 'integer', example: 250 }
                  }
                },
                byApp: {
                  type: 'array',
                  description: 'Summary per app',
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
