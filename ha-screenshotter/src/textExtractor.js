/**
 * Advanced text extraction utility with Home Assistant support
 * Handles deep shadow DOM traversal, lazy loading, and dynamic content
 */

/**
 * Extract visible text from a page, with special handling for Home Assistant
 * @param {Object} page - Puppeteer page object
 * @param {Object} options - Extraction options
 * @returns {Promise<string>} - Extracted text
 */
async function extractVisibleText(page, options = {}) {
  const {
    waitForHA = true,          // Wait for Home Assistant specific elements
    maxWaitTime = 5000,        // Maximum time to wait for content
    debugLogging = false       // Enable debug output
  } = options;
  
  // If this is a Home Assistant page, wait for it to fully render
  if (waitForHA) {
    try {
      // Check if this is a Home Assistant page
      const isHA = await page.evaluate(() => {
        return !!(document.querySelector('home-assistant') || 
                  document.querySelector('ha-panel-lovelace'));
      });
      
      if (isHA && debugLogging) {
        console.log('   │       🏠 Detected Home Assistant dashboard, waiting for components...');
      }
      
      if (isHA) {
        // Wait for Home Assistant to finish initial render
        // Look for hui-view which contains the actual dashboard content
        await Promise.race([
          page.waitForSelector('hui-view', { timeout: 5000 }).catch(() => null),
          page.waitForSelector('ha-panel-lovelace', { timeout: 5000 }).catch(() => null),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        
        // Additional wait for lazy-loaded cards
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (debugLogging) {
          console.log('   │       ✅ Home Assistant components loaded');
        }
      }
    } catch (error) {
      if (debugLogging) {
        console.log(`   │       ⚠️  HA detection failed: ${error.message}`);
      }
    }
  }
  
  // Extract text using the enhanced extraction logic
  try {
    const extractedText = await Promise.race([
      page.evaluate(() => {
        // Enhanced text extraction that handles Home Assistant's complex shadow DOM
        const root = document.body || document.documentElement;
        if (!root) return '';
        
        const skippedTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'META', 'HEAD', 'TITLE', 'LINK']);
        const visitedFragments = new WeakSet();
        const visitedElements = new WeakSet();
        const chunks = [];
        let shadowRootCount = 0;
        let textNodeCount = 0;
        
        /**
         * Quantize RGB color component to 4 bits per channel (16 levels)
         * Reduces sensitivity to minor color fluctuations while preserving major differences
         * @param {number} value - RGB component (0-255)
         * @returns {number} Quantized value (0-255, in steps of 17)
         */
        const quantizeColorComponent = (value) => {
          // Round to nearest multiple of 17 (256/16 ≈ 17)
          // Examples: 0→0, 64→68, 128→136, 192→204, 255→255
          return Math.round(value / 17) * 17;
        };
        
        /**
         * Parse any CSS color format to quantized hex #RRGGBB
         * Handles: rgb(), rgba(), #hex, named colors
         * @param {string} cssColor - Computed CSS color string
         * @returns {string} Quantized hex color (e.g., "#000000")
         */
        const parseAndQuantizeColor = (cssColor) => {
          // Parse rgb/rgba format: "rgb(r, g, b)" or "rgba(r, g, b, a)"
          const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (!match) return '#000000'; // fallback to black
          
          const r = quantizeColorComponent(parseInt(match[1]));
          const g = quantizeColorComponent(parseInt(match[2]));
          const b = quantizeColorComponent(parseInt(match[3]));
          const alpha = match[4] ? parseFloat(match[4]) : 1.0;
          
          // If alpha < 0.1, treat as invisible (use black)
          if (alpha < 0.1) return '#000000';
          
          // Convert to hex
          return '#' + 
            r.toString(16).padStart(2, '0') + 
            g.toString(16).padStart(2, '0') + 
            b.toString(16).padStart(2, '0');
        };
        
        /**
         * Check if an element is visible
         * Enhanced to properly traverse shadow DOM boundaries
         */
        const isElementVisible = (element) => {
          if (!(element instanceof Element)) return false;
          
          let current = element;
          while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) {
              const el = current;
              
              // Check element attributes
              if (el.hidden) return false;
              const ariaHidden = el.getAttribute('aria-hidden');
              if (ariaHidden && ariaHidden !== 'false') return false;
              
              // Check computed styles
              const style = window.getComputedStyle(el);
              if (!style) return false;
              if (style.display === 'none') return false;
              if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
              if (parseFloat(style.opacity) === 0) return false;
              
              // Check if element has any size (important for HA components)
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) {
                // Some containers might have 0 size but contain visible children
                // Only skip if this is a leaf element (no children)
                if (el.childNodes.length === 0 && !el.shadowRoot) {
                  return false;
                }
              }
            }
            
            // Traverse up the tree, crossing shadow boundaries
            const parent = current.parentNode;
            if (parent) {
              current = parent;
              continue;
            }
            
            // If we hit a shadow root boundary, traverse to the host
            if (current instanceof ShadowRoot) {
              current = current.host || null;
            } else {
              current = null;
            }
          }
          
          return true;
        };
        
        /**
         * Walk the DOM tree, including shadow roots
         */
        const walk = (node, depth = 0) => {
          if (!node) return;
          
          // Prevent infinite recursion
          if (depth > 50) return;
          
          // Handle text nodes
          if (node.nodeType === Node.TEXT_NODE) {
            const parent = node.parentElement;
            if (!parent || !isElementVisible(parent)) return;
            
            const text = node.textContent ? node.textContent.replace(/\s+/g, ' ').trim() : '';
            if (text && text.length > 0) {
              // Get computed text color from parent element
              let textColor = '#000000'; // default to black
              try {
                const computedStyle = window.getComputedStyle(parent);
                if (computedStyle && computedStyle.color) {
                  textColor = parseAndQuantizeColor(computedStyle.color);
                }
              } catch (e) {
                // If color extraction fails, use default black
              }
              
              // Store text with color annotation: "text::#rrggbb"
              chunks.push(`${text}::${textColor}`);
              textNodeCount++;
            }
            return;
          }
          
          // Handle element nodes
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            
            // Skip already visited elements to prevent loops
            if (visitedElements.has(element)) return;
            visitedElements.add(element);
            
            // Skip certain tags
            if (skippedTags.has(element.tagName)) return;
            
            // Skip invisible elements (but check first to avoid unnecessary traversal)
            if (!isElementVisible(element)) return;
            
            // Handle slot elements (important for web components)
            if (element.tagName === 'SLOT' && typeof element.assignedNodes === 'function') {
              const assigned = element.assignedNodes({ flatten: true });
              if (assigned && assigned.length > 0) {
                for (const assignedNode of assigned) {
                  walk(assignedNode, depth + 1);
                }
                // Don't process slot's children if it has assigned nodes
                return;
              }
            }
            
            // Process child nodes first
            for (const child of element.childNodes) {
              walk(child, depth + 1);
            }
            
            // Process shadow root if it exists and hasn't been visited
            if (element.shadowRoot && !visitedFragments.has(element.shadowRoot)) {
              visitedFragments.add(element.shadowRoot);
              shadowRootCount++;
              
              // Walk the shadow root
              for (const child of element.shadowRoot.childNodes) {
                walk(child, depth + 1);
              }
            }
            
            return;
          }
          
          // Handle document fragments and document nodes
          if ((node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_NODE) && 
              !visitedFragments.has(node)) {
            visitedFragments.add(node);
            for (const child of node.childNodes) {
              walk(child, depth + 1);
            }
          }
        };
        
        // Start the walk from the root
        walk(root);
        
        // Return both the text and metadata
        return JSON.stringify({
          text: chunks.join('\n'),
          metadata: {
            textNodeCount,
            shadowRootCount,
            chunkCount: chunks.length
          }
        });
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Text extraction timeout')), maxWaitTime)
      )
    ]);
    
    // Parse the result
    const result = JSON.parse(extractedText);
    
    if (debugLogging) {
      console.log(`   │       📊 Extraction stats: ${result.metadata.textNodeCount} text nodes, ${result.metadata.shadowRootCount} shadow roots, ${result.metadata.chunkCount} chunks`);
    }
    
    return result.text;
    
  } catch (error) {
    if (debugLogging) {
      console.log(`   │       ⚠️  Text extraction error: ${error.message}`);
    }
    return '';
  }
}

module.exports = {
  extractVisibleText
};
