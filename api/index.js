require('reflect-metadata');
const path = require('path');
const fs = require('fs');

// When deployed via Vercel with root = project root:
//   - This file lives at /var/task/api/index.js
//   - build runs: cd backend && npm run build  (outputs to backend/dist/)
//   - copy-dist-to-api.js copies backend/dist/ → api/dist/
//   - includeFiles: "api/dist/**" bundles into /var/task/api/dist/
//   - So the compiled module is at /var/task/api/dist/serverless.js
//   - From __dirname (/var/task/api), that's ./dist/serverless.js

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
  let apiContents = [];
  let distContents = [];
  try { apiContents = fs.readdirSync(__dirname); } catch (_) {}
  try { distContents = fs.readdirSync(path.join(__dirname, 'dist')); } catch (_) {}

  handler = (req, res) => {
    res.status(500).json({
      statusCode: 500,
      error: 'Module Not Found',
      expected: localDist,
      apiDir: apiContents,
      distDir: distContents,
      cwd: process.cwd(),
    });
  };
}

module.exports = handler;
