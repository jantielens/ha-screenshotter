#!/bin/bash
# Script to generate webserver test summary
# Usage: generate-webserver-summary.sh <port> <output_file> <test_dir> <screenshot_subfolder> <output_prefix>

set -e

PORT="$1"
OUTPUT_FILE="$2"
TEST_DIR="$3"
SCREENSHOT_SUBFOLDER="$4"
OUTPUT_PREFIX="${5:-downloaded}"
CONTAINER_NAME="${6:-ha-screenshotter-webserver}"

echo "| Test Component | Result |" > "$OUTPUT_FILE"
echo "|----------------|--------|" >> "$OUTPUT_FILE"

# Check if container started
if docker ps -a --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
  echo "| Container Startup | ✅ |" >> "$OUTPUT_FILE"
else
  echo "| Container Startup | ❌ Container failed to start |" >> "$OUTPUT_FILE"
fi

# Check if webserver responded
if curl -f -s "http://localhost:$PORT" > /dev/null 2>&1; then
  echo "| Webserver Response | ✅ |" >> "$OUTPUT_FILE"
else
  echo "| Webserver Response | ❌ Webserver not responding |" >> "$OUTPUT_FILE"
fi

# Check if screenshot was downloaded
if [ -f "${OUTPUT_PREFIX}-screenshot.png" ]; then
  SIZE=$(stat -c%s "${OUTPUT_PREFIX}-screenshot.png" 2>/dev/null || echo "0")
  if [ "$SIZE" -gt 1000 ]; then
    echo "| Screenshot Download | ✅ ($SIZE bytes) |" >> "$OUTPUT_FILE"
  else
    echo "| Screenshot Download | ❌ File too small ($SIZE bytes) |" >> "$OUTPUT_FILE"
  fi
else
  echo "| Screenshot Download | ❌ File not found |" >> "$OUTPUT_FILE"
fi

# Check if checksum was downloaded
if [ -f "${OUTPUT_PREFIX}-checksum.crc32" ]; then
  CHECKSUM=$(cat "${OUTPUT_PREFIX}-checksum.crc32" 2>/dev/null || echo "")
  if echo "$CHECKSUM" | grep -qE '^[0-9a-f]{8}$'; then
    echo "| Checksum Download | ✅ ($CHECKSUM) |" >> "$OUTPUT_FILE"
  else
    echo "| Checksum Download | ❌ Invalid format |" >> "$OUTPUT_FILE"
  fi
else
  echo "| Checksum Download | ❌ File not found |" >> "$OUTPUT_FILE"
fi

# Check if temporary files are blocked
if curl -f -s "http://localhost:$PORT/screenshots/0_temp.png.crc32" -o /dev/null 2>&1; then
  echo "| Temp File Blocking | ❌ Temp files accessible |" >> "$OUTPUT_FILE"
else
  echo "| Temp File Blocking | ✅ |" >> "$OUTPUT_FILE"
fi

# Check if screenshots were created in filesystem
SCREENSHOT_COUNT=$(find "$TEST_DIR/share/$SCREENSHOT_SUBFOLDER/" -name "*.png" 2>/dev/null | wc -l)
if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
  echo "| Screenshot Generation | ✅ ($SCREENSHOT_COUNT files) |" >> "$OUTPUT_FILE"
else
  echo "| Screenshot Generation | ❌ No screenshots found |" >> "$OUTPUT_FILE"
fi

# Check if checksum files were created in filesystem
CHECKSUM_COUNT=$(find "$TEST_DIR/share/$SCREENSHOT_SUBFOLDER/" -name "*.crc32" 2>/dev/null | wc -l)
if [ "$CHECKSUM_COUNT" -gt 0 ]; then
  echo "| Checksum Generation | ✅ ($CHECKSUM_COUNT files) |" >> "$OUTPUT_FILE"
else
  echo "| Checksum Generation | ❌ No checksum files found |" >> "$OUTPUT_FILE"
fi

echo ""
echo "## Webserver Test Summary"
cat "$OUTPUT_FILE"
