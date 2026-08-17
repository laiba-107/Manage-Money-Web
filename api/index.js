require('reflect-metadata');
const path = require('path');
const fs = require('fs');

let handler;
const errors = [];
const candidates = [
  path.join(__dirname, '..', 'backend', 'dist', 'src', 'serverless.js'),
  path.join(__dirname, '..', 'backend', 'dist', 'src', 'serverless'),
  path.join(__dirname, '..', 'dist', 'src', 'serverless.js'),
  path.join(__dirname, '..', 'dist', 'src', 'serverless'),
  path.join(process.cwd(), 'backend', 'dist', 'src', 'serverless.js'),
  path.join(process.cwd(), 'dist', 'src', 'serverless.js'),
];

for (const candidate of candidates) {
  try {
    if (fs.existsSync(candidate) || fs.existsSync(candidate + '.js')) {
      const mod = require(candidate);
      handler = mod.default || mod;
      if (typeof handler === 'function') {
        break;
      }
    } else {
      errors.push({ candidate, error: 'File does not exist' });
    }
  } catch (err) {
    errors.push({ candidate, error: err?.message || String(err), code: err?.code });
  }
}

if (!handler) {
  handler = (req, res) => {
    res.status(500).json({
      statusCode: 500,
      error: 'Module Resolution Error',
      message: 'Could not load backend serverless module.',
      details: {
        directory: __dirname,
        cwd: process.cwd(),
        errors: errors,
      },
    });
  };
}

module.exports = handler;
