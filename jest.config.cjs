const { pathsToModuleNameMapper } = require('ts-jest')

const { compilerOptions } = require('./config/tsconfig.app.json');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  silent: false,
  verbose: true,
  clearMocks: true,

  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  coverageReporters: ['lcov', 'text'],

  // setupFilesAfterEnv: ['<rootDir>/test/_setup-client.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],

  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: __dirname,
  }),
  modulePathIgnorePatterns: [
    '<rootDir>/dist/'
  ],
};
