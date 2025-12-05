const usersService = require('./service');

/**
 * Users Controller
 * 
 * Maneja las peticiones HTTP relacionadas con usuarios de las apps.
 */

/**
 * GET /api/:appId/users
 * Lista usuarios con paginación y filtros
 */
const list = async (request, reply) => {
  try {
    const { appId } = request;
    const { page, limit, shop, status, search, sortBy, sortOrder } = request.query;

    const result = await usersService.list(appId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      shop,
      status,
      search,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    request.log.error('Users list error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * GET /api/:appId/users/:userId
 * Obtiene un usuario por ID
 */
const getById = async (request, reply) => {
  try {
    const { appId } = request;
    const { userId } = request.params;

    const user = await usersService.getById(appId, userId);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    request.log.error('Get user error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch user',
    });
  }
};

/**
 * PATCH /api/:appId/users/:userId
 * Actualiza un usuario
 */
const update = async (request, reply) => {
  try {
    const { appId } = request;
    const { userId } = request.params;
    const updateData = request.body;

    const user = await usersService.update(appId, userId, updateData);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  } catch (error) {
    request.log.error('Update user error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update user',
    });
  }
};

/**
 * PATCH /api/:appId/users/:userId/status
 * Cambia el estado de un usuario
 */
const updateStatus = async (request, reply) => {
  try {
    const { appId } = request;
    const { userId } = request.params;
    const { status } = request.body;

    const validStatuses = ['active', 'inactive', 'pending', 'blocked'];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const user = await usersService.updateStatus(appId, userId, status);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return {
      success: true,
      data: user,
      message: `User status changed to ${status}`,
    };
  } catch (error) {
    request.log.error('Update status error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update user status',
    });
  }
};

/**
 * GET /api/:appId/users/stats
 * Obtiene estadísticas de usuarios
 */
const getStats = async (request, reply) => {
  try {
    const { appId } = request;
    const { shop } = request.query;

    const stats = await usersService.getStats(appId, shop);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    request.log.error('Get stats error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch user stats',
    });
  }
};

/**
 * GET /api/:appId/users/shops
 * Lista todas las tiendas únicas
 */
const getShops = async (request, reply) => {
  try {
    const { appId } = request;

    const shops = await usersService.getShops(appId);

    return {
      success: true,
      data: shops,
    };
  } catch (error) {
    request.log.error('Get shops error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch shops',
    });
  }
};

module.exports = {
  list,
  getById,
  update,
  updateStatus,
  getStats,
  getShops,
};
