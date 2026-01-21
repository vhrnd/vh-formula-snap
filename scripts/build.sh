#!/bin/bash

# FormulaSnap Build Helper Script

# Create release directory for logs
mkdir -p release

# Setup log file
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="release/build_$TIMESTAMP.log"

# Function to log messages
log_message() {
    echo "$1"
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_message "🚀 Starting FormulaSnap Build Process..."

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    log_message "📦 Installing dependencies..."
    npm install 2>&1 | tee -a "$LOG_FILE"
fi

# Clean previous builds
log_message "🧹 Cleaning previous builds..."
rm -rf dist dist-electron
# Keep release directory for logs, only clean old builds
find release -type f ! -name "*.log" -delete 2>/dev/null

# Run build
log_message "🔨 Building application..."
npm run electron:build 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log_message "✅ Build Successful!"
    log_message "📁 Artifacts are in the 'release' directory."
    log_message "📝 Build log saved to: $LOG_FILE"
else
    log_message "❌ Build Failed."
    log_message "📝 Build log saved to: $LOG_FILE"
    exit 1
fi
