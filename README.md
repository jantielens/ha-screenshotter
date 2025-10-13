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


- **📸 [Screenshot Capabilities](ha-screenshotter/docs/SCREENSHOTTER.md)** - Multiple URLs, flexible configuration formats, high-quality rendering
- **✂️ [Image Cropping](ha-screenshotter/docs/CROPPING.md)** - Extract specific regions from web pages for focused content
- **⏰ [Flexible Scheduling](ha-screenshotter/docs/SCHEDULING.md)** - Cron-based automation with configurable intervals
- **🎨 [Advanced Image Processing](ha-screenshotter/docs/IMAGE_PROCESSING.md)** - Rotation, grayscale, bit depth reduction with dithering
- **🏠 [Home Assistant Integration](ha-screenshotter/docs/HA_INTEGRATION.md)** - Native add-on with UI configuration and authentication
- **🌐 [Optional Web Server](ha-screenshotter/docs/WEBSERVER.md)** - External access with gallery interface for displays
- **🖥️ [Perfect for E-ink Displays](ha-screenshotter/docs/EINK.md)** - Optimized output for e-paper and low-color displays
- **📱 [Mobile Device Emulation](ha-screenshotter/docs/MOBILE_EMULATION.md)** - Capture responsive mobile layouts for small displays and e-ink screens

### Example Configuration
```yaml
schedule: "*/5 * * * *"
urls: '["http://homeassistant.local:8123/lovelace/dashboard"]'
resolution_width: 800
resolution_height: 600
grayscale: true
bit_depth: 1
```

For more advanced configuration examples and use cases, see [Advanced Configuration](ha-screenshotter/docs/ADVANCED_CONFIG.md).

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

## Troubleshooting

Detailed logs are available in the Home Assistant add-on logs tab. For common issues and solutions, see [Troubleshooting](ha-screenshotter/docs/TROUBLESHOOTING.md).

## Support

If you encounter any issues, please check the add-on logs in Home Assistant and report issues on the [GitHub repository](https://github.com/jantielens/ha-screenshotter/issues).

## 🤖 For Developers & Agents

**⚠️ IMPORTANT:** This repository has strict validation requirements. All PRs with functional changes must:
- Bump version in both `ha-screenshotter/package.json` and `ha-screenshotter/config.yaml`  
- Update `CHANGELOG.md` with proper formatting
- See [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) for detailed requirements

## License

MIT License - see LICENSE file for details.