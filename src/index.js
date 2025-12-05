require('dotenv').config();

const fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const formbody = require('@fastify/formbody');
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');

const routes = require('./routes');
const mongoConnector = require('./shared/mongoConnector');

const PORT = process.env.PORT || 3001;

/**
 * Crea y configura la instancia de Fastify
 */
const buildApp = async () => {
  const app = fastify({
    logger: process.env.NODE_ENV !== 'test' ? {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        }
      }
    } : false,
    bodyLimit: 10485760, // 10MB
    ajv: {
      customOptions: {
        removeAdditional: false,
        useDefaults: true,
        coerceTypes: true,
        allErrors: true
      },
      plugins: [
        function (ajv) {
          // Añadir palabras clave de OpenAPI que no están en JSON Schema
          ajv.addKeyword('example');
        }
      ]
    }
  });

  /**
   * Plugins
   */

  // Seguridad - Deshabilitar CSP para permitir Swagger UI
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false  // Desactivar CSP completamente para desarrollo
  });

  // CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Form body parsing (application/x-www-form-urlencoded)
  await app.register(formbody);

  /**
   * Swagger Documentation
   */
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'ALL OVER APPS - ADMIN API',
        description: 'API de administración centralizada para todas las aplicaciones de ALL OVER APPS. Gestiona múltiples apps Shopify desde un panel administrativo unificado.',
        version: '1.0.0',
        contact: {
          name: 'ALL OVER APPS Team',
          email: 'support@bannersallover.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'Auth', description: 'Autenticación del Back Office' },
        { name: 'Apps', description: 'Gestión de aplicaciones' },
        { name: 'Users', description: 'Gestión de usuarios por app' },
        { name: 'Templates', description: 'Gestión de templates de email' },
        { name: 'Metrics', description: 'Métricas y analytics' },
        { name: 'Health', description: 'Health checks' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtenido del endpoint /api/auth/login'
          }
        }
      }
    }
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true
    },
    // Configuración de UI
    theme: {
      title: 'ALL OVER APPS - ADMIN API'
    },
    logo: {
      type: 'image/png',
      content: Buffer.from('')
    }
  });

  /**
   * Routes
   */
  await app.register(routes, { prefix: '/api' });

  // Root endpoint - Redirect to Swagger docs
  app.get('/', async (request, reply) => {
    return reply.redirect('/docs');
  });

  /**
   * Error handling
   */
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    reply.status(error.statusCode || 500).send({
      success: false,
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });

  return app;
};

/**
 * Server startup
 */
const startServer = async () => {
  let app;

  try {
    // Inicializar conexiones a MongoDB
    console.log('🚀 Starting ALL OVER APPS - ADMIN API...');
    console.log('📦 Initializing database connections...');

    const dbStatus = await mongoConnector.initializeAll();
    console.log(`✅ Connected to ${dbStatus.connected}/${dbStatus.total} databases`);

    if (dbStatus.failed > 0) {
      console.warn(`⚠️  ${dbStatus.failed} database(s) failed to connect`);
    }

    // Construir app de Fastify
    app = await buildApp();

    // Iniciar servidor
    await app.listen({
      port: PORT,
      host: '0.0.0.0',
    });

    console.log(`\n🎉 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);

    try {
      await app.close();
      await mongoConnector.closeAll();
      console.log('✅ Server closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Start
if (require.main === module) {
  startServer();
}

module.exports = { buildApp }; // Para testing
