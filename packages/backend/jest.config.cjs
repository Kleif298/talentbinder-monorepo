module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/))(test|spec)\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // Test setup
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}',
    '!src/test/**',
    '!src/index.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Verbose output
  verbose: true,
};