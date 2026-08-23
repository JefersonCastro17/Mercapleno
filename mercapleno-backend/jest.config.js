module.exports = {
  testEnvironment: 'node',
  verbose: true,

  // Busca pruebas en tester/ y src/ (specs de NestJS si los hay)
  roots: ['<rootDir>/tester', '<rootDir>/src'],

  // Extensiones soportadas
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Patrones de archivos de prueba
  testMatch: ['**/*.test.js', '**/*.spec.ts', '**/*.test.ts'],

  // Transformación: solo archivos TypeScript
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Ignorar node_modules
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // -------------------------------------------------------
  // COBERTURA - Configuración para SonarQube
  // -------------------------------------------------------
  // Activar coverage al ejecutar `npm test` o `npm run test:sonar`
  collectCoverage: true,

  // Recoger coverage de TODO el código fuente TypeScript
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',    // Módulos de NestJS (solo configuración)
    '!src/main.ts',           // Entry point (no testeable unitariamente)
    '!src/**/*.dto.ts',       // DTOs (solo definiciones)
    '!src/**/*.d.ts',         // Declaraciones de tipos
    '!src/types/**',          // Tipos globales
  ],

  // Directorio de salida de coverage
  coverageDirectory: './coverage',

  // Formatos: text (consola) + lcov (para SonarQube) + html (para revisión manual)
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // No excluir nada más del coverage path
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],

  // -------------------------------------------------------
  // REPORTES
  // -------------------------------------------------------
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './reports',
        filename: 'jest-report.html',
        expand: true,
      },
    ],
  ],
};
