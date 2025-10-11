# HA Screenshotter - Home Assistant Add-on

A powerful Home Assistant add-on that takes screenshots of web pages on a configurable schedule with advanced image processing capabilities and a local web server. Perfect for e-ink displays, dashboards, and automated monitoring.

## Installation

1. In your Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**
2. Click the menu (⋮) in the top right corner and select **Repositories**
3. Add this repository URL: `https://github.com/jantielens/ha-screenshotter`
4. Find "HA Screenshotter" in the add-on store and click **Install**
5. Start the add-on

## Features

### 📸 **Screenshot Capabilities**
- **Multiple URL Support** - Screenshot multiple web pages simultaneously
- **Configurable Resolution** - Set custom width and height (e.g., 1920x1080, 1366x768, 800x600)
- **High-Quality Output** - Uses Chromium browser engine via Puppeteer for accurate rendering
- **Predictable File Naming** - Outputs numbered files (0.jpg, 1.jpg, etc.) for easy integration

### ⏰ **Flexible Scheduling**
- **Cron-Based Scheduling** - Full cron expression support for precise timing
- **Configurable Intervals** - From every minute to monthly schedules
- **Automatic Execution** - Runs continuously in the background
- **Startup Screenshots** - Takes initial screenshots immediately on start

### 🎨 **Advanced Image Processing**
- **Screenshot Rotation** - Rotate images by 0°, 90°, 180°, or 270° for different display orientations
- **Grayscale Conversion** - Optional black and white conversion for e-ink displays
- **Bit Depth Reduction** - Reduce colors for optimal display compatibility:
  - **1-bit** - Pure black and white (2 colors)
  - **4-bit** - 16 colors with dithering
  - **8-bit** - 256 colors with dithering
  - **16-bit** - 65,536 colors
  - **24-bit** - Full color (default)
- **Floyd-Steinberg Dithering** - Professional dithering for smooth color gradients

### 🏠 **Home Assistant Integration**
- **Native Add-on** - Seamless integration with Home Assistant
- **UI Configuration** - Easy setup through Home Assistant's settings interface
- **Authentication Support** - Long-lived access token support for protected dashboards
- **Multi-Language Support** - Configure Home Assistant UI language for screenshots (en, es, fr, de, etc.)
- **Media Storage** - Screenshots saved to `/media/ha-screenshotter/` for access through Home Assistant's media system
- **Comprehensive Logging** - Detailed logs with emoji indicators for easy monitoring
- **Error Handling** - Robust error handling with automatic recovery

### 🌐 **Optional Web Server**
- **External Access** - Optional built-in web server for accessing screenshots outside Home Assistant
- **Gallery Interface** - Visual gallery showing all screenshots with auto-refresh
- **Direct URLs** - Direct access to screenshot files via HTTP
- **Picture Frame Ready** - Perfect for digital photo frames and external displays
- **No Authentication** - Simple access for trusted network environments

### 🖥️ **Perfect for E-ink Displays**
- **Optimized Output** - Specifically designed for e-ink and low-color displays
- **Inkplate Compatible** - Tested with Inkplate and similar e-paper displays
- **Efficient Processing** - Minimal resource usage for continuous operation

## Configuration

Configure the add-on through Home Assistant's add-on configuration page. All settings are applied immediately when you restart the add-on.

### 📋 **Configuration Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schedule` | string | `"* * * * *"` | Cron expression for screenshot timing (every minute by default) |
| `urls` | string | `'["https://google.com", "https://time.now/"]'` | JSON array of URLs to screenshot (as string) |
| `resolution_width` | integer | `1920` | Screenshot width in pixels |
| `resolution_height` | integer | `1080` | Screenshot height in pixels |
| `rotation_degrees` | integer | `0` | Rotation angle: `0`, `90`, `180`, or `270` degrees |
| `grayscale` | boolean | `false` | Convert screenshots to grayscale |
| `bit_depth` | integer | `24` | Color depth: `1`, `4`, `8`, `16`, or `24` bits |
| `webserverport` | integer | `0` | Web server port (0 = disabled, >0 = enabled) |
| `long_lived_access_token` | string | `""` | Optional Home Assistant Long-Lived Access Token for authenticated screenshots (Bearer token) |
| `language` | string | `"en"` | Language code for Home Assistant frontend (e.g., "en", "es", "fr", "de") - used when taking screenshots of HA dashboards |

### 📝 **Configuration Examples**

#### E-ink Display (Black & White)
```yaml
schedule: "*/5 * * * *"  # Every 5 minutes
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 800
resolution_height: 600
rotation_degrees: 0
grayscale: true
bit_depth: 1
```

#### Color Dashboard (4-bit with Dithering)
```yaml
schedule: "0 * * * *"  # Every hour
urls: '["https://example.com/dashboard", "https://weather.com"]'
resolution_width: 1366
resolution_height: 768
rotation_degrees: 90
grayscale: false
bit_depth: 4
```

#### High-Quality Screenshots
```yaml
schedule: "0 8 * * *"  # Daily at 8 AM
urls: '["https://news.com", "https://status.example.com"]'
resolution_width: 1920
resolution_height: 1080
rotation_degrees: 0
grayscale: false
bit_depth: 24
```

#### Picture Frame / External Display Setup
```yaml
schedule: "*/10 * * * *"  # Every 10 minutes
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 1024
resolution_height: 768
webserverport: 3000  # Enable web server
long_lived_access_token: "YOUR_LONG_LIVED_TOKEN_HERE"
language: "en"  # Set Home Assistant UI language
```

#### Multi-Language Home Assistant Dashboard
```yaml
schedule: "0 6 * * *"  # Daily at 6 AM
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 1200
resolution_height: 800
long_lived_access_token: "YOUR_LONG_LIVED_TOKEN_HERE"
language: "es"  # Spanish UI language for screenshots
```

**Usage with Picture Frames:**
With the web server enabled, your picture frame or external display can easily fetch screenshots:
- **Gallery View:** `http://your-home-assistant-ip:3000`
- **Direct Image:** `http://your-home-assistant-ip:3000/screenshots/0.png`
- **Health Check:** `http://your-home-assistant-ip:3000/health`

This is perfect for:
- **Digital photo frames** displaying Home Assistant dashboards
- **Wall-mounted displays** showing status information
- **Devices outside your Home Assistant network** that need dashboard access
- **Automated systems** that fetch dashboard images programmatically

### ⏰ **Cron Schedule Format**

The `schedule` field uses standard cron format:
```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

**Common Examples:**
- `"* * * * *"` - Every minute
- `"*/5 * * * *"` - Every 5 minutes
- `"0 * * * *"` - Every hour
- `"0 8,20 * * *"` - Twice daily (8 AM and 8 PM)
- `"0 0 * * 0"` - Weekly on Sunday at midnight

## Support

If you encounter any issues, please check the add-on logs in Home Assistant and report issues on the [GitHub repository](https://github.com/jantielens/ha-screenshotter/issues).

## License

MIT License - see LICENSE file for details.