# HA Screenshotter

📸 Automated web page screenshots with advanced image processing for e-ink displays and dashboards.

## ✨ Features

- **📱 Multiple URLs** - Screenshot multiple web pages simultaneously
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
| `urls` | `'["https://google.com"]'` | JSON array of URLs to screenshot |
| `resolution_width` | `1920` | Screenshot width in pixels |
| `resolution_height` | `1080` | Screenshot height in pixels |
| `rotation_degrees` | `0` | Rotate: 0°, 90°, 180°, or 270° |
| `grayscale` | `false` | Convert to black & white |
| `bit_depth` | `24` | Color depth: 1, 4, 8, 16, or 24 bits |
| `webserverport` | `0` | Web server port (0 = disabled, >0 = enabled) |

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
```
*Picture frame can access: `http://your-ha-ip:3000/screenshots/0.png`*

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