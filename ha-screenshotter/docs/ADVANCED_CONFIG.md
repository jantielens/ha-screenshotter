# Advanced Configuration Examples

Detailed examples and use cases for advanced HA Screenshotter setups.

## Mixed Resolution Setup (E-ink + HD Dashboard)
```yaml
schedule: "*/10 * * * *"
urls: '{
  "http://homeassistant.local:8123/lovelace/eink": {"width": 800, "height": 600, "grayscale": true, "bit_depth": 1},
  "http://homeassistant.local:8123/lovelace/main": {"width": 1920, "height": 1080},
  "https://weather.com": {"width": 1024, "rotation": 90},
  "https://status.page": {}
}'
resolution_width: 1280    # Default for URLs without explicit settings
resolution_height: 720
webserverport: 3000
long_lived_access_token: "YOUR_TOKEN"
```

## Multi-Device Dashboard (Different Orientations)
```yaml
schedule: "*/5 * * * *"
urls: '[
  {"url": "http://homeassistant.local:8123/lovelace/landscape", "width": 1920, "height": 1080},
  {"url": "http://homeassistant.local:8123/lovelace/portrait", "width": 1080, "height": 1920, "rotation": 90},
  {"url": "http://homeassistant.local:8123/lovelace/eink", "grayscale": true, "bit_depth": 4}
]'
resolution_width: 1024    # Default resolution
resolution_height: 768
```

## Picture Frame / External Display Setup
```yaml
schedule: "*/10 * * * *"  # Every 10 minutes
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 1024
resolution_height: 768
webserverport: 3000  # Enable web server
long_lived_access_token: "YOUR_LONG_LIVED_TOKEN_HERE"
language: "en"  # Set Home Assistant UI language
```

## Multi-Language Home Assistant Dashboard
```yaml
schedule: "0 6 * * *"  # Daily at 6 AM
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 1200
resolution_height: 800
long_lived_access_token: "YOUR_LONG_LIVED_TOKEN_HERE"
language: "es"  # Spanish UI language for screenshots
```

## Text-Based SimHash Checksums

By default, HA Screenshotter uses **pixel-based CRC32 checksums** to detect when screenshot content changes. This works well for most use cases, but for dynamic or complex layouts, you can optionally enable **text-based SimHash checksums** that analyze the extracted visible text content instead.

### When to use text-based checksums?
- **Dynamically generated content**: Pages with constantly changing non-text elements (animations, timers, counters)
- **Complex layouts**: Pages where minor visual changes shouldn't trigger updates (shadows, spacing, decorations)
- **Text-focused content**: News, documentation, or status pages where you care about text changes, not styling
- **Bandwidth optimization**: If displaying on slow/metered connections and text-based detection is sufficient

### Text-based checksum example
```yaml
schedule: "*/10 * * * *"
urls: '[
  {
    "url": "https://example.com",
    "use_text_based_crc32": true  # Enable text-based SimHash checksum
  },
  {
    "url": "https://status.page",
    "use_text_based_crc32": false  # Use default pixel-based CRC32 (explicit)
  },
  {
    "url": "https://news.site"
    # use_text_based_crc32 not specified, defaults to false (pixel-based)
  }
]'
resolution_width: 1024
resolution_height: 768
```

Or with object format:
```yaml
urls: '{
  "https://example.com": {"use_text_based_crc32": true},
  "https://status.page": {"use_text_based_crc32": false},
  "https://news.site": {}
}'
```

### How text-based checksums work
1. **Text Extraction**: After page load, visible text is extracted using `document.body.innerText`
2. **Normalization**: Text is lowercased and whitespace is collapsed
3. **Tokenization**: Text is split into tokens (words) by whitespace boundaries
4. **SimHash**: A 64-bit SimHash is computed from the token set
5. **Folding**: The 64-bit hash is folded to 32 bits using XOR, producing the final checksum
6. **Error Handling**: If text extraction fails, checksum is set to `0xdeadbeef` (magic error indicator)

### Text-based checksum characteristics
- **Case-insensitive**: Changes in letter casing don't trigger a new checksum
- **Whitespace-insensitive**: Extra spaces, tabs, or line breaks don't matter
- **No filtering**: Raw extracted text is used; no stemming, stopword removal, or lemmatization
- **Fast**: Lightweight fingerprinting on extracted text
- **Stable**: Won't change for minor visual tweaks or CSS-only updates

## Long-Lived Access Token

A Home Assistant long-lived access token is required to take screenshots of dashboards that require authentication (such as private Lovelace views or protected pages). The token allows the add-on to access your Home Assistant instance securely, without needing to log in interactively.

### Why is it needed?
- Home Assistant dashboards and some URLs require authentication to view.
- The add-on uses the token to authenticate requests and capture screenshots of protected content.
- Without a token, only public/unprotected pages can be captured.

### How to create a long-lived access token in Home Assistant
1. Log in to your Home Assistant web interface.
2. Click your user profile icon (bottom left corner).
3. Scroll down to the "Long-Lived Access Tokens" section.
4. Enter a name for the token (e.g., "Screenshotter") and click "Create Token".
5. Copy the generated token and paste it into the add-on configuration under `long_lived_access_token`.

**Important:**
- Treat your token like a password—do not share it or commit it to source control.
- You can revoke tokens at any time from your Home Assistant profile.
