const jwt = require('jsonwebtoken');

/**
 * Hook: Auth (Fastify)
 *
 * Verifica el JWT token para autenticar usuarios del Back Office.
 * El token debe enviarse en el header Authorization: Bearer <token>
 *
 * Uso en rutas:
 * fastify.get('/ruta', { onRequest: [auth] }, handler)
 */
const auth = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Adjunta el usuario decodificado al request
      request.user = decoded;
      request.userId = decoded.id;

      // En Fastify no se usa next(), simplemente retorna
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return reply.status(401).send({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      return reply.status(401).send({
        success: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    request.log.error('Auth hook error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Hook: Role Check (Fastify)
 *
 * Verifica que el usuario tenga uno de los roles permitidos.
 * Debe usarse después del hook auth.
 *
 * @param {string[]} allowedRoles - Roles permitidos
 * @returns {Function} Hook de Fastify
 *
 * Uso en rutas:
 * fastify.get('/ruta', { onRequest: [auth, requireRole(['admin'])] }, handler)
 */
const requireRole = (allowedRoles) => {
  return async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Insufficient permissions',
      });
    }
  };
};

/**
 * Genera un JWT token para un usuario del backoffice
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verifica un token sin lanzar excepción
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

module.exports = {
  auth,
  requireRole,
  generateToken,
  verifyToken,
};
