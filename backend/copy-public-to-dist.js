const fs = require('fs');
const path = require('path');

// Directories
const publicDir = path.join(__dirname, 'public');
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
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${file}`);
    }
  });
}

// Copy public folder to dist/public
if (fs.existsSync(publicDir)) {
  console.log('Copying public folder to dist...');
  copyDir(publicDir, distPublicDir);
  console.log('✓ Public files ready for deployment');
} else {
  console.warn('⚠ Public folder not found');
}
