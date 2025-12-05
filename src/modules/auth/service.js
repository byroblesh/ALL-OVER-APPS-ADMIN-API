const bcrypt = require('bcryptjs');
const { generateToken } = require('../../middleware/auth');

/**
 * Auth Service
 * 
 * Gestiona autenticación de usuarios del Back Office (tu equipo).
 * 
 * NOTA: En producción, deberías usar una base de datos separada
 * para los admins del backoffice. Por simplicidad, este ejemplo
 * usa configuración en memoria/archivo.
 */

// En producción, mover esto a una DB dedicada para admins
// Por ahora, definimos admins en variables de entorno o aquí
const ADMIN_USERS = [
  {
    id: '1',
    email: 'admin@tuempresa.com',
    // Password: admin123 (cambiar en producción)
    passwordHash: '$2a$10$XQxBtJXKQXFJZ5GjGvGvUOzVZ5M5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5O',
    name: 'Admin',
    role: 'admin',
  },
];

class AuthService {
  /**
   * Busca admin por email
   */
  async findByEmail(email) {
    return ADMIN_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Verifica credenciales y genera token
   */
  async login(email, password) {
    const user = await this.findByEmail(email);
    
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Para el primer login, si el hash no es válido, genera uno nuevo
    // (útil para desarrollo - QUITAR en producción)
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
    } catch {
      // Si el hash es inválido, en desarrollo permitimos crear uno nuevo
      if (process.env.NODE_ENV === 'development') {
        console.log('DEV: Generating new password hash...');
        const newHash = await bcrypt.hash(password, 10);
        console.log(`DEV: New hash for "${password}": ${newHash}`);
        isValidPassword = true; // Permitir en desarrollo
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
   * Genera hash de password (útil para crear nuevos admins)
   */
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  /**
   * Valida token y retorna usuario
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
