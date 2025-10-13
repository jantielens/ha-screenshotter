
# HA Screenshotter - Home Assistant Add-on

**A powerful Home Assistant add-on for automated web page screenshots, advanced image processing, and local web server access.**
Perfect for e-ink displays, dashboards, and automated monitoring.

## Installation

1. In your Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**
2. Click the menu (⋮) in the top right corner and select **Repositories**
3. Add this repository URL: `https://github.com/jantielens/ha-screenshotter`
4. Find "HA Screenshotter" in the add-on store and click **Install**
5. Start the add-on

## Features

- **📸 [Screenshot Capabilities](docs/SCREENSHOTTER.md)** - Multiple URLs, flexible configuration formats, high-quality rendering
- **📱 [Mobile Device Emulation](docs/MOBILE_EMULATION.md)** - Capture responsive mobile layouts for small displays and e-ink screens
- **✂️ [Image Cropping](docs/CROPPING.md)** - Extract specific regions from web pages for focused content
- **⏰ [Flexible Scheduling](docs/SCHEDULING.md)** - Cron-based automation with configurable intervals
- **🎨 [Advanced Image Processing](docs/IMAGE_PROCESSING.md)** - Rotation, grayscale, bit depth reduction with dithering
- **🏠 [Home Assistant Integration](docs/HA_INTEGRATION.md)** - Native add-on with UI configuration and authentication
- **🌐 [Optional Web Server](docs/WEBSERVER.md)** - External access with gallery interface for displays
- **🖥️ [Perfect for E-ink Displays](docs/EINK.md)** - Optimized output for e-paper and low-color displays

## ⚙️ Configuration

Configure through the add-on **Configuration** tab:

| Setting | Default | Description |
|---------|---------|-------------|
| `schedule` | `"* * * * *"` | Cron expression (every minute) |
| `urls` | `'["https://google.com"]'` | JSON array of URLs to screenshot (see URL Formats below) |
| `resolution_width` | `1920` | Default screenshot width in pixels |
| `resolution_height` | `1080` | Default screenshot height in pixels |
| `rotation_degrees` | `0` | Default rotation: 0°, 90°, 180°, or 270° |
| `grayscale` | `false` | Default grayscale conversion |
| `bit_depth` | `24` | Default color depth: 1, 4, 8, 16, or 24 bits |
| `webserverport` | `0` | Web server port (0 = disabled, >0 = enabled) |
| `long_lived_access_token` | `""` | Optional Home Assistant Long-Lived Access Token for authenticated screenshots |
| `language` | `"en"` | Language code for Home Assistant UI (e.g., "en", "es", "fr", "de") |


### Example Configuration
```yaml
schedule: "*/5 * * * *"
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 800
resolution_height: 600
grayscale: true
bit_depth: 1
```

For more advanced configuration examples and use cases, see [Advanced Configuration](docs/ADVANCED_CONFIG.md).

## Troubleshooting

Detailed logs are available in the Home Assistant add-on logs tab. For common issues and solutions, see [Troubleshooting](docs/TROUBLESHOOTING.md).