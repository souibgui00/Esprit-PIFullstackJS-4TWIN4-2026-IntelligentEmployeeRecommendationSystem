import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../useAuth';

// Mock the API service
jest.mock('../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  const mockPost = require('../../services/api').post;
  const mockGet = require('../../services/api').get;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'EMPLOYEE',
        },
      },
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    expect(result.current.user).toEqual(mockResponse.data.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('access_token', 'mock-token');
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user));
  });

  it('should handle login failure', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    };

    mockPost.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await expect(result.current.login('test@example.com', 'wrongpassword')).rejects.toThrow();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should logout successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
    };

    const mockResponse = {
      data: { message: 'Logout successful' },
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    
    // Then logout
    await act(async () => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  it('should register successfully', async () => {
    const mockResponse = {
      data: {
        user: {
          id: '2',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'EMPLOYEE',
        },
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
      },
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        matricule: 'EMP-002',
      });
    });
    
    expect(result.current.user).toEqual(mockResponse.data.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/auth/register', {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      matricule: 'EMP-002',
    });
  });

  it('should handle registration failure', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Email already exists',
        },
      },
    };

    mockPost.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await expect(result.current.register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      })).rejects.toThrow();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Email already exists');
  });

  it('should refresh token successfully', async () => {
    const mockResponse = {
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      },
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.refreshToken('old-refresh-token');
    });
    
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh', {
      refreshToken: 'old-refresh-token',
    });
  });

  it('should handle refresh token failure', async () => {
    const mockError = {
      response: {
        status: 401,
      },
    };

    mockPost.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.refreshToken('invalid-token');
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should initialize user from sessionStorage', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
    };

    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === 'access_token') return 'mock-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle fetch user profile', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
    };

    mockGet.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.fetchUserProfile();
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(mockGet).toHaveBeenCalledWith('/auth/profile');
  });

  it('should handle fetch user profile failure', async () => {
    mockGet.mockRejectedValue(new Error('Failed to fetch profile'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.fetchUserProfile();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should update user profile', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Updated Name',
      role: 'EMPLOYEE',
    };

    mockGet.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      result.current.updateUserProfile({ name: 'Updated Name' });
    });
    
    expect(result.current.user.name).toBe('Updated Name');
  });

  it('should clear error when clearError is called', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Some error',
        },
      },
    };

    mockPost.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await expect(result.current.login('test@example.com', 'wrongpassword')).rejects.toThrow();
    });
    
    expect(result.current.error).toBe('Some error');
    
    await act(async () => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should handle loading states', async () => {
    mockPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const loginPromise = act(async () => {
      result.current.login('test@example.com', 'password123');
    });
    
    expect(result.current.loading).toBe(true);
    
    await loginPromise;
    
    expect(result.current.loading).toBe(false);
  });

  it('should check if user has specific role', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    };

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.hasRole('ADMIN')).toBe(true);
    expect(result.current.hasRole('MANAGER')).toBe(false);
    expect(result.current.hasRole(['ADMIN', 'MANAGER'])).toBe(true);
    expect(result.current.hasRole(['MANAGER', 'HR'])).toBe(false);
  });

  it('should handle user state updates', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE',
    };

    await act(async () => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    
    await act(async () => {
      result.current.setUser(null);
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
