import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize from sessionStorage on mount
  useEffect(() => {
    try {
      const token = sessionStorage.getItem('access_token');
      const stored = sessionStorage.getItem('user');
      if (token && stored && stored !== 'undefined' && stored !== 'null') {
        const parsed = JSON.parse(stored);
        if (parsed) setUser(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const isAuthenticated = !!user;

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (!res || !res.data) throw new Error('Login failed');
      const userData = res.data.user;
      const token = res.data.access_token;
      setUser(userData);
      sessionStorage.setItem('access_token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      if (res.data.refresh_token) {
        sessionStorage.setItem('refresh_token', res.data.refresh_token);
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      setUser(null);
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
    sessionStorage.removeItem('refresh_token');
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      if (!res || !res.data) throw new Error('Registration failed');
      const newUser = res.data.user;
      const token = res.data.access_token;
      if (newUser) {
        setUser(newUser);
        sessionStorage.setItem('access_token', token);
        sessionStorage.setItem('user', JSON.stringify(newUser));
        if (res.data.refresh_token) {
          sessionStorage.setItem('refresh_token', res.data.refresh_token);
        }
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (token) => {
    try {
      const res = await api.post('/auth/refresh', { refreshToken: token });
      if (!res || !res.data) throw new Error('Refresh failed');
      sessionStorage.setItem('access_token', res.data.access_token);
      if (res.data.refresh_token) {
        sessionStorage.setItem('refresh_token', res.data.refresh_token);
      }
      return res.data;
    } catch (err) {
      logout();
      throw err;
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (!res || !res.data) throw new Error('Failed to fetch profile');
      setUser(res.data);
      return res.data;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const updateUserProfile = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : updates));
  };

  const clearError = () => setError(null);

  // hasRole accepts a single role string or an array of roles
  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

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
