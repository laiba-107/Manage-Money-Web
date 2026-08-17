require('reflect-metadata');
let handler;

try {
  handler = require('../backend/dist/src/serverless').default || require('../backend/dist/src/serverless');
} catch (e) {
  try {
    handler = require('../dist/src/serverless').default || require('../dist/src/serverless');
  } catch (e2) {
    handler = require('../src/serverless').default || require('../src/serverless');
  }
}

module.exports = handler;
