import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username, password, loginType) => {
    const res = await api.post('/auth/login', { username, password, loginType });
    setUser({
      id: res.data.data.id,
      username: res.data.data.username,
      role: res.data.data.role,
      avatar_url: res.data.data.avatar_url || null,
    });
    return res.data.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const isAdmin = user && ['super_admin', 'farmer'].includes(user.role);
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}