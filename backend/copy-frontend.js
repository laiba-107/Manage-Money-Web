const fs = require('fs');
const path = require('path');

// Source directory (single source of truth for frontend assets)
const sourceDir = path.join(__dirname, '..', 'frontend');

// Destination directories
const destinations = [
  {
    label: 'backend/public/',
    dir: path.join(__dirname, 'public'),
    createIfMissing: true,
  },
  {
    label: 'backend/dist/public/',
    dir: path.join(__dirname, 'dist', 'public'),
    createIfMissing: fs.existsSync(path.join(__dirname, 'dist')),
  },
  {
    label: 'api/dist/public/',
    dir: path.join(__dirname, '..', 'api', 'dist', 'public'),
    createIfMissing: fs.existsSync(path.join(__dirname, '..', 'api', 'dist')),
  },
];

// Files to sync
const filesToCopy = ['index.html', 'app.js', 'styles.css', 'bg.png'];

if (!fs.existsSync(sourceDir)) {
  console.error(`✗ Source directory not found: ${sourceDir}`);
  process.exit(1);
}

destinations.forEach(({ label, dir, createIfMissing }) => {
  if (!fs.existsSync(dir)) {
    if (!createIfMissing) {
      console.log(`- Skipped ${label} (build output directory not present)`);
      return;
    }
    fs.mkdirSync(dir, { recursive: true });
  }

  filesToCopy.forEach((file) => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(dir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Copied ${file} to ${label}`);
    } else {
      console.warn(`⚠ Source file not found: ${file}`);
    }
  });
});

console.log('Frontend files synced successfully.');