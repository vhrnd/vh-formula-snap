#!/bin/bash

# Script to generate .icns from icon.png
# Requires macOS (sips and iconutil)

ICON_PNG="build/icon.png"
ICONSET="build/icon.iconset"

if [ ! -f "$ICON_PNG" ]; then
    echo "Error: $ICON_PNG not found."
    exit 1
fi

mkdir -p "$ICONSET"

# Resize to all necessary sizes
sips -s format png -z 16 16     "$ICON_PNG" --out "$ICONSET/icon_16x16.png"
sips -s format png -z 32 32     "$ICON_PNG" --out "$ICONSET/icon_16x16@2x.png"
sips -s format png -z 32 32     "$ICON_PNG" --out "$ICONSET/icon_32x32.png"
sips -s format png -z 64 64     "$ICON_PNG" --out "$ICONSET/icon_32x32@2x.png"
sips -s format png -z 128 128   "$ICON_PNG" --out "$ICONSET/icon_128x128.png"
sips -s format png -z 256 256   "$ICON_PNG" --out "$ICONSET/icon_128x128@2x.png"
sips -s format png -z 256 256   "$ICON_PNG" --out "$ICONSET/icon_256x256.png"
sips -s format png -z 512 512   "$ICON_PNG" --out "$ICONSET/icon_256x256@2x.png"
sips -s format png -z 512 512   "$ICON_PNG" --out "$ICONSET/icon_512x512.png"
sips -s format png -z 1024 1024 "$ICON_PNG" --out "$ICONSET/icon_512x512@2x.png"

# Convert iconset to icns
iconutil -c icns "$ICONSET" -o build/icon.icns

# Clean up
rm -rf "$ICONSET"

echo "✅ build/icon.icns generated successfully."
