import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'cliente' | 'admin';
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; errors?: string[] }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; errors?: string[] }>;
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; message?: string; errors?: string[] }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  adminDashboardOpen: boolean;
  setAdminDashboardOpen: (open: boolean) => void;
  productsRefreshTrigger: number;
  triggerProductsRefresh: () => void;
}

const API_BASE_URL = 'http://localhost:5000/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('chunna_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('chunna_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Estados de control de modales
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState<boolean>(false);

  // Contador para disparar recarga de productos cuando el admin añade uno
  const [productsRefreshTrigger, setProductsRefreshTrigger] = useState<number>(0);
  const triggerProductsRefresh = () => {
    setProductsRefreshTrigger((prev) => prev + 1);
  };

  // Sincronizar y validar token al inicio
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('chunna_token');
      if (storedToken) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setUser(data.user);
              localStorage.setItem('chunna_user', JSON.stringify(data.user));
            }
          } else {
            // Token inválido o expirado
            logout();
          }
        } catch (error) {
          console.warn('Backend no disponible al verificar sesión, usando sesión local en caché.');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al iniciar sesión',
          errors: data.errors || []
        };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('chunna_token', data.token);
      localStorage.setItem('chunna_user', JSON.stringify(data.user));

      return {
        success: true,
        message: data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: resData.message || 'Error en el registro',
          errors: resData.errors || []
        };
      }

      setUser(resData.user);
      setToken(resData.token);
      localStorage.setItem('chunna_token', resData.token);
      localStorage.setItem('chunna_user', JSON.stringify(resData.user));

      return {
        success: true,
        message: resData.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
      };
    }
  };

  const updateProfile = async (profileData: UpdateProfileData) => {
    if (!token) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Error al actualizar perfil',
          errors: data.errors || []
        };
      }

      setUser(data.user);
      localStorage.setItem('chunna_user', JSON.stringify(data.user));

      return {
        success: true,
        message: data.message || 'Perfil actualizado correctamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error de conexión al intentar actualizar el perfil.'
      };
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('chunna_user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error refrescando perfil:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('chunna_token');
    localStorage.removeItem('chunna_user');
    setAdminDashboardOpen(false);
    setProfileModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        updateProfile,
        logout,
        refreshProfile,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        profileModalOpen,
        setProfileModalOpen,
        adminDashboardOpen,
        setAdminDashboardOpen,
        productsRefreshTrigger,
        triggerProductsRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
