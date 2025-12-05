const mongoConnector = require('../../shared/mongoConnector');
const { MetricsSchema, AppUserSchema, ShopSettingsSchema } = require('../../shared/schemas');

/**
 * Metrics Service
 * 
 * Servicio para obtener métricas y estadísticas de las apps.
 * Principalmente lectura de datos agregados.
 */
class MetricsService {
  getMetricsModel(appId) {
    return mongoConnector.getModel(appId, 'Metric', MetricsSchema);
  }

  getUserModel(appId) {
    return mongoConnector.getModel(appId, 'User', AppUserSchema);
  }

  getShopSettingsModel(appId) {
    return mongoConnector.getModel(appId, 'ShopSettings', ShopSettingsSchema);
  }

  /**
   * Dashboard principal - resumen general
   */
  async getDashboard(appId) {
    const User = this.getUserModel(appId);
    const ShopSettings = this.getShopSettingsModel(appId);

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      totalShops,
      activeShops,
      usersByStatus,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      ShopSettings.countDocuments(),
      ShopSettings.countDocuments({ 
        lastActiveAt: { $gte: startOfWeek } 
      }),
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersWeek,
        newThisMonth: newUsersMonth,
        byStatus: usersByStatus.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
      },
      shops: {
        total: totalShops,
        active: activeShops,
      },
    };
  }

  /**
   * Usuarios por día (últimos N días)
   */
  async getUsersOverTime(appId, days = 30) {
    const User = this.getUserModel(appId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map(r => ({
      date: r._id,
      count: r.count,
    }));
  }

  /**
   * Top shops por usuarios
   */
  async getTopShops(appId, limit = 10) {
    const User = this.getUserModel(appId);

    return User.aggregate([
      {
        $group: {
          _id: '$shop',
          userCount: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
        },
      },
      { $sort: { userCount: -1 } },
      { $limit: limit },
      {
        $project: {
          shop: '$_id',
          userCount: 1,
          activeUsers: 1,
          _id: 0,
        },
      },
    ]);
  }

  /**
   * Actividad reciente
   */
  async getRecentActivity(appId, limit = 20) {
    const User = this.getUserModel(appId);

    const recentUsers = await User.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('email shop status updatedAt createdAt')
      .lean();

    return recentUsers.map(user => ({
      type: user.createdAt.getTime() === user.updatedAt.getTime() ? 'new_user' : 'user_updated',
      user: {
        email: user.email,
        shop: user.shop,
        status: user.status,
      },
      timestamp: user.updatedAt,
    }));
  }

  /**
   * Métricas custom almacenadas
   */
  async getStoredMetrics(appId, options = {}) {
    const { type, shop, startDate, endDate, limit = 100 } = options;
    const Metric = this.getMetricsModel(appId);

    const query = {};
    if (type) query.type = type;
    if (shop) query.shop = shop;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return Metric.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = new MetricsService();
