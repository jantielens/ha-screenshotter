
# Mobile Device Emulation

Capture responsive mobile layouts for small displays and e-ink screens using built-in device presets or custom viewports.

## Why Use Mobile Device Emulation?

Many modern websites use responsive design, meaning the layout and content adapt to the size and type of device viewing the site. Mobile device emulation allows you to:

- **Capture mobile-optimized layouts:**
	- Mobile versions of sites often have simplified navigation, larger text, and less clutter, making them ideal for small display frames and e-ink devices.
	- Widgets, cards, and controls are rearranged for readability and usability on small screens.

- **Display dashboards on small frames:**
	- If you want to show a Home Assistant dashboard or any web page on a small display (e.g., 2.7" or 4.2" e-ink, or a small TFT frame), the mobile layout is usually much better suited than the desktop version.
	- Desktop layouts may be too wide, crowded, or hard to read on small screens.

## How It Works
- Emulate 100+ device presets (iPhone, iPad, Android, tablets)
- Per-URL emulation: mix desktop and mobile screenshots
- Custom mobile viewport settings
- User agent and touch event control

## Usage Example
```yaml
urls: '[{"url": "https://mobile-site.com", "device_emulation": "iPhone SE"}]'
```

## More Usage Examples

### Mixed Desktop and Mobile Screenshots
```yaml
urls: '[
	{"url": "https://dashboard.local", "device_emulation": "desktop"},
	{"url": "https://dashboard.local", "device_emulation": "iPhone 12"}
]'
```

### Custom Mobile Viewport (advanced)
```yaml
urls: '[
	{
		"url": "https://weather.com",
		"device_emulation": "custom",
		"mobile_viewport": {
			"width": 414,
			"height": 896,
			"device_scale_factor": 2,
			"user_agent": "iPhone",
			"touch_enabled": true,
			"is_landscape": false
		}
	}
]'
```

### E-ink Display with Mobile Layout
```yaml
urls: '[
	{
		"url": "http://homeassistant.local:8123/lovelace/mobile",
		"device_emulation": "iPhone SE",
		"grayscale": true,
		"bit_depth": 1
	}
]'
```
