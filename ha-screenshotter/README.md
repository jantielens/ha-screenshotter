# HA Screenshotter

📸 Automated web page screenshots with advanced image processing for e-ink displays and dashboards.

## ✨ Features

- **📱 Multiple URLs** - Screenshot multiple web pages simultaneously
- **⏰ Cron Scheduling** - Flexible timing with full cron expression support
- **🎨 Image Processing** - Rotation, grayscale, and bit depth reduction with dithering
- **🖥️ E-ink Optimized** - Perfect for Inkplate and e-paper displays
- **🔄 Auto-Naming** - Predictable file naming (0.jpg, 1.jpg, etc.)
 - **📁 Shared Storage** - Screenshots saved to `/config/www/ha-screenshotter/` (served at `/local/ha-screenshotter/`)

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

### 🔗 Exposing screenshots over HTTP (for Lovelace cards)

The `share` folder is not served over HTTP by default. If you'd like to display screenshots in a Lovelace card (via an image URL), here are common approaches:

1) Save/COPY screenshots to the `www` folder (recommended)

	 - Files in Home Assistant's `config/www` folder are served at `/local/`.
	 - Place or copy screenshots into `/config/www/screenshots` and access them at:

		 `https://your-home-assistant/local/screenshots/yourfile.png`

2) Symlink from `www` to `share` (host-level, may not be allowed everywhere)

	 - On the host create a symlink so `/config/www/screenshots -> /config/share/screenshots` (paths depend on install). This makes screenshots available via `/local/` while being stored in `/share`.

3) Map `config/www` in the add-on mapping (advanced)

	 - Change the add-on `config.yaml` `map` entry so the addon writes directly to `config/www`, e.g.:

		 ```yaml
		 map:
			 - "config/www:rw"
		 ```

	 - This makes screenshots immediately available via `/local/` without copying.

Security notes

- Only expose what you need; map minimal folders or use a dedicated subfolder (e.g. `/config/www/screenshots`).
- Using `:rw` allows writing; prefer `:ro` where possible for safer operations.
- If your instance is Internet-facing, protect access with authentication and do not blindly expose internal data.

If you want, I can add an option to write directly to `/config/www/screenshots` and update the `config.yaml` mapping and docs accordingly.

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
- **Digital Photo Frames** - Automated content updates
- **Status Monitoring** - Regular screenshots of status pages
- **Dashboard Archiving** - Historical snapshots of Home Assistant dashboards

## 🆘 Support

For issues and feature requests, visit the [GitHub repository](https://github.com/jantielens/ha-screenshotter/issues).