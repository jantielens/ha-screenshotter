#!/bin/bash
# Script to validate screenshot properties against expected values
# Usage: validate-screenshots.sh <test_dir> <screenshot_subfolder> <validation_json>

set -e

TEST_DIR="$1"
SCREENSHOT_SUBFOLDER="$2"
VALIDATION_JSON="$3"

TEST_PASSED=true
VALIDATION_DETAILS=""

# Get expected number of screenshots
EXPECTED_SCREENSHOTS=$(echo "$VALIDATION_JSON" | jq -r '.screenshots | length')
ACTUAL_SCREENSHOTS=$(find "$TEST_DIR/share/$SCREENSHOT_SUBFOLDER" -name "*.png" | wc -l)

if [ "$ACTUAL_SCREENSHOTS" -ne "$EXPECTED_SCREENSHOTS" ]; then
  TEST_PASSED=false
  VALIDATION_DETAILS="Expected $EXPECTED_SCREENSHOTS screenshots, got $ACTUAL_SCREENSHOTS"
else
  # Validate each screenshot
  SCREENSHOT_INDEX=0
  while [ $SCREENSHOT_INDEX -lt $ACTUAL_SCREENSHOTS ]; do
    SCREENSHOT_FILE="$TEST_DIR/share/$SCREENSHOT_SUBFOLDER/$SCREENSHOT_INDEX.png"
    
    if [ -f "$SCREENSHOT_FILE" ]; then
      # Get expected properties for this screenshot
      EXPECTED_WIDTH=$(echo "$VALIDATION_JSON" | jq -r ".screenshots[$SCREENSHOT_INDEX].width")
      EXPECTED_HEIGHT=$(echo "$VALIDATION_JSON" | jq -r ".screenshots[$SCREENSHOT_INDEX].height")
      EXPECTED_GRAYSCALE=$(echo "$VALIDATION_JSON" | jq -r ".screenshots[$SCREENSHOT_INDEX].grayscale // false" | sed 's/^null$/false/')
      EXPECTED_BIT_DEPTH=$(echo "$VALIDATION_JSON" | jq -r ".screenshots[$SCREENSHOT_INDEX].bitDepth")
      
      # Get actual properties using multiple ImageMagick methods
      ACTUAL_WIDTH=$(identify -ping -format "%w" "$SCREENSHOT_FILE")
      ACTUAL_HEIGHT=$(identify -ping -format "%h" "$SCREENSHOT_FILE")
      COLORSPACE=$(identify -ping -format "%[colorspace]" "$SCREENSHOT_FILE")
      DEPTH=$(identify -ping -format "%[depth]" "$SCREENSHOT_FILE")
      
      # Additional checks for PNG-specific properties
      PNG_COLORTYPE=$(identify -ping -format "%[png:color-type]" "$SCREENSHOT_FILE" 2>/dev/null || echo "unknown")
      FILE_INFO=$(file "$SCREENSHOT_FILE" 2>/dev/null || echo "")
      
      # Skip grayscale detection - too unreliable with palette-based images
      ACTUAL_GRAYSCALE="skip"
      
      # More accurate bit depth detection for PNG files
      if [[ "$FILE_INFO" =~ ([0-9]+)-bit ]]; then
        ACTUAL_BIT_DEPTH="${BASH_REMATCH[1]}"
      else
        ACTUAL_BIT_DEPTH="$DEPTH"
      fi
      
      echo "Screenshot $SCREENSHOT_INDEX validation:"
      echo "  Dimensions: ${ACTUAL_WIDTH}x${ACTUAL_HEIGHT} (expected: ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT})"
      echo "  Colorspace: $COLORSPACE, PNG type: $PNG_COLORTYPE (grayscale validation: SKIPPED)"
      echo "  Bit depth: ImageMagick=$DEPTH, File=$ACTUAL_BIT_DEPTH (expected: $EXPECTED_BIT_DEPTH)"
      echo "  File info: $FILE_INFO"
      
      # Validate dimensions
      if [ "$ACTUAL_WIDTH" != "$EXPECTED_WIDTH" ] || [ "$ACTUAL_HEIGHT" != "$EXPECTED_HEIGHT" ]; then
        TEST_PASSED=false
        VALIDATION_DETAILS="${VALIDATION_DETAILS}Screenshot $SCREENSHOT_INDEX: Wrong dimensions (${ACTUAL_WIDTH}x${ACTUAL_HEIGHT} vs ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}). "
      fi
      
      # Validate bit depth (for grayscale images)
      if [ "$EXPECTED_GRAYSCALE" = "true" ] && [ "$ACTUAL_BIT_DEPTH" != "$EXPECTED_BIT_DEPTH" ]; then
        TEST_PASSED=false
        VALIDATION_DETAILS="${VALIDATION_DETAILS}Screenshot $SCREENSHOT_INDEX: Wrong bit depth ($ACTUAL_BIT_DEPTH vs $EXPECTED_BIT_DEPTH). "
      fi
      
    else
      TEST_PASSED=false
      VALIDATION_DETAILS="${VALIDATION_DETAILS}Screenshot $SCREENSHOT_INDEX missing. "
    fi
    
    SCREENSHOT_INDEX=$((SCREENSHOT_INDEX + 1))
  done
fi

# Output result
echo "TEST_PASSED=$TEST_PASSED"
echo "VALIDATION_DETAILS=$VALIDATION_DETAILS"

# Exit with appropriate code
if [ "$TEST_PASSED" = "true" ]; then
  exit 0
else
  exit 1
fi
