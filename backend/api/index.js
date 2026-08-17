require('reflect-metadata');
let handler;

try {
  handler = require('../dist/src/serverless').default || require('../dist/src/serverless');
} catch (e) {
  handler = require('../src/serverless').default || require('../src/serverless');
}

module.exports = handler;
