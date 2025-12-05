/**
 * EJEMPLO DE INTEGRACIÓN CON TAILUX
 * 
 * Este archivo muestra cómo integrar el backoffice-api con el
 * template Tailux React.
 * 
 * Copia estos archivos a tu proyecto Tailux.
 */

// ============================================================
// 1. API CLIENT (src/lib/api.ts)
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class BackofficeApi {
  private token: string | null = null;

  constructor() {
    // Recuperar token del localStorage al iniciar
    this.token = localStorage.getItem('backoffice_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('backoffice_token', token);
    } else {
      localStorage.removeItem('backoffice_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers },
      });

      const data = await response.json();

      if (!response.ok) {
        // Token expirado
        if (response.status === 401) {
          this.setToken(null);
          window.location.href = '/login';
        }
        throw new Error(data.error || 'API Error');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // ==================== AUTH ====================

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async me() {
    return this.request<{ user: any }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // ==================== APPS ====================

  async getApps() {
    return this.request<Array<{ id: string; name: string }>>('/apps');
  }

  // ==================== USERS ====================

  async getUsers(appId: string, params?: {
    page?: number;
    limit?: number;
    shop?: string;
    status?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, String(value));
      });
    }
    return this.request<any[]>(`/${appId}/users?${query}`);
  }

  async getUser(appId: string, userId: string) {
    return this.request<any>(`/${appId}/users/${userId}`);
  }

  async updateUser(appId: string, userId: string, data: any) {
    return this.request<any>(`/${appId}/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(appId: string, userId: string, status: string) {
    return this.request<any>(`/${appId}/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getUserStats(appId: string) {
    return this.request<any>(`/${appId}/users/stats`);
  }

  async getShops(appId: string) {
    return this.request<string[]>(`/${appId}/users/shops`);
  }

  // ==================== TEMPLATES ====================

  async getTemplates(appId: string, params?: {
    shop?: string;
    category?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, String(value));
      });
    }
    return this.request<any[]>(`/${appId}/templates?${query}`);
  }

  async getTemplate(appId: string, templateId: string) {
    return this.request<any>(`/${appId}/templates/${templateId}`);
  }

  async createTemplate(appId: string, data: any) {
    return this.request<any>(`/${appId}/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(appId: string, templateId: string, data: any) {
    return this.request<any>(`/${appId}/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(appId: string, templateId: string) {
    return this.request<void>(`/${appId}/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async toggleTemplate(appId: string, templateId: string, isActive: boolean) {
    return this.request<any>(`/${appId}/templates/${templateId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // ==================== METRICS ====================

  async getDashboard(appId: string) {
    return this.request<any>(`/${appId}/metrics/dashboard`);
  }

  async getUsersOverTime(appId: string, days = 30) {
    return this.request<any[]>(`/${appId}/metrics/users-over-time?days=${days}`);
  }

  async getTopShops(appId: string, limit = 10) {
    return this.request<any[]>(`/${appId}/metrics/top-shops?limit=${limit}`);
  }

  async getRecentActivity(appId: string) {
    return this.request<any[]>(`/${appId}/metrics/activity`);
  }
}

export const api = new BackofficeApi();


// ============================================================
// 2. AUTH CONTEXT (src/context/AuthContext.tsx)
// ============================================================

/*
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar token al cargar
    const checkAuth = async () => {
      if (api.getToken()) {
        try {
          const response = await api.me();
          if (response.success) {
            setUser(response.data?.user);
          }
        } catch {
          api.logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.success && response.data) {
      setUser(response.data.user);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
*/


// ============================================================
// 3. APP SELECTOR CONTEXT (src/context/AppContext.tsx)
// ============================================================

/*
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface App {
  id: string;
  name: string;
}

interface AppContextType {
  apps: App[];
  currentApp: App | null;
  setCurrentApp: (app: App) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<App[]>([]);
  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadApps = async () => {
      try {
        const response = await api.getApps();
        if (response.success && response.data) {
          setApps(response.data);
          // Seleccionar primera app por defecto
          if (response.data.length > 0) {
            setCurrentApp(response.data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load apps:', error);
      }
      setIsLoading(false);
    };
    loadApps();
  }, []);

  return (
    <AppContext.Provider value={{ apps, currentApp, setCurrentApp, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
*/


// ============================================================
// 4. EJEMPLO DE COMPONENTE: Dashboard (src/pages/Dashboard.tsx)
// ============================================================

/*
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { currentApp } = useApp();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentApp) return;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const response = await api.getDashboard(currentApp.id);
        if (response.success) {
          setDashboard(response.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      }
      setLoading(false);
    };

    loadDashboard();
  }, [currentApp]);

  if (loading) return <div>Loading...</div>;
  if (!dashboard) return <div>No data</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-gray-500 text-sm">Total Users</h3>
        <p className="text-3xl font-bold">{dashboard.users.total}</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-gray-500 text-sm">Active Users</h3>
        <p className="text-3xl font-bold text-green-600">{dashboard.users.active}</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-gray-500 text-sm">New This Week</h3>
        <p className="text-3xl font-bold text-blue-600">{dashboard.users.newThisWeek}</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-gray-500 text-sm">Total Shops</h3>
        <p className="text-3xl font-bold">{dashboard.shops.total}</p>
      </div>
    </div>
  );
}
*/


// ============================================================
// 5. VARIABLE DE ENTORNO (.env en tu proyecto Tailux)
// ============================================================

/*
VITE_API_URL=http://localhost:3001/api
*/
