# 🧪 Comprehensive Unit Testing Guide

## 🎯 **Testing Strategy Overview**

For your Employee Recommendation System, we need to test:
- **Backend (NestJS)**: Controllers, Services, Modules, Guards
- **Frontend (React)**: Components, Hooks, Services, Utils
- **Integration Tests**: API endpoints, Database operations
- **E2E Tests**: User workflows

## 🛠 **Required Testing Tools**

### **Backend Testing Stack**
```bash
# Core testing framework
npm install --save-dev @nestjs/testing @nestjs/cli

# Testing utilities
npm install --save-dev jest @types/jest ts-jest

# Database testing
npm install --save-dev @nestjs/testing @nestjs/mongoose
npm install --save-dev mongodb-memory-server

# HTTP testing
npm install --save-dev supertest @types/supertest

# Mocking and spying
npm install --save-dev jest-mock-extended

# Coverage reporting
npm install --save-dev jest-html-reporters
```

### **Frontend Testing Stack**
```bash
# Testing framework
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event

# Testing utilities
npm install --save-dev jest @types/jest ts-jest

# Component testing
npm install --save-dev @testing-library/dom @testing-library/jest-dom

# Mocking
npm install --save-dev jest-mock-extended

# Coverage and reporting
npm install --save-dev jest-html-reporters @jest/core
```

## 🔧 **Setup Configuration**

### **Backend Jest Configuration**
Create `backend/jest.config.js`:
```javascript
module.exports = {
  displayName: 'Employee Recommendation Backend',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/test/**',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};
```

### **Frontend Jest Configuration**
Create `frontend/jest.config.js`:
```javascript
module.exports = {
  displayName: 'Employee Recommendation Frontend',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 🗂 **Project Structure**

### **Backend Testing Structure**
```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.spec.ts
│   │   └── auth.module.spec.ts
│   ├── users/
│   │   ├── users.controller.spec.ts
│   │   ├── users.service.spec.ts
│   │   └── users.module.spec.ts
│   ├── dashboard/
│   │   ├── dashboard.controller.spec.ts
│   │   ├── dashboard.service.spec.ts
│   │   └── dashboard.module.spec.ts
│   └── test/
│       ├── setup.ts
│       ├── helpers/
│       └── fixtures/
├── test/
│   ├── integration/
│   │   ├── auth.e2e-spec.ts
│   │   ├── users.e2e-spec.ts
│   │   └── dashboard.e2e-spec.ts
│   └── utils/
└── jest.config.js
```

### **Frontend Testing Structure**
```
frontend/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── Dashboard.test.jsx
│   │   │   ├── LoginForm.test.jsx
│   │   │   └── UserProfile.test.jsx
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useAuth.test.js
│   │   │   └── useApi.test.js
│   ├── services/
│   │   ├── __tests__/
│   │   │   └── api.test.js
│   ├── utils/
│   │   ├── __tests__/
│   │   │   └── helpers.test.js
│   ├── setupTests.js
│   └── __tests__/
│       └── App.test.jsx
├── jest.config.js
└── coverage/
```

## 🧪 **Test Examples**

### **Backend Controller Test**
```typescript
// backend/src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'USER',
        },
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'login').mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
```

### **Backend Service Test**
```typescript
// backend/src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'USER',
      };

      const expectedUser = {
        id: '1',
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'create').mockReturnValue(expectedUser as any);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedUser as any);

      const result = await service.create(createUserDto);

      expect(result).toEqual(expectedUser);
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(expectedUser);
    });
  });
});
```

### **Frontend Component Test**
```jsx
// frontend/src/components/__tests__/LoginForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API service
jest.mock('../../services/api', () => ({
  post: jest.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockPost = require('../../services/api').post;
    mockPost.mockResolvedValue({
      data: {
        access_token: 'mock-token',
        user: { id: '1', email: 'test@example.com' },
      },
    });

    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

### **Frontend Hook Test**
```javascript
// frontend/src/hooks/__tests__/useAuth.test.js
import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../useAuth';

// Mock the API service
jest.mock('../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login successfully', async () => {
    const mockPost = require('../../services/api').post;
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        user: { id: '1', email: 'test@example.com' },
      },
    };
    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    expect(result.current.user).toEqual(mockResponse.data.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // First login
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    // Then logout
    await act(async () => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

## 🔄 **Integration Tests**

### **API Integration Test**
```typescript
// backend/test/integration/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        MongooseModule.forRoot(mongoUri),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
```

## 📊 **Coverage Configuration**

### **Package.json Scripts**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --ci --watchAll=false",
    "test:e2e": "jest --config jest.e2e.config.js"
  }
}
```

## 🚀 **How to Run Tests**

### **Backend Tests**
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.controller.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

### **Frontend Tests**
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- LoginForm.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

## 📋 **Testing Best Practices**

### **1. Arrange-Act-Assert Pattern**
```typescript
// Arrange
const mockData = { email: 'test@example.com', password: 'password123' };
jest.spyOn(service, 'login').mockResolvedValue(mockData);

// Act
const result = await controller.login(mockData);

// Assert
expect(result).toEqual(mockData);
```

### **2. Test Naming Conventions**
- **Unit tests**: `should [expected behavior] when [condition]`
- **Integration tests**: `should [expected behavior] when [condition]`
- **E2E tests**: `should [user story] when [condition]`

### **3. Mock Strategy**
- Mock external dependencies (databases, APIs)
- Use test doubles for complex objects
- Avoid mocking the system under test

### **4. Test Coverage Goals**
- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

## 🎯 **Next Steps**

1. **Install testing tools** using the commands above
2. **Create test files** following the structure provided
3. **Write tests** for your existing code
4. **Run tests** and achieve 80% coverage
5. **Add tests to CI/CD** pipeline (already configured)

This comprehensive testing setup will ensure your application is reliable and maintainable! 🚀
