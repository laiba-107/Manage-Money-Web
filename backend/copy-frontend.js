const fs = require('fs');
const path = require('path');

// Directories
const sourceDir = path.join(__dirname, '..', 'frontend');
const destDir = path.join(__dirname, 'public');
const distPublicDir = path.join(__dirname, 'dist', 'public');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Files to copy
const filesToCopy = ['index.html', 'app.js', 'styles.css', 'auth_callback.html', 'bg.png'];

filesToCopy.forEach((file) => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file} to public/`);
  } else {
    console.warn(`⚠ Source file not found: ${file}`);
  }
});

console.log('Frontend files copied to public directory');
