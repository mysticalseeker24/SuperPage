#!/usr/bin/env node

/**
 * Simple test runner script to verify frontend functionality
 * Run with: node test-runner.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 SuperPage Frontend Test Runner\n');

const runCommand = (command, description) => {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { 
      cwd: __dirname,
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} - PASSED\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`Error: ${error.message}\n`);
    return false;
  }
};

const tests = [
  {
    command: 'npm run lint',
    description: 'ESLint Code Quality Check'
  },
  {
    command: 'npm run build',
    description: 'Production Build Test'
  },
  {
    command: 'npx vitest run --reporter=basic',
    description: 'Unit Tests Execution'
  }
];

let passed = 0;
let total = tests.length;

console.log(`Running ${total} test suites...\n`);

for (const test of tests) {
  if (runCommand(test.command, test.description)) {
    passed++;
  }
}

console.log('📊 Test Results Summary:');
console.log(`✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${total - passed}/${total}`);

if (passed === total) {
  console.log('\n🎉 All tests passed! Frontend is ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please check the output above.');
  process.exit(1);
}
