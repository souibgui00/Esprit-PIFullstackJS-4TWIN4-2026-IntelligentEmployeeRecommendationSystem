module.exports = {
  displayName: 'Employee Recommendation Backend',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
<<<<<<< HEAD
  '^.+\\.(t|j)s$': ['ts-jest', { diagnostics: false }],
},
=======
    '^.+\\.(t|j)s$': 'ts-jest',
  },
>>>>>>> dd895aa (reverting old work)
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'clover'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
<<<<<<< HEAD
};
=======
};
>>>>>>> dd895aa (reverting old work)
