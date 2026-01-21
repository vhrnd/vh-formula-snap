#!/bin/bash

# FormulaSnap Build Helper Script

echo "🚀 Starting FormulaSnap Build Process..."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist dist-electron release

# Run build
echo "🔨 Building application..."
npm run electron:build

if [ $? -eq 0 ]; then
    echo "✅ Build Successful!"
    echo "📁 Artifacts are in the 'release' directory."
else
    echo "❌ Build Failed."
    exit 1
fi
