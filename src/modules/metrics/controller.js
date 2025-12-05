const metricsService = require('./service');

/**
 * Metrics Controller
 */

/**
 * GET /api/:appId/metrics/dashboard
 */
const getDashboard = async (request, reply) => {
  try {
    const { appId } = request;
    const dashboard = await metricsService.getDashboard(appId);

    return {
      success: true,
      data: dashboard,
    };
  } catch (error) {
    request.log.error('Dashboard error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch dashboard metrics',
    });
  }
};

/**
 * GET /api/:appId/metrics/users-over-time
 */
const getUsersOverTime = async (request, reply) => {
  try {
    const { appId } = request;
    const { days } = request.query;

    const data = await metricsService.getUsersOverTime(
      appId,
      parseInt(days) || 30
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    request.log.error('Users over time error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch users over time',
    });
  }
};

/**
 * GET /api/:appId/metrics/top-shops
 */
const getTopShops = async (request, reply) => {
  try {
    const { appId } = request;
    const { limit } = request.query;

    const data = await metricsService.getTopShops(
      appId,
      parseInt(limit) || 10
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    request.log.error('Top shops error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch top shops',
    });
  }
};

/**
 * GET /api/:appId/metrics/activity
 */
const getRecentActivity = async (request, reply) => {
  try {
    const { appId } = request;
    const { limit } = request.query;

    const data = await metricsService.getRecentActivity(
      appId,
      parseInt(limit) || 20
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    request.log.error('Recent activity error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch recent activity',
    });
  }
};

/**
 * GET /api/:appId/metrics/custom
 */
const getStoredMetrics = async (request, reply) => {
  try {
    const { appId } = request;
    const { type, shop, startDate, endDate, limit } = request.query;

    const data = await metricsService.getStoredMetrics(appId, {
      type,
      shop,
      startDate,
      endDate,
      limit: parseInt(limit) || 100,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    request.log.error('Stored metrics error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch stored metrics',
    });
  }
};

module.exports = {
  getDashboard,
  getUsersOverTime,
  getTopShops,
  getRecentActivity,
  getStoredMetrics,
};
