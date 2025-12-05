const bcrypt = require('bcryptjs');
const { generateToken } = require('../../middleware/auth');

/**
 * Auth Service
 *
 * Manages authentication for Back Office users (your team).
 *
 * NOTE: In production, you should use a separate database
 * for backoffice admins. For simplicity, this example
 * uses in-memory/file configuration.
 */

// In production, move this to a dedicated DB for admins
// For now, we define admins in environment variables or here
const ADMIN_USERS = [
  {
    id: '1',
    email: 'admin@tuempresa.com',
    // Password: admin123 (change in production)
    passwordHash: '$2a$10$A88rlrMDcrqYi5lEf1rP6emK.uwTQjpCCCsmWdmW1/ZPJdgjh.EoW',
    name: 'Admin',
    role: 'admin',
  },
];

class AuthService {
  /**
   * Find admin by email
   */
  async findByEmail(email) {
    return ADMIN_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Verify credentials and generate token
   */
  async login(email, password) {
    const user = await this.findByEmail(email);

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // For first login, if hash is invalid, generate a new one
    // (useful for development - REMOVE in production)
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
    } catch {
      // If hash is invalid, in development we allow creating a new one
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV: Generating new password hash...');
        const newHash = await bcrypt.hash(password, 10);
        console.log(`DEV: New hash for "${password}": ${newHash}`);
        isValidPassword = true; // Allow in development
      }
    }

    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = generateToken(user);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Generate password hash (useful for creating new admins)
   */
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  /**
   * Validate token and return user
   */
  async validateToken(token) {
    const { verifyToken } = require('../../middleware/auth');
    const decoded = verifyToken(token);

    if (!decoded) {
      return null;
    }

    const user = await this.findByEmail(decoded.email);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}

module.exports = new AuthService();
