# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALL OVER APPS - ADMIN API is a Backend For Frontend (BFF) that provides centralized administration for multiple Shopify applications. It uses a **multi-database architecture** where each Shopify app has its own MongoDB database, all accessed through a single unified API.

**Runtime**: Bun (not Node.js)
**Framework**: Fastify v4 (not Express)
**Database**: MongoDB with Mongoose (multiple databases)
**Documentation**: OpenAPI 3.0 via @fastify/swagger

## Code Language Policy

**ALL code, comments, documentation, and API schemas MUST be written in English.**

This includes:
- Variable and function names
- Comments and JSDoc blocks
- OpenAPI/Swagger summaries and descriptions
- Error messages
- Console log messages
- Git commit messages
- Documentation files

**Examples:**

✅ Good:
```javascript
// Get user statistics
summary: 'User statistics'
description: 'Get aggregated user statistics for an app'
```

❌ Bad:
```javascript
// Obtener estadísticas de usuarios
summary: 'Estadísticas de usuarios'
description: 'Obtiene estadísticas agregadas de usuarios de una app'
```

This ensures consistency, maintainability, and accessibility for international developers.

## Development Commands

```bash
# Install dependencies
bun install

# Development (with hot reload)
bun dev

# Production
bun start

# Kill process on port 3001 if needed
lsof -ti:3001 | xargs kill -9
```

## Architecture: Multi-Database Pattern

### Core Concept
The API connects to **multiple MongoDB databases simultaneously** - one per Shopify application. Routes require an `appId` parameter to determine which database to query.

### Key Components

**1. mongoConnector.js (Singleton)**
- Located: `src/shared/mongoConnector.js`
- Manages multiple mongoose connections using a Map
- Implements lazy loading: connections are created on first use
- Model caching: `getModel(appId, modelName, schema)` caches models per connection
- Critical methods:
  - `getConnection(appId)`: Returns or creates connection for an app
  - `getModel(appId, modelName, schema)`: Gets cached model for app+collection
  - `initializeAll()`: Connects to all configured apps at startup

**2. apps.config.js**
- Located: `src/config/apps.config.js`
- Central registry of all applications
- Each app defines: `id`, `name`, `mongoUri`, `collections`, `features`
- Add new apps by:
  1. Adding `MONGODB_APP{N}_URI` and `MONGODB_APP{N}_NAME` to `.env`
  2. Adding config object to `apps` in this file

**3. Shared Schemas**
- Located: `src/shared/schemas.js`
- Defines common data structures across all apps:
  - `AppUserSchema`: Shopify app users (not admin users)
  - `EmailTemplateSchema`: Email templates
  - `MetricsSchema`: Analytics data
  - `ShopSettingsSchema`: Per-shop configuration

### Request Flow for App-Specific Routes

1. **Request arrives**: `GET /api/banners-all-over/users`
2. **Auth middleware** (`src/middleware/auth.js`): Validates JWT token
3. **AppSelector middleware** (`src/middleware/appSelector.js`):
   - Extracts `appId` from route params or `X-App-Id` header
   - Validates app exists in config
   - Gets database connection via `mongoConnector.getConnection(appId)`
   - Attaches `request.appId`, `request.appConfig`, `request.dbConnection`
4. **Controller** receives request with database connection ready
5. **Service** gets models via `mongoConnector.getModel(appId, modelName, schema)`
6. **Response** returned

### Aggregate Endpoints (Multi-Database Queries)

Located: `src/modules/metrics/aggregate-*`

These endpoints query **ALL databases in parallel** without requiring an `appId`:
- `GET /api/metrics/aggregate/dashboard` - Combined metrics from all apps
- `GET /api/metrics/aggregate/users-over-time` - Aggregated user growth
- `GET /api/metrics/aggregate/top-shops` - Top shops across all apps
- `GET /api/metrics/aggregate/activity` - Recent activity from all apps
- `GET /api/metrics/aggregate/summary` - Quick overview

Pattern used:
```javascript
const apps = getAllApps();
const dataPromises = apps.map(async (app) => {
  const data = await service.getData(app.id);
  return { appId: app.id, appName: app.name, data };
});
const results = await Promise.all(dataPromises);
// Aggregate results...
```

## Fastify-Specific Patterns

### Middleware → Hooks
Fastify doesn't use `(req, res, next)` middleware. Use `onRequest` hooks:

```javascript
// Register hook on route
fastify.get('/endpoint', {
  onRequest: [auth, appSelector]
}, handlerFunction);

// Or apply to all routes in a scope
await fastify.register(async (fastify) => {
  fastify.addHook('onRequest', auth);
  await fastify.register(userRoutes);
});
```

