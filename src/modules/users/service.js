const mongoConnector = require('../../shared/mongoConnector');
const { AppUserSchema } = require('../../shared/schemas');

/**
 * Users Service
 * 
 * Servicio para gestionar usuarios de las apps (no del backoffice).
 * Todas las operaciones requieren un appId para saber a qué DB conectar.
 */
class UsersService {
  /**
   * Obtiene el modelo User para una app específica
   */
  getModel(appId) {
    return mongoConnector.getModel(appId, 'User', AppUserSchema);
  }

  /**
   * Lista usuarios con paginación y filtros
   */
  async list(appId, options = {}) {
    const {
      page = 1,
      limit = 20,
      shop,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const User = this.getModel(appId);
    const query = {};

    // Filtros
    if (shop) query.shop = shop;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById(appId, userId) {
    const User = this.getModel(appId);
    return User.findById(userId).lean();
  }

  /**
   * Obtiene un usuario por email
   */
  async getByEmail(appId, email) {
    const User = this.getModel(appId);
    return User.findOne({ email: email.toLowerCase() }).lean();
  }

  /**
   * Actualiza un usuario
   */
  async update(appId, userId, updateData) {
    const User = this.getModel(appId);
    
    // Campos que no se pueden actualizar desde el backoffice
    const { _id, shop, shopifyCustomerId, createdAt, ...safeData } = updateData;

    return User.findByIdAndUpdate(
      userId,
      { $set: safeData },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Cambia el estado de un usuario
   */
  async updateStatus(appId, userId, status) {
    const User = this.getModel(appId);
    return User.findByIdAndUpdate(
      userId,
      { $set: { status } },
      { new: true }
    ).lean();
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  async getStats(appId, shop = null) {
    const User = this.getModel(appId);
    const match = shop ? { shop } : {};

    const stats = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await User.countDocuments(match);

    return {
      total,
      byStatus: stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Obtiene lista de shops únicos
   */
  async getShops(appId) {
    const User = this.getModel(appId);
    return User.distinct('shop');
  }
}

module.exports = new UsersService();
