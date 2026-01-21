# FormulaSnap Build Helper Script for Windows

# Create release directory for logs
if (-Not (Test-Path "release")) {
    New-Item -ItemType Directory -Path "release" | Out-Null
}

# Setup log file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "release\build_$timestamp.log"

function Write-Log {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
    $logMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "🚀 Starting FormulaSnap Build Process..." "Cyan"

# Ensure dependencies are installed
if (-Not (Test-Path "node_modules")) {
    Write-Log "📦 Installing dependencies..." "Yellow"
    npm install 2>&1 | Tee-Object -FilePath $logFile -Append
}

# Clean previous builds
Write-Log "🧹 Cleaning previous builds..." "Yellow"
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "dist-electron") { Remove-Item -Recurse -Force "dist-electron" }
# Keep release directory for logs, only clean old builds
Get-ChildItem "release" -Exclude "*.log" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

# Work around electron-builder winCodeSign symlink extraction on Windows.
# If code signing env vars are set globally, electron-builder will try to sign
# and download winCodeSign (which fails without symlink privilege).
Write-Log "?? Disabling code signing env vars for Windows build..." "Yellow"
Remove-Item Env:WIN_CSC_LINK -ErrorAction SilentlyContinue
Remove-Item Env:CSC_LINK -ErrorAction SilentlyContinue
Remove-Item Env:WIN_CSC_NAME -ErrorAction SilentlyContinue
Remove-Item Env:CSC_NAME -ErrorAction SilentlyContinue
Remove-Item Env:WIN_CSC_KEY_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:CSC_KEY_PASSWORD -ErrorAction SilentlyContinue

# Run build
Write-Log "🔨 Building application..." "Yellow"
npm run electron:build 2>&1 | Tee-Object -FilePath $logFile -Append

if ($LASTEXITCODE -eq 0) {
    Write-Log "✅ Build Successful!" "Green"
    Write-Log "📁 Artifacts are in the 'release' directory." "Green"
    Write-Log "📝 Build log saved to: $logFile" "Cyan"
} else {
    Write-Log "❌ Build Failed." "Red"
    Write-Log "📝 Build log saved to: $logFile" "Yellow"
    exit 1
}
