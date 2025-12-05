# ALL OVER APPS - ADMIN API

API de administración centralizada para todas las aplicaciones de ALL OVER APPS. Backend For Frontend (BFF) que gestiona múltiples aplicaciones Shopify desde un panel administrativo unificado.

## 🚀 Quick Start

```bash
# Instalar dependencias
bun install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
nano .env

# Iniciar en desarrollo (con hot reload)
bun dev

# Producción
bun start
```

## 📁 Estructura del Proyecto

```
backoffice-api/
├── src/
│   ├── config/
│   │   └── apps.config.js     # Configuración de apps
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── appSelector.js     # Selección de DB por app
│   ├── modules/
│   │   ├── auth/              # Login del equipo
│   │   ├── users/             # Usuarios de las apps
│   │   ├── templates/         # Templates de email
│   │   └── metrics/           # Métricas y dashboard
│   ├── routes/
│   │   └── index.js           # Router principal
│   ├── shared/
│   │   ├── mongoConnector.js  # Conexiones multi-DB
│   │   └── schemas.js         # Schemas compartidos
│   └── index.js               # Entry point
├── .env.example
└── package.json
```

## 🔧 Configuración

### Variables de Entorno

```env
# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=tu-secret-super-seguro
JWT_EXPIRES_IN=7d

# MongoDB por App
MONGODB_APP1_URI=mongodb://localhost:27017/shopify_app_1
MONGODB_APP1_NAME=Mi App 1

MONGODB_APP2_URI=mongodb://localhost:27017/shopify_app_2
MONGODB_APP2_NAME=Mi App 2

# CORS (URL de tu frontend Tailux)
CORS_ORIGIN=http://localhost:5173
```

### Agregar una Nueva App

1. Añade las variables en `.env`:
```env
MONGODB_APP3_URI=mongodb://...
MONGODB_APP3_NAME=Nueva App
```

2. Añade la configuración en `src/config/apps.config.js`:
```javascript
app3: {
  id: 'app3',
  name: process.env.MONGODB_APP3_NAME,
  mongoUri: process.env.MONGODB_APP3_URI,
  collections: ['users', 'templates'],
  features: {
    canEditTemplates: true,
    canEditUsers: true,
    canViewMetrics: true,
  }
}
```

## 📡 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/refresh` | Refresh token |

### Apps

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/apps` | Lista apps disponibles |

### Usuarios (por app)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/:appId/users` | Lista usuarios |
| GET | `/api/:appId/users/:id` | Obtiene usuario |
| PATCH | `/api/:appId/users/:id` | Actualiza usuario |
| PATCH | `/api/:appId/users/:id/status` | Cambia estado |
| GET | `/api/:appId/users/stats` | Estadísticas |
| GET | `/api/:appId/users/shops` | Lista de shops |

### Templates (por app)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/:appId/templates` | Lista templates |
| POST | `/api/:appId/templates` | Crea template |
| GET | `/api/:appId/templates/:id` | Obtiene template |
| PUT | `/api/:appId/templates/:id` | Actualiza template |
| DELETE | `/api/:appId/templates/:id` | Elimina template |
| PATCH | `/api/:appId/templates/:id/toggle` | Activa/desactiva |
| POST | `/api/:appId/templates/:id/duplicate` | Duplica |

### Métricas (por app)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/:appId/metrics/dashboard` | Dashboard general |
| GET | `/api/:appId/metrics/users-over-time` | Usuarios por día |
| GET | `/api/:appId/metrics/top-shops` | Top tiendas |
| GET | `/api/:appId/metrics/activity` | Actividad reciente |

## 🔐 Autenticación

Todas las rutas (excepto login) requieren JWT en el header:

```
Authorization: Bearer <token>
```

Las rutas por app también requieren el header o parámetro:

```
X-App-Id: app1
```

O usar el parámetro de ruta:

```
/api/app1/users
```

## 🎨 Integración con Tailux (Frontend)

### Ejemplo de API Client

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;
  private currentApp: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  setApp(appId: string) {
    this.currentApp = appId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...(this.currentApp && { 'X-App-Id': this.currentApp }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Apps
  getApps() {
    return this.request('/apps');
  }

  // Users
  getUsers(appId: string, params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/${appId}/users?${query}`);
  }

  // Templates
  getTemplates(appId: string) {
    return this.request(`/${appId}/templates`);
  }

  updateTemplate(appId: string, id: string, data: any) {
    return this.request(`/${appId}/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  getDashboard(appId: string) {
    return this.request(`/${appId}/metrics/dashboard`);
  }
}

export const api = new ApiClient();
```

### Ejemplo de Hook

```typescript
// src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useUsers(appId: string, filters?: any) {
  return useQuery({
    queryKey: ['users', appId, filters],
    queryFn: () => api.getUsers(appId, filters),
    enabled: !!appId,
  });
}
```

## 🛡️ Seguridad en Producción

1. **Cambiar JWT_SECRET** a un valor seguro y largo
2. **Configurar CORS** con los dominios permitidos
3. **Mover admins a MongoDB** en lugar de archivo
4. **Añadir rate limiting** (express-rate-limit)
5. **Configurar HTTPS** 
6. **Añadir validación** más estricta (express-validator)

## 📝 Próximos Pasos

- [ ] Migrar admins a MongoDB dedicada
- [ ] Añadir logs estructurados (Winston)
- [ ] Implementar rate limiting
- [ ] Añadir tests
- [ ] Documentación OpenAPI/Swagger
- [ ] Webhooks para sincronización en tiempo real

## 📄 Licencia

MIT
