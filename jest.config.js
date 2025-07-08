const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // ============================================================================
  // JEST CONFIGURATION (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
  // ============================================================================
  
  // Test environment setup
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module resolution and path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock external services (see master guide: Mocking Practices)
    '^@/lib/services/cloudOcr$': '<rootDir>/src/__mocks__/cloudOcr.ts',
    '^@/lib/services/openai$': '<rootDir>/src/__mocks__/openai.ts',
    '^@/lib/supabase$': '<rootDir>/src/__mocks__/supabase.ts',
    // Handle ESM modules that Jest can't process
    '^isows$': '<rootDir>/src/__mocks__/isows.ts',
    '^@supabase/realtime-js$': '<rootDir>/src/__mocks__/supabase-realtime.ts',
  },
  
  // Comprehensive transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase|@supabase/realtime-js|@supabase/supabase-js|@supabase/ssr|@supabase/gotrue-js|@supabase/postgrest-js|@supabase/storage-js|@supabase/functions-js|@supabase/auth-helpers-*|@supabase/auth-ui-*)/)',
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration (see master guide: Unit Testing Strategy)
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/generated/**/*',
    '!src/types/**/*',
  ],
  
  // Coverage thresholds (see master guide: 80% critical paths, 60% overall)
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25,
    },
    './src/lib/services/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    './src/app/api/': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  
  // Test timeout configuration
  testTimeout: 10000,
  
  // Transform configuration for TypeScript with ESM support
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { 
      presets: [
        ['next/babel', {
          'preset-env': {
            targets: {
              node: 'current'
            }
          }
        }]
      ]
    }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
  ],
  
  // Global test setup
  globalSetup: '<rootDir>/jest.global-setup.js',
  
  // Verbose output for debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // ESM module support
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 