# Screenshot Capabilities

This feature allows you to capture screenshots of multiple web pages with flexible configuration formats and high-quality rendering.

## How It Works
- Supports multiple URLs in a single run
- Per-URL configuration for resolution, rotation, device emulation, and processing
- Uses Chromium browser engine via Puppeteer for accurate rendering
- Predictable file naming for easy integration

## Usage Example
```yaml
urls: '["https://google.com", "https://time.now/"]'
resolution_width: 1920
resolution_height: 1080
```

For advanced per-URL configuration, see the main README and [Advanced Configuration](ADVANCED_CONFIG.md).