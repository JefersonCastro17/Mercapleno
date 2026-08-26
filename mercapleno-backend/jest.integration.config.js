module.exports = {
  displayName: 'integration-real',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tester/integracion'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/tester/integracion/setup-real.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.real.integration.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  maxWorkers: 1,
};
