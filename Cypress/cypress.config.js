const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // URL base del frontend Mercapleno (Docker: http://localhost:5173)
    baseUrl: 'http://localhost:5173',

    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    specPattern: 'cypress/e2e/**/*.cy.js',

    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    downloadsFolder: 'cypress/downloads',

    setupNodeEvents(on, config) {
      // event listeners de Node.js
    },
  },
});
