import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import LoginForm from '../LoginForm';

// Mock the API service
jest.mock('../../services/api', () => ({
  post: jest.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AuthProvider>
  );
};

// Helper to render and return all key elements
const setup = async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm />);
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  return { user, emailInput, passwordInput, submitButton };
};

// Helper to fill and submit the form
const fillAndSubmit = async (user, email, password) => {
  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  await user.clear(emailInput);
  await user.type(emailInput, email);
  await user.clear(passwordInput);
  await user.type(passwordInput, password);
  await user.click(submitButton);
  return { emailInput, passwordInput, submitButton };
};

describe('LoginForm', () => {
  const mockPost = require('../../services/api').post;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', async () => {
    const { emailInput, passwordInput, submitButton } = await setup();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const { user, submitButton } = await setup();
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    const { user } = await setup();
    await fillAndSubmit(user, 'invalid-email', 'password123');
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const { user } = await setup();
    await fillAndSubmit(user, 'test@example.com', '123');
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const { user } = await setup();
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
    await fillAndSubmit(user, 'test@example.com', 'password123');
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows error message on login failure', async () => {
    const { user } = await setup();
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    };
    mockPost.mockRejectedValue(mockError);
    await fillAndSubmit(user, 'test@example.com', 'wrongpassword');
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('displays loading state during submission', async () => {
    const { user, submitButton } = await setup();
    mockPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    await fillAndSubmit(user, 'test@example.com', 'password123');
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button after loading completes', async () => {
    const { user, submitButton } = await setup();
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: { id: '1', email: 'test@example.com' },
      },
    };
    mockPost.mockResolvedValue(mockResponse);
    await fillAndSubmit(user, 'test@example.com', 'password123');
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    const { user } = await setup();
    mockPost.mockRejectedValue(new Error('Network error'));
    await fillAndSubmit(user, 'test@example.com', 'password123');
    await waitFor(() => {
      expect(screen.getByText(/an error occurred. please try again/i)).toBeInTheDocument();
    });
  });

  it('clears error message when user starts typing', async () => {
    const { user, emailInput } = await setup();
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    };
    mockPost.mockRejectedValue(mockError);
    await fillAndSubmit(user, 'test@example.com', 'wrongpassword');
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    await user.clear(emailInput);
    await user.type(emailInput, 'new@example.com');
    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
  });

  it('supports Enter key to submit form', async () => {
    const { user, emailInput, passwordInput } = await setup();
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: { id: '1', email: 'test@example.com' },
      },
    };
    mockPost.mockResolvedValue(mockResponse);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
