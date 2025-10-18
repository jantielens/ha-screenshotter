# Home Assistant Text Extraction Analysis & Solution

## Problem Summary

The SimHash text-based checksum feature was failing to extract any text from Home Assistant Lovelace dashboards, showing:
```
⚠️  No visible text found on page
💡 Debug: Extracted text length: 0, preview: "(empty)"
```

## Root Causes

### 1. **Deep Shadow DOM Nesting**
Home Assistant uses a deeply nested web component architecture:
```
<home-assistant>
  #shadow-root (open)
    <home-assistant-main>
      #shadow-root (open)
        <partial-panel-resolver>
          #shadow-root (open)
            <ha-panel-lovelace>
              #shadow-root (open)
                <hui-root>
                  #shadow-root (open)
                    <hui-view>
                      #shadow-root (open)
                        <hui-card>
                          #shadow-root (open)
                            [Actual dashboard content with text]
```

The old code traversed shadow roots, but had several issues preventing it from working with HA dashboards.

### 2. **Timing Issues**
The previous implementation:
- Waited only 1 second after `networkidle2`
- Didn't account for Home Assistant's lazy loading of dashboard cards
- Didn't wait for WebSocket-based content updates (which don't trigger network events)

Home Assistant dashboards load in phases:
1. Initial HTML and core app (~1s)
2. WebSocket connection and authentication (~1-2s)
3. Dashboard configuration loading (~1-2s)
4. Individual card component loading (~1-3s)

**Total time needed: 4-8 seconds**

### 3. **Visibility Detection Issues**
The old `isElementVisible()` function had problems:
- **Opacity check**: Used string comparison (`style.opacity === '0'`) instead of numeric comparison
- **Bounding box**: Didn't check if elements had zero size (important for HA container elements)
- **Web component slots**: Didn't properly handle slotted content visibility

### 4. **Missing Element Deduplication**
The walk function could visit the same element multiple times through different paths (light DOM vs shadow DOM), potentially causing:
- Infinite loops in complex shadow trees
- Duplicate text extraction
- Performance issues

### 5. **Insufficient Depth Limiting**
No depth limit meant potential stack overflow in deeply nested structures.

## Solution Implemented

### New `textExtractor.js` Module

Created a dedicated text extraction utility with the following improvements:

#### 1. **Home Assistant Detection & Wait Strategy**
```javascript
// Detect if this is a Home Assistant page
const isHA = await page.evaluate(() => {
  return !!(document.querySelector('home-assistant') || 
            document.querySelector('ha-panel-lovelace'));
});

if (isHA) {
  // Wait for hui-view (the actual dashboard content container)
  await page.waitForSelector('hui-view', { timeout: 5000 });
  
  // Additional wait for lazy-loaded cards
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

**Result**: 3-5 second wait for HA dashboards specifically, allowing all components to load.

#### 2. **Enhanced Visibility Detection**
```javascript
const isElementVisible = (element) => {
  // ... existing checks ...
  
  // NEW: Numeric opacity check
  if (parseFloat(style.opacity) === 0) return false;
  
  // NEW: Bounding box check for zero-size containers
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    // Only skip if this is a leaf element
    if (el.childNodes.length === 0 && !el.shadowRoot) {
      return false;
    }
  }
};
```

**Result**: Properly detects visible content inside invisible containers (common in HA).

#### 3. **Element Deduplication**
```javascript
const visitedElements = new WeakSet();

const walk = (node, depth = 0) => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    // Prevent visiting the same element twice
    if (visitedElements.has(element)) return;
    visitedElements.add(element);
    // ... rest of walk logic ...
  }
};
```

**Result**: No duplicate processing, no infinite loops.

#### 4. **Depth Limiting**
```javascript
const walk = (node, depth = 0) => {
  if (depth > 50) return; // Prevent stack overflow
  // ... rest of walk logic ...
};
```

**Result**: Safe processing of even the deepest shadow DOM trees.

#### 5. **Debug Metadata**
```javascript
return JSON.stringify({
  text: chunks.join('\n'),
  metadata: {
    textNodeCount,      // How many text nodes found
    shadowRootCount,    // How many shadow roots traversed
    chunkCount          // How many text chunks extracted
  }
});
```

**Result**: Better diagnostics for troubleshooting extraction issues.

## Testing

### Manual Testing Script

Created `test-ha-text-extraction.js` to diagnose issues:

```bash
# Set your Home Assistant details
export HA_URL="http://homeassistant.local:8123/lovelace/dashboard"
export HA_TOKEN="your-long-lived-token"

# Run the diagnostic
node test-ha-text-extraction.js
```

This will:
1. Connect to your HA instance
2. Analyze the DOM structure
3. Show shadow root hierarchy
4. Test text extraction
5. Generate debug screenshot and HTML snapshot

### Debug Script

Created `debug-ha-dom.js` that can be run in browser console:

```javascript
// In browser console on HA dashboard:
analyzeHADashboard();
```

Shows:
- DOM element counts
- Shadow root detection
- Text extraction test results
- Closed vs open shadow root analysis

## Usage

The text extraction is automatically used when `use_text_based_crc32: true` is configured:

```yaml
urls:
  - url: http://homeassistant.local:8123/lovelace/dashboard
    use_text_based_crc32: true
```

## Expected Results

**Before:**
```
📝 Extracting visible text for SimHash checksum...
⚠️  No visible text found on page
💡 Debug: Extracted text length: 0, preview: "(empty)"
```

**After:**
```
📝 Extracting visible text for SimHash checksum...
🏠 Detected Home Assistant dashboard, waiting for components...
✅ Home Assistant components loaded
📊 Extraction stats: 247 text nodes, 12 shadow roots, 247 chunks
✅ Extracted 3,456 characters of visible text
📄 Text preview: "Home Kitchen Temperature 21.5°C Humidity 45% Living Room..."
```

## Performance Considerations

- **Wait time**: Added 2-5 seconds specifically for HA dashboards
- **Memory**: WeakSet for visited elements prevents memory leaks
- **CPU**: Depth limiting prevents excessive recursion
- **Timeout**: Maximum 10 seconds for text extraction (configurable)

## Future Improvements

1. **Closed Shadow Root Handling**: Currently cannot access closed shadow roots (HA uses open, so not an issue)
2. **Dynamic Content Updates**: Could add mutation observer to detect when new cards are added
3. **Configurable Wait Time**: Allow per-URL configuration of HA wait time
4. **Smart Waiting**: Instead of fixed timeout, wait for specific HA events (e.g., `fully-loaded` event)

## Related Files

- `src/textExtractor.js` - New dedicated text extraction module
- `src/screenshotter.js` - Updated to use new extractor
- `test-ha-text-extraction.js` - Diagnostic test script
- `debug-ha-dom.js` - Browser console debugging tool

## References

- Home Assistant Frontend Architecture: https://developers.home-assistant.io/docs/frontend
- Shadow DOM: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM
- Web Components: https://developer.mozilla.org/en-US/docs/Web/Web_Components
