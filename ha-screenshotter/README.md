# HA Screenshotter

📸 Automated web page screenshots with advanced image processing for e-ink displays and dashboards.

## ✨ Features

- **📱 Multiple URLs** - Screenshot multiple web pages simultaneously
- **✂️ Image Cropping** - Extract specific regions from web pages using pixel coordinates
- **⏰ Cron Scheduling** - Flexible timing with full cron expression support
- **🎨 Image Processing** - Rotation, grayscale, and bit depth reduction with dithering
- **🔄 Auto-Naming** - Predictable file naming (0.jpg, 1.jpg, etc.)
- **📁 Media Storage** - Screenshots saved to `/media/ha-screenshotter/` (served at `/media/ha-screenshotter/`)
- **🌐 Optional Web Server** - Built-in HTTP server for external access (perfect for picture frames)

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

### 🎯 URL Configuration Formats

You can configure URLs in three different ways, with **full backward compatibility**:

#### **1. Simple Array (Original Format)**
```yaml
urls: '["https://google.com", "https://weather.com"]'
```
All URLs use the global `resolution_width`, `resolution_height`, `rotation_degrees`, `grayscale`, and `bit_depth` settings.

#### **2. Object Format (Per-URL Settings)**
```yaml
urls: '{
  "https://dashboard.local": {"width": 800, "height": 600, "grayscale": true},
  "https://weather.com": {"rotation": 90},
  "https://status.page": {}
}'
```
Each URL can have individual settings. Missing settings fall back to global defaults.

#### **3. Array with Objects (Mixed Format)**
```yaml
urls: '[
  "https://simple-url.com",
  {"url": "https://custom.com", "width": 800, "height": 600},
  {"url": "https://rotated.com", "rotation": 90}
]'
```
Mix simple URLs with URLs that have custom settings.

**Per-URL Setting Options:**
- `width` / `height` - Custom resolution for this URL
- `rotation` - Rotation degrees (0, 90, 180, 270)
- `grayscale` - Boolean for grayscale conversion
- `bit_depth` - Color depth (1, 4, 8, 16, 24)
- `crop` - Crop region object with `x`, `y`, `width`, `height` properties

### 📋 Quick Examples

**E-ink Display (1-bit B&W):**
```yaml
schedule: "*/5 * * * *"
urls: '["http://homeassistant.local:8123/dashboard"]'
resolution_width: 800
resolution_height: 600
grayscale: true
bit_depth: 1
```

**Per-URL Settings (Object Format):**
```yaml
schedule: "*/10 * * * *"
urls: '{
  "http://homeassistant.local:8123/dashboard": {"width": 800, "height": 600, "grayscale": true, "bit_depth": 1},
  "https://weather.com": {"width": 1920, "height": 1080, "rotation": 90},
  "https://status.page": {}
}'
resolution_width: 1024  # Default for URLs without explicit settings
resolution_height: 768
```

**Per-URL Settings (Array with Objects):**
```yaml
schedule: "0 * * * *"
urls: '[
  {"url": "http://homeassistant.local:8123/eink", "width": 800, "height": 600, "grayscale": true},
  {"url": "https://weather.com", "rotation": 90},
  {"url": "https://status.page"}
]'
resolution_width: 1920  # Default for URLs without explicit settings
resolution_height: 1080
```

**4-bit Color with Dithering:**
```yaml
schedule: "0 * * * *"
urls: '["https://weather.com", "https://status.page"]'
bit_depth: 4
rotation_degrees: 90
```

**Picture Frame Setup:**
```yaml
schedule: "*/10 * * * *"
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 1024
resolution_height: 768
webserverport: 3000
long_lived_access_token: "YOUR_LONG_LIVED_TOKEN_HERE"
language: "en"  # Home Assistant UI language
```
*Picture frame can access: `http://your-ha-ip:3000/screenshots/0.png`*

**Multi-Language Dashboard:**
```yaml
schedule: "0 */2 * * *"  # Every 2 hours
urls: '["http://homeassistant.local:8123/lovelace/main"]'
resolution_width: 800
resolution_height: 600
long_lived_access_token: "YOUR_LONG_LIVED_TOKEN_HERE"
language: "fr"  # French Home Assistant UI
grayscale: true
bit_depth: 4
```

**Cropping Examples:**
```yaml
# Crop dashboard header only
urls: '[{
  "url": "http://homeassistant.local:8123/lovelace/dashboard",
  "width": 1920,
  "height": 1080,
  "crop": {"x": 0, "y": 0, "width": 1920, "height": 200}
}]'
```

```yaml
# Mixed cropping - sidebar and main content
urls: '[
  {"url": "http://homeassistant.local:8123/sidebar", "crop": {"x": 0, "y": 100, "width": 300, "height": 800}},
  {"url": "http://homeassistant.local:8123/main", "crop": {"x": 300, "y": 100, "width": 1620, "height": 800}}
]'
```

