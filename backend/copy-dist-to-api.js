/**
 * Copies the compiled NestJS output (backend/dist) into the /api/dist directory
 * so that Vercel's Serverless Function at api/index.js can require('./dist/serverless')
 * from the same directory, without any cross-directory path guessing.
 */
const fs = require('fs');
const path = require('path');

const backendRoot = __dirname;
const projectRoot = path.join(__dirname, '..');
const distSrc = path.join(backendRoot, 'dist');
const destApi = path.join(projectRoot, 'api', 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(distSrc)) {
  console.error('ERROR: backend/dist not found. Run npm run build first.');
  process.exit(1);
}

// Clean destination before copying to avoid stale files
if (fs.existsSync(destApi)) {
  fs.rmSync(destApi, { recursive: true, force: true });
}

console.log(`Copying ${distSrc} → ${destApi}`);
// Copy the contents of backend/dist directly into api/dist
// so that api/dist/serverless.js exists (not api/dist/dist/serverless.js)
copyDir(distSrc, destApi);
console.log('✓ dist copied to api/dist successfully');
console.log(`   Verifying: api/dist/serverless.js exists = ${fs.existsSync(path.join(destApi, 'serverless.js'))}`);
