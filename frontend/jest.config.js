export default {
  displayName: 'Employee Recommendation Frontend',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
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
    './src/components/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/contexts/': {
      statements: 80,
      branches: 60,
      functions: 80,
      lines: 80,
    },
  },
  coveragePathIgnorePatterns: [
  '/node_modules/',
  'src/main.jsx',
  'src/App.jsx',
  'src/AdminApp.jsx',
  'src/EmployeeApp.jsx',
  'src/HRApp.jsx',
  'src/ManagerApp.jsx',
  'src/services/api.js',
  'src/hooks/useAuth.js',
  'src/components/accessibility/AccessibilityWidget.jsx',
],
};