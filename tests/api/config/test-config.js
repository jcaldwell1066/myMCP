/**
 * Test Configuration
 * Central configuration for all test environments and settings
 */

const environments = {
  development: {
    baseUrl: 'http://localhost:3000',
    timeout: 10000,
    retries: 3,
    verbose: true,
    cleanupBetweenTests: true
  },
  
  staging: {
    baseUrl: 'http://staging.mymcp.example.com',
    timeout: 15000,
    retries: 5,
    verbose: false,
    cleanupBetweenTests: true
  },
  
  production: {
    baseUrl: 'http://api.mymcp.example.com',
    timeout: 20000,
    retries: 5,
    verbose: false,
    cleanupBetweenTests: false // Don't cleanup production data
  }
};

const testCategories = {
  unit: {
    timeout: 5000,
    parallel: true,
    stopOnFailure: false
  },
  
  integration: {
    timeout: 15000,
    parallel: false,
    stopOnFailure: false
  },
  
  e2e: {
    timeout: 30000,
    parallel: false,
    stopOnFailure: true
  },
  
  smoke: {
    timeout: 3000,
    parallel: false,
    stopOnFailure: true
  }
};

function getConfig(environment = 'development', category = 'unit') {
  const env = environments[environment] || environments.development;
  const cat = testCategories[category] || testCategories.unit;
  
  return {
    ...env,
    ...cat,
    environment,
    category
  };
}

module.exports = {
  environments,
  testCategories,
  getConfig
};
