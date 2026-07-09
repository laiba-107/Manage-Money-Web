#!/bin/sh
# Post-build script to copy frontend files to public directory
SOURCE_DIR="../frontend"
DEST_DIR="./public"

# Create public directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Copy frontend files
cp "$SOURCE_DIR/index.html" "$DEST_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/app.js" "$DEST_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/styles.css" "$DEST_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/auth_callback.html" "$DEST_DIR/" 2>/dev/null || true

echo "Frontend files copied to $DEST_DIR"
