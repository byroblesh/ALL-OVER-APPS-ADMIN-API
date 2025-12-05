const authService = require('./service');

/**
 * Auth Controller
 */

/**
 * POST /api/auth/login
 */
const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        error: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);

    if (!result.success) {
      return reply.status(401).send({
        success: false,
        error: result.error,
      });
    }

    return {
      success: true,
      token: result.token,
      user: result.user,
    };
  } catch (error) {
    request.log.error('Login error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Login failed',
    });
  }
};

/**
 * GET /api/auth/me
 * Requiere autenticación
 */
const me = async (request, reply) => {
  try {
    return {
      success: true,
      user: request.user,
    };
  } catch (error) {
    request.log.error('Me error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get user info',
    });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh token
 */
const refresh = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'No token provided',
      });
    }

    const user = await authService.validateToken(token);

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid token',
      });
    }

    const { generateToken } = require('../../middleware/auth');
    const newToken = generateToken(user);

    return {
      success: true,
      token: newToken,
      user,
    };
  } catch (error) {
    request.log.error('Refresh error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to refresh token',
    });
  }
};

/**
 * POST /api/auth/hash-password (solo desarrollo)
 * Utilidad para generar hashes
 */
const hashPassword = async (request, reply) => {
  if (process.env.NODE_ENV !== 'development') {
    return reply.status(404).send({ error: 'Not found' });
  }

  const { password } = request.body;
  if (!password) {
    return reply.status(400).send({ error: 'Password required' });
  }

  const hash = await authService.hashPassword(password);
  return { hash };
};

module.exports = {
  login,
  me,
  refresh,
  hashPassword,
};