📖 **[View detailed cropping documentation](../CROP_DOCUMENTATION.md)** for complete configuration guide and use cases.

### 🔐 Using a Home Assistant Long-Lived Access Token

If your dashboard requires authentication, you can supply a Home Assistant Long-Lived Access Token using the `long_lived_access_token` option in the add-on configuration. This token will be sent as a Bearer token in the Authorization header for each screenshot request.

- Store the token securely in the add-on configuration (it is stored in the add-on config and visible to admins).
- Example (do not commit tokens to source control):

```yaml
long_lived_access_token: "<long-lived-access-token>"
```

Only enable or store tokens in trusted environments.

### 🌍 Language Configuration

When taking screenshots of Home Assistant dashboards, you can configure the UI language that will be displayed in your screenshots using the `language` option. This is particularly useful for:

- **Multi-language households** - Display dashboards in different languages for different users
- **Localized displays** - Show dates, numbers, and text in the appropriate language format  
- **International deployments** - Consistent language across all screenshot outputs

**Supported Language Codes:**
- `"en"` - English (default)
- `"es"` - Spanish  
- `"fr"` - French
- `"de"` - German
- `"it"` - Italian
- `"nl"` - Dutch
- `"pt"` - Portuguese
- `"ru"` - Russian
- `"zh"` - Chinese
- And many more supported by Home Assistant

**Example:**
```yaml
language: "es"  # Spanish Home Assistant UI
```

The language setting is injected into the browser's localStorage before taking screenshots, ensuring Home Assistant renders in the specified language.

### ⏰ Cron Schedule Examples

- `"* * * * *"` - Every minute
- `"*/5 * * * *"` - Every 5 minutes  
- `"0 * * * *"` - Every hour
- `"0 8,20 * * *"` - 8 AM and 8 PM daily
- `"0 0 * * 0"` - Weekly on Sunday

## 🚀 Getting Started

1. **Configure** your URLs and schedule in the Configuration tab
2. **Start** the add-on
3. **Check Logs** for screenshot status
4. **Access** screenshots in `/share/screenshots/` (numbered 0.jpg, 1.jpg, etc.)

### 🌐 Built-in Web Server (Optional)

The add-on includes an optional web server for accessing screenshots from outside Home Assistant:

**Enable the Web Server:**
```yaml
webserverport: 3000  # Choose any available port
```

**Web Server Features:**
- **📱 Gallery View** - Visual gallery of all screenshots at `http://your-ha-ip:3000`
- **🔗 Direct Access** - Direct image URLs at `http://your-ha-ip:3000/screenshots/[filename]`
- **💾 Easy Downloads** - Right-click images to save or copy URLs
- **🔄 Auto-refresh** - Gallery updates automatically every 60 seconds
- **❤️ Health Check** - Status endpoint at `http://your-ha-ip:3000/health`

**Perfect for External Devices:**
- **🖼️ Picture Frames** - Digital frames can download screenshots directly
- **📺 External Displays** - Access dashboards from devices outside Home Assistant
- **🔗 Direct Links** - Share screenshot URLs with other applications
- **📱 Mobile Access** - View screenshots on any device with a web browser

**Security Note:** The web server has no authentication - only enable on trusted networks.

### 🔗 Accessing Screenshots in Home Assistant

Screenshots are automatically saved to Home Assistant's media folder and are immediately accessible via `/media/` URLs for use in Lovelace cards and automations.

## 📊 Monitoring

Monitor the add-on through:
- **Logs Tab** - Detailed execution logs with emoji indicators
- **File Browser** - View generated screenshots in `/share/screenshots/`
- **Configuration** - Validate settings and see error messages

## 🔧 Troubleshooting

### Configuration Validation

⚠️ **Important**: Invalid configuration values will cause the add-on to stop immediately. Configuration validation is strict and will not fall back to defaults.

Common validation errors:
- **URLs**: Must be valid JSON format: `'["https://example.com", "https://example2.com"]'`
- **Resolution**: Must be positive integers
- **Rotation**: Must be exactly 0, 90, 180, or 270
- **Bit depth**: Must be 1, 4, 8, 16, or 24
- **Boolean values**: Must be exactly `true` or `false`

### General Troubleshooting

- Check **Logs** for error messages
- Verify **URLs** are accessible from your network  
- Ensure **resolution** settings are reasonable for your system
- Test with **24-bit** depth first, then optimize for your display

## 💡 Use Cases

- **E-ink Displays** - Dashboards for Inkplate, Waveshare displays
- **Digital Photo Frames** - Automated content updates with direct HTTP access
- **External Displays** - Picture frames that fetch Home Assistant dashboards automatically
- **Status Monitoring** - Regular screenshots of status pages accessible from anywhere
- **Dashboard Archiving** - Historical snapshots of Home Assistant dashboards
- **Cross-Platform Access** - View screenshots on devices that can't access Home Assistant directly

## 🆘 Support
For issues and feature requests, visit the [GitHub repository](https://github.com/jantielens/ha-screenshotter/issues).