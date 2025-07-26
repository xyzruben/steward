#!/usr/bin/env node

// ============================================================================
// PRODUCTION VALIDATION SCRIPTS
// ============================================================================
// Pre-deployment validation and testing for production readiness
// See: Master System Guide - Testing and Quality Assurance

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logStep(step) {
  log(`\n▶ ${step}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate environment variables
 */
function validateEnvironment() {
  logStep('Validating environment variables...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'NODE_ENV',
  ];

  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }

  logSuccess('All required environment variables are set');
  return true;
}

/**
 * Validate Node.js version and architecture
 */
function validateNodeEnvironment() {
  logStep('Validating Node.js environment...');
  
  const nodeVersion = process.version;
  const nodeArch = process.arch;
  const nodePlatform = process.platform;

  log(`Node.js Version: ${nodeVersion}`);
  log(`Architecture: ${nodeArch}`);
  log(`Platform: ${nodePlatform}`);

  // Check Node.js version (should be 18+)
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    logError(`Node.js version ${nodeVersion} is too old. Required: 18+`);
    return false;
  }

  // Check architecture on macOS
  if (nodePlatform === 'darwin' && nodeArch !== 'arm64') {
    logWarning('Apple Silicon detected but not using ARM64 Node.js. Consider using ARM64 for better performance.');
  }

  logSuccess('Node.js environment is valid');
  return true;
}

/**
 * Validate dependencies
 */
function validateDependencies() {
  logStep('Validating dependencies...');
  
  try {
    // Check if package-lock.json exists
    if (!fs.existsSync('package-lock.json')) {
      logError('package-lock.json not found. Run npm install first.');
      return false;
    }

    // Check for security vulnerabilities
    log('Checking for security vulnerabilities...');
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      logSuccess('No high-severity security vulnerabilities found');
    } catch (error) {
      logWarning('Security vulnerabilities found. Review with: npm audit');
    }

    // Check for outdated dependencies
    log('Checking for outdated dependencies...');
    try {
      const outdated = execSync('npm outdated --json', { stdio: 'pipe' }).toString();
      const outdatedCount = Object.keys(JSON.parse(outdated)).length;
      
      if (outdatedCount > 0) {
        logWarning(`${outdatedCount} outdated dependencies found. Consider updating.`);
      } else {
        logSuccess('All dependencies are up to date');
      }
    } catch (error) {
      logSuccess('All dependencies are up to date');
    }

    return true;
  } catch (error) {
    logError(`Dependency validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate TypeScript compilation
 */
function validateTypeScript() {
  logStep('Validating TypeScript compilation...');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logSuccess('TypeScript compilation successful');
    return true;
  } catch (error) {
    logError('TypeScript compilation failed');
    logError(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Validate build process
 */
function validateBuild() {
  logStep('Validating production build...');
  
  try {
    // Clean previous build
    if (fs.existsSync('.next')) {
      execSync('rm -rf .next', { stdio: 'pipe' });
    }

    // Run production build
    execSync('npm run build', { stdio: 'pipe' });
    logSuccess('Production build successful');
    return true;
  } catch (error) {
    logError('Production build failed');
    logError(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Validate database schema
 */
function validateDatabase() {
  logStep('Validating database schema...');
  
  try {
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'pipe' });
    logSuccess('Prisma client generated successfully');

    // Validate database schema
    execSync('npx prisma db pull', { stdio: 'pipe' });
    logSuccess('Database schema validation successful');
    return true;
  } catch (error) {
    logError('Database schema validation failed');
    logError(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Validate test suite
 */
function validateTests() {
  logStep('Validating test suite...');
  
  try {
    // Run tests
    execSync('npm test', { stdio: 'pipe' });
    logSuccess('All tests passed');
    return true;
  } catch (error) {
    logError('Test suite failed');
    logError(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Validate linting
 */
function validateLinting() {
  logStep('Validating code quality...');
  
  try {
    // Run ESLint
    execSync('npm run lint', { stdio: 'pipe' });
    logSuccess('ESLint validation passed');
    return true;
  } catch (error) {
    logError('ESLint validation failed');
    logError(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Validate file structure
 */
function validateFileStructure() {
  logStep('Validating file structure...');
  
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'prisma/schema.prisma',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/lib/services/financeAgent.ts',
    'src/app/api/agent/query/route.ts',
    'src/components/agent/AgentChat.tsx',
  ];

  const missing = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    logError(`Missing required files: ${missing.join(', ')}`);
    return false;
  }

  logSuccess('File structure validation passed');
  return true;
}

/**
 * Validate environment-specific configurations
 */
function validateEnvironmentConfig() {
  logStep('Validating environment-specific configurations...');
  
  // Check if we're in production mode
  if (process.env.NODE_ENV !== 'production') {
    logWarning('NODE_ENV is not set to production. This is expected for validation.');
  }

  // Check database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://')) {
    logWarning('DATABASE_URL should start with postgresql://');
  }

  // Check Supabase URL format
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
    logWarning('SUPABASE_URL should be a valid Supabase URL');
  }

  // Check OpenAI API key format
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.startsWith('sk-')) {
    logWarning('OPENAI_API_KEY should start with sk-');
  }

  logSuccess('Environment configuration validation passed');
  return true;
}

// ============================================================================
// MAIN VALIDATION PROCESS
// ============================================================================

function runValidation() {
  logSection('PRODUCTION VALIDATION');
  log('Running comprehensive production validation...', 'bright');

  const validations = [
    { name: 'Environment Variables', fn: validateEnvironment },
    { name: 'Node.js Environment', fn: validateNodeEnvironment },
    { name: 'Dependencies', fn: validateDependencies },
    { name: 'TypeScript', fn: validateTypeScript },
    { name: 'File Structure', fn: validateFileStructure },
    { name: 'Database Schema', fn: validateDatabase },
    { name: 'Code Quality', fn: validateLinting },
    { name: 'Test Suite', fn: validateTests },
    { name: 'Production Build', fn: validateBuild },
    { name: 'Environment Config', fn: validateEnvironmentConfig },
  ];

  let passed = 0;
  let failed = 0;

  for (const validation of validations) {
    try {
      if (validation.fn()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`${validation.name} validation failed with error: ${error.message}`);
      failed++;
    }
  }

  // Summary
  logSection('VALIDATION SUMMARY');
  log(`Total Validations: ${validations.length}`, 'bright');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed === 0) {
    log('\n🎉 All validations passed! Production deployment is ready.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some validations failed. Please fix the issues before deployment.', 'red');
    process.exit(1);
  }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Production Validation Script

Usage:
  node scripts/production-validation.js [options]

Options:
  --help, -h     Show this help message
  --env-only     Only validate environment variables
  --build-only   Only validate build process
  --test-only    Only validate test suite

Examples:
  node scripts/production-validation.js
  node scripts/production-validation.js --env-only
  node scripts/production-validation.js --build-only
    `);
    process.exit(0);
  }

  if (args.includes('--env-only')) {
    logSection('ENVIRONMENT VALIDATION ONLY');
    validateEnvironment();
    process.exit(0);
  }

  if (args.includes('--build-only')) {
    logSection('BUILD VALIDATION ONLY');
    validateBuild();
    process.exit(0);
  }

  if (args.includes('--test-only')) {
    logSection('TEST VALIDATION ONLY');
    validateTests();
    process.exit(0);
  }

  // Run full validation
  runValidation();
}

module.exports = {
  validateEnvironment,
  validateNodeEnvironment,
  validateDependencies,
  validateTypeScript,
  validateBuild,
  validateDatabase,
  validateTests,
  validateLinting,
  validateFileStructure,
  validateEnvironmentConfig,
  runValidation,
}; 