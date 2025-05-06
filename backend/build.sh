#!/bin/bash

echo "Cleaning dist directory..."
rm -rf dist

echo "Creating dist directory..."
mkdir dist

echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npm run build

echo "Checking if server.js exists..."
if [ -f "dist/server.js" ]; then
    echo "✅ server.js found in dist directory"
    ls -la dist/
else
    echo "❌ server.js not found in dist directory"
    echo "Contents of dist directory:"
    ls -la dist/
fi 