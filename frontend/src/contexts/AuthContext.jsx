import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('access_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const isAuthenticated = !!user;

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const userData = res.data.user;
      const token = res.data.token;
      setUser(userData);
      sessionStorage.setItem('access_token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (token) => {
    try {
      const res = await api.post('/auth/refresh', { token });
      sessionStorage.setItem('access_token', res.data.access_token);
    } catch (err) {
      logout();
      throw err;
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const updateUserProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const clearError = () => setError(null);

  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, error, isAuthenticated,
      login, logout, register, refreshToken,
      fetchUserProfile, updateUserProfile, clearError, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
