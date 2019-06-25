// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  globalSetup: './tests/puppeteer_setup.js',
  globalTeardown: './tests/puppeteer_teardown.js',
  testEnvironment: './tests/puppeteer_environment.js',
  clearMocks: true,
  coverageDirectory: "coverage"
};
