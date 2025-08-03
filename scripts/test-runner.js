#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');
const isCoverage = args.includes('--coverage') || args.includes('-c');
const isVerbose = args.includes('--verbose') || args.includes('-v');
const testPattern = args.find(arg => arg.startsWith('--pattern='))?.split('=')[1];

console.log('🧪 Health Service Test Runner');
console.log('===============================\n');

// Test categories
const testCategories = {
  unit: 'src/**/*.test.{ts,tsx}',
  integration: 'src/**/*.integration.test.{ts,tsx}',
  e2e: 'src/**/*.e2e.test.{ts,tsx}',
  all: 'src/**/*.{test,spec}.{ts,tsx}',
};

// Build test command
let testCommand = 'npx vitest';

if (isWatch) {
  testCommand += ' --watch';
}

if (isCoverage) {
  testCommand += ' --coverage';
}

if (isVerbose) {
  testCommand += ' --verbose';
}

// Add test pattern
if (testPattern && testCategories[testPattern]) {
  testCommand += ` "${testCategories[testPattern]}"`;
} else if (testPattern) {
  testCommand += ` "${testPattern}"`;
} else {
  testCommand += ` "${testCategories.all}"`;
}

console.log(`Running: ${testCommand}\n`);

try {
  // Run tests
  execSync(testCommand, { 
    stdio: 'inherit', 
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  console.log('\n✅ All tests completed successfully!');
  
  // Generate test report if coverage was requested
  if (isCoverage) {
    console.log('\n📊 Coverage report generated in ./coverage directory');
  }
  
} catch (error) {
  console.error('\n❌ Tests failed!');
  process.exit(1);
}

// Display help information
function showHelp() {
  console.log(`
Usage: npm run test [options] [pattern]

Options:
  --watch, -w      Run tests in watch mode
  --coverage, -c   Generate coverage report
  --verbose, -v    Run tests with verbose output
  --pattern=<name> Run specific test category or pattern

Test Categories:
  unit        Run only unit tests
  integration Run only integration tests
  e2e         Run only end-to-end tests
  all         Run all tests (default)

Examples:
  npm run test                     # Run all tests once
  npm run test -- --watch          # Run all tests in watch mode
  npm run test -- --coverage       # Run tests with coverage
  npm run test -- --pattern=unit   # Run only unit tests
  npm run test -- --pattern="**/*Dashboard*" # Run Dashboard tests only

Test Structure:
  📁 src/
    📁 components/
      📁 Layout/
        📁 __tests__/
          📄 Layout.test.tsx
    📁 pages/
      📁 Dashboard/
        📁 __tests__/
          📄 Dashboard.test.tsx
      📁 Patients/
        📁 __tests__/
          📄 Patients.test.tsx
      📁 Forms/
        📁 __tests__/
          📄 Forms.test.tsx
      📁 Studies/
        📁 __tests__/
          📄 StudyList.test.tsx
      📁 Chat/
        📁 __tests__/
          📄 AIChat.test.tsx
    📁 store/
      📁 __tests__/
        📄 authStore.test.ts
    📁 utils/
      📁 __tests__/
        📄 test-utils.test.tsx
    📁 __tests__/
      📁 integration/
        📄 App.integration.test.tsx

Available npm scripts:
  npm run test              # Run all tests
  npm run test:unit         # Run unit tests only
  npm run test:integration  # Run integration tests only
  npm run test:watch        # Run tests in watch mode
  npm run test:coverage     # Run tests with coverage
  npm run test:ci           # Run tests for CI (no watch, with coverage)
`);
}

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
}
