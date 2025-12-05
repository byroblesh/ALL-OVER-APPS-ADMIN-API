const metricsService = require('./service');
const { getAllApps } = require('../../config/apps.config');

/**
 * Aggregate Metrics Controller
 *
 * Controlador para métricas agregadas de todas las aplicaciones.
 * No requiere appId - consulta todas las apps configuradas.
 */

/**
 * GET /api/metrics/aggregate/dashboard
 * Dashboard combinado de todas las aplicaciones
 */
const getAggregateDashboard = async (request, reply) => {
  try {
    const apps = getAllApps();

    // Obtener dashboard de cada app en paralelo
    const dashboardPromises = apps.map(async (app) => {
      try {
        const dashboard = await metricsService.getDashboard(app.id);
        return {
          appId: app.id,
          appName: app.name,
          data: dashboard,
        };
      } catch (error) {
        request.log.error(`Dashboard error for ${app.id}:`, error);
        return {
          appId: app.id,
          appName: app.name,
          error: error.message,
        };
      }
    });

    const dashboards = await Promise.all(dashboardPromises);

    // Calcular totales agregados
    const aggregate = {
      users: {
        total: 0,
        active: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
        byStatus: {},
      },
      shops: {
        total: 0,
        active: 0,
      },
    };

    dashboards.forEach(({ data }) => {
      if (data) {
        aggregate.users.total += data.users.total;
        aggregate.users.active += data.users.active;
        aggregate.users.newToday += data.users.newToday;
        aggregate.users.newThisWeek += data.users.newThisWeek;
        aggregate.users.newThisMonth += data.users.newThisMonth;

        // Combinar byStatus
        Object.entries(data.users.byStatus || {}).forEach(([status, count]) => {
          aggregate.users.byStatus[status] = (aggregate.users.byStatus[status] || 0) + count;
        });

        aggregate.shops.total += data.shops.total;
        aggregate.shops.active += data.shops.active;
      }
    });

    return {
      success: true,
      data: {
        aggregate,
        byApp: dashboards,
      },
    };
  } catch (error) {
    request.log.error('Aggregate dashboard error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch aggregate dashboard',
    });
  }
};

/**
 * GET /api/metrics/aggregate/users-over-time
 * Usuarios en el tiempo agregados de todas las apps
 */
const getAggregateUsersOverTime = async (request, reply) => {
  try {
    const { days } = request.query;
    const daysNum = parseInt(days) || 30;
    const apps = getAllApps();

    // Obtener datos de cada app
    const dataPromises = apps.map(async (app) => {
      try {
        const data = await metricsService.getUsersOverTime(app.id, daysNum);
        return {
          appId: app.id,
          appName: app.name,
          data,
        };
      } catch (error) {
        request.log.error(`Users over time error for ${app.id}:`, error);
        return {
          appId: app.id,
          appName: app.name,
          error: error.message,
          data: [],
        };
      }
    });

    const results = await Promise.all(dataPromises);

    // Agregar datos por fecha
    const aggregateByDate = {};
    results.forEach(({ appId, appName, data }) => {
      if (data && Array.isArray(data)) {
        data.forEach(({ date, count }) => {
          if (!aggregateByDate[date]) {
            aggregateByDate[date] = { date, total: 0, byApp: {} };
          }
          aggregateByDate[date].total += count;
          aggregateByDate[date].byApp[appId] = {
            name: appName,
            count,
          };
        });
      }
    });

    // Convertir a array y ordenar por fecha
    const aggregateData = Object.values(aggregateByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return {
      success: true,
      data: {
        aggregate: aggregateData,
        byApp: results,
      },
    };
  } catch (error) {
    request.log.error('Aggregate users over time error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch aggregate users over time',
    });
  }
};

/**
 * GET /api/metrics/aggregate/top-shops
 * Top shops agregados de todas las apps
 */
