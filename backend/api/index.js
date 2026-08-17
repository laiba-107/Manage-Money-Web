require('reflect-metadata');
const path = require('path');
const fs = require('fs');

// When deployed via Vercel with root = backend/:
//   - This file lives at /var/task/api/index.js
//   - The build compiles src/serverless.ts → dist/serverless.js
//   - includeFiles: "dist/**" bundles dist/ into /var/task/dist/
//   - So the compiled module is at /var/task/dist/serverless.js
//   - From __dirname (/var/task/api), that's ../dist/serverless.js

const localDist = path.join(__dirname, '..', 'dist', 'serverless.js');

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
  // Debug: show what's actually in the function bundle
  let apiContents = [];
  let distContents = [];
  let rootContents = [];
  try { apiContents = fs.readdirSync(__dirname); } catch (_) {}
  try { distContents = fs.readdirSync(path.join(__dirname, '..', 'dist')); } catch (_) {}
  try { rootContents = fs.readdirSync(path.join(__dirname, '..')); } catch (_) {}

  handler = (req, res) => {
    res.status(500).json({
      statusCode: 500,
      error: 'Module Not Found',
      expected: localDist,
      apiDir: apiContents,
      rootDir: rootContents,
      distDir: distContents,
      cwd: process.cwd(),
    });
  };
}

module.exports = handler;
