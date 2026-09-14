import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^\\../config/firebase$': '<rootDir>/__tests__/mocks/firebase.ts',
    '^\\./config/firebase$': '<rootDir>/__tests__/mocks/firebase.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'utils/**/*.ts',
    'controllers/**/*.ts',
    'middleware/**/*.ts',
    'services/**/*.ts',
    'api/**/*.ts',
  ],
};

export default config;