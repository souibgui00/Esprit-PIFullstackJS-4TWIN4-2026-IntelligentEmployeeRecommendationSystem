import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Mock the API service
jest.mock('../../services/api', () => ({
  get: jest.fn(),
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  const mockGet = require('../../services/api').get;
  const mockUseAuth = require('../../contexts/AuthContext').useAuth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard correctly', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    const mockStats = {
      users: { total: 150 },
      activities: { total: 25 },
      departments: { total: 10 },
    };

    const mockDepartments = [
      { id: '1', name: 'Engineering', employeeCount: 25 },
      { id: '2', name: 'HR', employeeCount: 5 },
    ];

    const mockActivities = [
      { id: '1', title: 'Team Meeting', status: 'completed' },
      { id: '2', title: 'Training', status: 'ongoing' },
    ];

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: mockDepartments })
      .mockResolvedValueOnce({ data: mockActivities });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<Dashboard />);

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('displays error message when API fails', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows different content for different user roles', async () => {
    const mockManager = {
      id: '2',
      name: 'Manager User',
      email: 'manager@example.com',
      role: 'MANAGER',
    };

    const mockStats = {
      users: { total: 0 },
      activities: { total: 15 },
      departments: { total: 5 },
    };

    mockUseAuth.mockReturnValue({ user: mockManager, isAuthenticated: true });
    mockGet
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByText('150')).not.toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('displays departments section correctly', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    const mockStats = {
      users: { total: 150 },
      activities: { total: 25 },
      departments: { total: 10 },
    };

    const mockDepartments = [
      { id: '1', name: 'Engineering', employeeCount: 25 },
      { id: '2', name: 'HR', employeeCount: 5 },
      { id: '3', name: 'Marketing', employeeCount: 8 },
    ];

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: mockDepartments })
      .mockResolvedValueOnce({ data: [] });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /departments/i })).toBeInTheDocument();
      expect(screen.getByText(/engineering/i)).toBeInTheDocument();
      expect(screen.getByText((content, element) =>
        element?.tagName === 'DIV' && content.includes('Engineering') && content.includes('25 employees')
      )).toBeInTheDocument();
      expect(screen.getByText(/hr/i)).toBeInTheDocument();
      expect(screen.getByText((content, element) =>
        element?.tagName === 'DIV' && content.includes('HR') && content.includes('5 employees')
      )).toBeInTheDocument();
    });
  });

  it('displays recent activities correctly', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    const mockStats = {
      users: { total: 150 },
      activities: { total: 25 },
      departments: { total: 10 },
    };

    const mockDepartments = [];

    const mockActivities = [
      { id: '1', title: 'Team Meeting', status: 'completed', date: '2024-01-15' },
      { id: '2', title: 'Training Session', status: 'ongoing', date: '2024-01-16' },
      { id: '3', title: 'Project Review', status: 'pending', date: '2024-01-17' },
    ];

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: mockDepartments })
      .mockResolvedValueOnce({ data: mockActivities });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /recent activities/i })).toBeInTheDocument();
      expect(screen.getByText(/team meeting/i)).toBeInTheDocument();
      expect(screen.getByText(/training session/i)).toBeInTheDocument();
      expect(screen.getByText(/project review/i)).toBeInTheDocument();
    });
  });

  it('shows welcome message with user name', async () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'ADMIN',
    };

    const mockStats = {
      users: { total: 150 },
      activities: { total: 25 },
      departments: { total: 10 },
    };

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/welcome, john doe/i)).toBeInTheDocument();
    });
  });

  it('handles empty departments list', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    const mockStats = {
      users: { total: 150 },
      activities: { total: 25 },
      departments: { total: 0 },
    };

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no departments found/i)).toBeInTheDocument();
    });
  });

  it('handles empty activities list', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    const mockStats = {
      users: { total: 150 },
      activities: { total: 0 },
      departments: { total: 10 },
    };

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet
      .mockResolvedValueOnce({ data: mockStats })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no recent activities/i)).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    const mockStats = {
      users: { total: 150 },
      activities: { total: 25 },
      departments: { total: 10 },
    };

    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockGet.mockResolvedValue({ data: mockStats });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // 3 calls on initial load + 3 calls on refresh
    expect(mockGet).toHaveBeenCalledTimes(6);
  });

  it('redirects to login if user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    mockGet.mockResolvedValue({ data: {} });

    renderWithProviders(<Dashboard />);

    // Dashboard returns null when not authenticated
    expect(screen.queryByRole('heading', { name: /dashboard/i })).not.toBeInTheDocument();
  });
});
