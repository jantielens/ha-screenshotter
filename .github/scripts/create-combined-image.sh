#!/bin/bash
# Script to create a combined screenshot image from test results
# Usage: create-combined-image.sh <screenshot_subfolder>

set -e

SCREENSHOT_SUBFOLDER="$1"

echo "===================="
echo "CREATING COMBINED SCREENSHOT IMAGE"
echo "===================="

# Find all test directories
TEST_DIRS=($(ls -1d [0-9][0-9][0-9]-* 2>/dev/null | sort))

if [ ${#TEST_DIRS[@]} -eq 0 ]; then
  echo "No test directories found, skipping combined image creation"
  exit 0
fi

echo "Found ${#TEST_DIRS[@]} test directories"

# Create a temporary directory for processing
mkdir -p combined_processing

# Process each test directory to create row images
ROW_IMAGES=()
for TEST_DIR in "${TEST_DIRS[@]}"; do
  echo "Processing $TEST_DIR..."
  
  # Get test name from directory name (remove number prefix)
  TEST_NAME=$(echo "$TEST_DIR" | sed 's/^[0-9][0-9][0-9]-//')
  
  # Check if this test passed by looking in the test summary
  TEST_PASSED=true
  if [ -f test_summary.md ]; then
    if grep -q "| $TEST_NAME | ❌" test_summary.md; then
      TEST_PASSED=false
    fi
  fi
  
  # Skip failed tests
  if [ "$TEST_PASSED" = "false" ]; then
    echo "  Skipping failed test: $TEST_NAME"
    continue
  fi
  
  # Find all screenshots in this test directory
  SCREENSHOTS=($(find "$TEST_DIR/share/$SCREENSHOT_SUBFOLDER" -name "*.png" 2>/dev/null | sort -V))
  
  if [ ${#SCREENSHOTS[@]} -eq 0 ]; then
    echo "  No screenshots found for $TEST_DIR, skipping..."
    continue
  fi
  
  echo "  Found ${#SCREENSHOTS[@]} screenshots"
  
  # Resize all screenshots to a consistent height for better layout and add index numbers
  RESIZED_SCREENSHOTS=()
  ROW_HEIGHT=200
  
  for i in "${!SCREENSHOTS[@]}"; do
    SCREENSHOT="${SCREENSHOTS[$i]}"
    RESIZED_FILE="combined_processing/resized_${TEST_DIR}_${i}.png"
    
    # Get original dimensions
    ORIGINAL_WIDTH=$(identify -ping -format "%w" "$SCREENSHOT")
    ORIGINAL_HEIGHT=$(identify -ping -format "%h" "$SCREENSHOT")
    
    # Calculate new width maintaining aspect ratio
    NEW_WIDTH=$(echo "scale=0; $ORIGINAL_WIDTH * $ROW_HEIGHT / $ORIGINAL_HEIGHT" | bc)
    
    # Resize the image first
    convert "$SCREENSHOT" -resize "${NEW_WIDTH}x${ROW_HEIGHT}!" "temp_resized.png"
    
    # Add red index number in top-right corner
    convert "temp_resized.png" \
            -font DejaVu-Sans-Bold -pointsize 16 -fill red -stroke white -strokewidth 1 \
            -gravity northeast -annotate +5+5 "$i" \
            "$RESIZED_FILE"
    
    # Clean up temp file
    rm -f "temp_resized.png"
    
    RESIZED_SCREENSHOTS+=("$RESIZED_FILE")
  done
  
  # Create a label for this test (make it twice as wide)
  LABEL_FILE="combined_processing/label_${TEST_DIR}.png"
  convert -size 400x${ROW_HEIGHT} xc:white \
          -font DejaVu-Sans -pointsize 10 -fill black \
          -gravity center -annotate +0+0 "$TEST_NAME" \
          "$LABEL_FILE"
  
  # Combine all screenshots in this row horizontally
  ROW_FILE="combined_processing/row_${TEST_DIR}.png"
  convert "$LABEL_FILE" "${RESIZED_SCREENSHOTS[@]}" +append "$ROW_FILE"
  ROW_IMAGES+=("$ROW_FILE")
  
  echo "  Created row image: $ROW_FILE"
done

# Combine all rows vertically to create the final image
if [ ${#ROW_IMAGES[@]} -gt 0 ]; then
  echo "Combining ${#ROW_IMAGES[@]} rows into final image..."
  
  # Create title header
  TITLE_HEIGHT=40
  TOTAL_WIDTH=$(identify -ping -format "%w" "${ROW_IMAGES[0]}")
  convert -size ${TOTAL_WIDTH}x${TITLE_HEIGHT} xc:lightblue \
          -font DejaVu-Sans -pointsize 16 -fill black \
          -gravity center -annotate +0+0 "HA-Screenshotter Test Results - $(date '+%Y-%m-%d %H:%M:%S')" \
          "combined_processing/title.png"
  
  # Combine title and all rows
  convert "combined_processing/title.png" "${ROW_IMAGES[@]}" -append "combined_screenshots.png"
  
  echo "✅ Combined screenshot image created: combined_screenshots.png"
  
  # Get final image dimensions
  FINAL_WIDTH=$(identify -ping -format "%w" "combined_screenshots.png")
  FINAL_HEIGHT=$(identify -ping -format "%h" "combined_screenshots.png")
  FINAL_SIZE=$(stat -c%s "combined_screenshots.png")
  
  echo "Final image dimensions: ${FINAL_WIDTH}x${FINAL_HEIGHT}"
  echo "Final image size: $FINAL_SIZE bytes"
  
  # Create a summary of what's in the combined image
  echo "## Combined Screenshot Summary" > combined_image_summary.md
  echo "" >> combined_image_summary.md
  echo "- **Image dimensions:** ${FINAL_WIDTH}x${FINAL_HEIGHT}" >> combined_image_summary.md
  echo "- **File size:** $(echo "scale=2; $FINAL_SIZE / 1024 / 1024" | bc) MB" >> combined_image_summary.md
  echo "- **Number of test rows:** ${#ROW_IMAGES[@]}" >> combined_image_summary.md
  echo "- **Tests included:**" >> combined_image_summary.md
  
  for TEST_DIR in "${TEST_DIRS[@]}"; do
    TEST_NAME=$(echo "$TEST_DIR" | sed 's/^[0-9][0-9][0-9]-//')
    
    # Check if this test passed
    TEST_PASSED=true
    if [ -f test_summary.md ]; then
      if grep -q "| $TEST_NAME | ❌" test_summary.md; then
        TEST_PASSED=false
      fi
    fi
    
    if [ "$TEST_PASSED" = "true" ]; then
      SCREENSHOT_COUNT=$(find "$TEST_DIR/share/$SCREENSHOT_SUBFOLDER" -name "*.png" 2>/dev/null | wc -l)
      echo "  - $TEST_NAME ($SCREENSHOT_COUNT screenshots)" >> combined_image_summary.md
    fi
  done
  
else
  echo "❌ No row images to combine"
fi

# Cleanup temporary files
rm -rf combined_processing
