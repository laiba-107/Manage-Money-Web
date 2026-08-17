require('reflect-metadata');
const path = require('path');
const fs = require('fs');

// After the build step, `copy-dist-to-api.js` copies backend/dist/* → api/dist/
// So at runtime in Vercel, /var/task/api/dist/serverless.js exists
const localDist = path.join(__dirname, 'dist', 'serverless.js');

let handler;

if (fs.existsSync(localDist)) {
  try {
    const mod = require(localDist);
    handler = mod.default || mod;
  } catch (err) {
    handler = (req, res) => {
      res.status(500).json({
        statusCode: 500,
        error: 'Serverless Load Error',
        message: err?.message || String(err),
      });
    };
  }
} else {
  // Fallback: list what's actually in the directory for debugging
  let listing = [];
  try {
    listing = fs.readdirSync(__dirname);
  } catch (_) {}

  handler = (req, res) => {
    res.status(500).json({
      statusCode: 500,
      error: 'Module Not Found',
      message: `serverless.js not found at expected path: ${localDist}`,
      apiDirContents: listing,
      cwd: process.cwd(),
    });
  };
}

module.exports = handler;