### Controller Pattern
```javascript
const controller = async (request, reply) => {
  // Access: request.params, request.query, request.body
  // Middleware adds: request.user, request.appId, request.dbConnection

  // Return data directly (Fastify serializes)
  return { success: true, data };

  // Or use reply for status codes
  return reply.status(400).send({ success: false, error: 'Bad request' });
};
```

### Route Schema (OpenAPI)
Every route should define a schema for Swagger documentation:

```javascript
fastify.get('/endpoint', {
  schema: {
    tags: ['Category'],
    summary: 'Short description',
    security: securityScheme, // Requires JWT
    params: { type: 'object', properties: { appId: appIdParam } },
    querystring: { type: 'object', properties: { page: { type: 'integer' } } },
    response: {
      200: { type: 'object', properties: { success: { type: 'boolean' } } },
      400: errorResponse
    }
  }
}, controller);
```

Import reusable schemas from `src/shared/swagger-schemas.js`.

### AJV Configuration
Fastify uses AJV for validation. The app is configured to accept OpenAPI keywords:

```javascript
ajv: {
  customOptions: { removeAdditional: false, useDefaults: true, coerceTypes: true },
  plugins: [
    function (ajv) {
      ajv.addKeyword('example'); // Allow OpenAPI 'example' in schemas
    }
  ]
}
```

## Module Structure

Each module follows this pattern:
```
src/modules/{module}/
├── routes.js      # Fastify plugin with route definitions + schemas
├── controller.js  # Request handlers (thin layer)
└── service.js     # Business logic + database operations
```

**Service layer** is where database logic lives:
```javascript
class UserService {
  getUserModel(appId) {
    return mongoConnector.getModel(appId, 'User', AppUserSchema);
  }

  async getUsers(appId, filters) {
    const User = this.getUserModel(appId);
    return User.find(filters).lean();
  }
}
```

Always call `mongoConnector.getModel()` to ensure you're using the correct database connection for the app.

## Authentication

### Admin Users (Back Office Team)
- Stored in: `src/modules/auth/admins.json` (temporary - should migrate to dedicated MongoDB)
- JWT tokens with 7-day expiration
- All routes except `/auth/login` require Bearer token

### App Users (Shopify Customers)
- Stored in: each app's MongoDB `users` collection
- Managed via `/api/:appId/users` endpoints
- NOT authenticated users - data managed by admin

## Environment Variables

Critical variables in `.env`:
- `PORT`: Server port (default 3001)
- `JWT_SECRET`: **Must change in production**
- `MONGODB_APP{N}_URI`: Connection string for each app
- `MONGODB_APP{N}_NAME`: Display name for app
- `CORS_ORIGIN`: Frontend URL
- `NODE_ENV`: development/production

See `.env.example` for full list.

## Swagger Documentation

- Base URL: `http://localhost:3001`
- Docs UI: `http://localhost:3001/docs`
- Root `/` redirects to `/docs`

**CSP is disabled** for development to allow Swagger UI assets to load. Re-enable in production with proper configuration.

## Adding a New App

1. Add to `.env`:
```env
MONGODB_APP2_URI=mongodb://user:pass@host/db?authSource=admin
MONGODB_APP2_NAME=My Second App
```

2. Add to `src/config/apps.config.js`:
```javascript
'my-second-app': {
  id: 'my-second-app',
  name: process.env.MONGODB_APP2_NAME,
  mongoUri: process.env.MONGODB_APP2_URI,
  collections: ['users', 'templates'],
  features: { canEditTemplates: true }
}
```

3. Restart server - connection initializes automatically

## Adding a New Module

1. Create `src/modules/{name}/` with `routes.js`, `controller.js`, `service.js`
2. Register in `src/routes/index.js`:
```javascript
const newModuleRoutes = require('../modules/{name}/routes');

// Inside routes function:
await fastify.register(newModuleRoutes, { prefix: '/:appId/{name}' });
```

3. Add OpenAPI tag in `src/index.js` swagger config

## Common Pitfalls

- **Don't use Express patterns**: No `res.json()`, `next()`, or `app.use(middleware)`
- **Don't forget appId**: Most routes need `:appId` param for multi-DB routing
- **Don't create models directly**: Always use `mongoConnector.getModel()`
- **Don't skip schemas**: Every route needs OpenAPI schema for docs
- **Don't use npm**: This project uses Bun exclusively

## Frontend Integration

See `examples/tailux-integration.ts` for complete TypeScript client example including:
- API client class with token management
- React contexts for Auth and App selection
- Example components using the API

Frontend should:
- Store JWT token in localStorage
- Send `Authorization: Bearer {token}` header
- Handle 401 responses (token expired)
- Select current app and pass `appId` to API calls
