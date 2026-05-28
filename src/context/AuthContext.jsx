import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null, loading: true,
  login: () => {}, logout: () => {}, hasPermission: () => false,
});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // hasPermission(page) → checks read access (for nav visibility)
  // hasPermission(page, action) → checks specific action (export, update, etc.)
  const hasPermission = (page, action = 'read') => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    // role_management, scan_loyalty, join_loyalty are super_admin exclusive
    if (['role_management', 'scan_loyalty', 'join_loyalty'].includes(page)) return false;
    return !!(user.permissions?.[page]?.[action]);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
