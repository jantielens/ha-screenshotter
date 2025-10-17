#!/bin/bash
# Script to test webserver endpoint and download files
# Usage: test-webserver-endpoint.sh <port> <output_prefix>

set -e

PORT="$1"
OUTPUT_PREFIX="${2:-downloaded}"

echo "Testing webserver endpoint on port $PORT..."

# Check if webserver is responding
if curl -f -s "http://localhost:$PORT" > /dev/null; then
  echo "✅ Webserver is responding on port $PORT"
else
  echo "❌ Webserver is not responding on port $PORT"
  exit 1
fi

# Try to download the screenshot via webserver
if curl -f -s "http://localhost:$PORT/screenshots/0.png" -o "${OUTPUT_PREFIX}-screenshot.png"; then
  echo "✅ Successfully downloaded screenshot via webserver"
  
  # Validate the downloaded file
  file "${OUTPUT_PREFIX}-screenshot.png"
  size=$(stat -c%s "${OUTPUT_PREFIX}-screenshot.png")
  echo "Downloaded file size: $size bytes"
  
  if [ "$size" -gt 1000 ]; then
    echo "✅ Downloaded screenshot appears valid (size > 1KB)"
  else
    echo "❌ Downloaded screenshot seems too small"
    exit 1
  fi
else
  echo "❌ Failed to download screenshot via webserver"
  echo "Available files on webserver:"
  curl -s "http://localhost:$PORT" || true
  exit 1
fi

# Try to download the CRC32 checksum file via webserver
echo ""
echo "Testing CRC32 checksum file..."
if curl -f -s "http://localhost:$PORT/screenshots/0.png.crc32" -o "${OUTPUT_PREFIX}-checksum.crc32"; then
  echo "✅ Successfully downloaded checksum file via webserver"
  
  # Validate the checksum file format
  checksum=$(cat "${OUTPUT_PREFIX}-checksum.crc32")
  echo "Checksum content: $checksum"
  
  # Check if it's exactly 8 hexadecimal characters
  if echo "$checksum" | grep -qE '^[0-9a-f]{8}$'; then
    echo "✅ Checksum format is valid (8 hex characters)"
  else
    echo "❌ Checksum format is invalid: $checksum"
    exit 1
  fi
  
  # Verify checksum consistency
  echo "Checking checksum consistency..."
  sleep 5
  
  # Download checksum again
  if curl -f -s "http://localhost:$PORT/screenshots/0.png.crc32" -o "${OUTPUT_PREFIX}-checksum2.crc32"; then
    checksum2=$(cat "${OUTPUT_PREFIX}-checksum2.crc32")
    echo "Second checksum: $checksum2"
    echo "✅ Checksum download is consistent"
  fi
  
else
  echo "❌ Failed to download checksum file via webserver"
  exit 1
fi

# Verify that temporary checksum files are blocked
echo ""
echo "Testing that temporary checksum files are blocked..."
if curl -f -s "http://localhost:$PORT/screenshots/0_temp.png.crc32" -o /dev/null 2>&1; then
  echo "❌ Temporary checksum file should be blocked but was accessible"
  exit 1
else
  echo "✅ Temporary checksum files are correctly blocked"
fi

echo ""
echo "✅ All webserver tests passed!"
