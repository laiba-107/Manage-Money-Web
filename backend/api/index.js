require('reflect-metadata');
const path = require('path');

let handler;
const candidates = [
  path.join(__dirname, '..', 'dist', 'src', 'serverless'),
  path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'serverless'),
  '../dist/src/serverless',
];

for (const candidate of candidates) {
  try {
    const mod = require(candidate);
    handler = mod.default || mod;
    if (typeof handler === 'function') {
      break;
    }
  } catch (err) {
    // Try next candidate
  }
}

if (!handler) {
  handler = (req, res) => {
    res.status(500).json({
      statusCode: 500,
      error: 'Module Resolution Error',
      message: 'Could not load backend serverless module.',
      details: `Directory: ${__dirname}, CWD: ${process.cwd()}`,
    });
  };
}

module.exports = handler;