const getAggregateTopShops = async (request, reply) => {
  try {
    const { limit } = request.query;
    const limitNum = parseInt(limit) || 10;
    const apps = getAllApps();

    // Obtener top shops de cada app
    const dataPromises = apps.map(async (app) => {
      try {
        const data = await metricsService.getTopShops(app.id, limitNum);
        return {
          appId: app.id,
          appName: app.name,
          data,
        };
      } catch (error) {
        request.log.error(`Top shops error for ${app.id}:`, error);
        return {
          appId: app.id,
          appName: app.name,
          error: error.message,
          data: [],
        };
      }
    });

    const results = await Promise.all(dataPromises);

    // Agregar datos por shop (sumando usuarios de la misma tienda en diferentes apps)
    const shopMap = {};
    results.forEach(({ appId, appName, data }) => {
      if (data && Array.isArray(data)) {
        data.forEach(({ shop, userCount, activeUsers }) => {
          if (!shopMap[shop]) {
            shopMap[shop] = {
              shop,
              totalUsers: 0,
              totalActiveUsers: 0,
              byApp: {},
            };
          }
          shopMap[shop].totalUsers += userCount;
          shopMap[shop].totalActiveUsers += activeUsers;
          shopMap[shop].byApp[appId] = {
            name: appName,
            userCount,
            activeUsers,
          };
        });
      }
    });

    // Convertir a array, ordenar y limitar
    const aggregateData = Object.values(shopMap)
      .sort((a, b) => b.totalUsers - a.totalUsers)
      .slice(0, limitNum);

    return {
      success: true,
      data: {
        aggregate: aggregateData,
        byApp: results,
      },
    };
  } catch (error) {
    request.log.error('Aggregate top shops error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch aggregate top shops',
    });
  }
};

/**
 * GET /api/metrics/aggregate/activity
 * Actividad reciente agregada de todas las apps
 */
const getAggregateActivity = async (request, reply) => {
  try {
    const { limit } = request.query;
    const limitNum = parseInt(limit) || 20;
    const apps = getAllApps();

    // Obtener actividad de cada app
    const dataPromises = apps.map(async (app) => {
      try {
        const data = await metricsService.getRecentActivity(app.id, limitNum);
        return data.map(activity => ({
          ...activity,
          appId: app.id,
          appName: app.name,
        }));
      } catch (error) {
        request.log.error(`Activity error for ${app.id}:`, error);
        return [];
      }
    });

    const results = await Promise.all(dataPromises);

    // Combinar todas las actividades
    const allActivity = results.flat();

    // Ordenar por timestamp y limitar
    const sortedActivity = allActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limitNum);

    return {
      success: true,
      data: sortedActivity,
    };
  } catch (error) {
    request.log.error('Aggregate activity error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch aggregate activity',
    });
  }
};

/**
 * GET /api/metrics/aggregate/summary
 * Resumen rápido de todas las apps
 */
const getAggregateSummary = async (request, reply) => {
  try {
    const apps = getAllApps();

    const summaryPromises = apps.map(async (app) => {
      try {
        const dashboard = await metricsService.getDashboard(app.id);
        return {
          appId: app.id,
          appName: app.name,
          totalUsers: dashboard.users.total,
          activeUsers: dashboard.users.active,
          totalShops: dashboard.shops.total,
          activeShops: dashboard.shops.active,
        };
      } catch (error) {
        request.log.error(`Summary error for ${app.id}:`, error);
        return {
          appId: app.id,
          appName: app.name,
          error: error.message,
        };
      }
    });

    const summaries = await Promise.all(summaryPromises);

    const totals = summaries.reduce(
      (acc, summary) => {
        if (!summary.error) {
          acc.totalUsers += summary.totalUsers || 0;
          acc.activeUsers += summary.activeUsers || 0;
          acc.totalShops += summary.totalShops || 0;
          acc.activeShops += summary.activeShops || 0;
        }
        return acc;
      },
      { totalUsers: 0, activeUsers: 0, totalShops: 0, activeShops: 0 }
    );

    return {
      success: true,
      data: {
        totals,
        byApp: summaries,
      },
    };
  } catch (error) {
    request.log.error('Aggregate summary error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch aggregate summary',
    });
  }
};

module.exports = {
  getAggregateDashboard,
  getAggregateUsersOverTime,
  getAggregateTopShops,
  getAggregateActivity,
  getAggregateSummary,
};
