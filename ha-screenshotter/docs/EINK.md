# Perfect for E-ink Displays

Optimized output for e-paper and low-color displays, tested with Inkplate and similar devices.

## How It Works
- Grayscale and bit depth reduction for e-ink
- Efficient processing for continuous operation
- Mobile layouts for better readability

## Usage Example
```yaml
grayscale: true
bit_depth: 1
```

## Typical Scenario: E-ink Dashboard with Home Assistant

1. **Create a dashboard in Home Assistant**
	 - Design a Lovelace dashboard with your desired widgets, graphs, and controls.

2. **HA Screenshotter add-on takes screenshots**
	 - The add-on automatically captures screenshots of your dashboard at a set interval (e.g., every 5 minutes).
	 - Screenshots are made available via the built-in web server (e.g., `http://your-home-assistant-ip:3000/screenshots/0.png`).

3. **E-ink display downloads and displays the screenshot**
	 - The e-ink device (often ESP-based) wakes up, downloads the latest screenshot from the add-on’s web server, displays it, and returns to deep sleep.

### Advantages
- **Minimal processing on the e-ink display:**
	- No need to run a browser or render HTML/CSS on the device.
	- No need to write or deploy complex C++ code for dashboard rendering.
- **Low power consumption:**
	- E-ink device can use deep sleep between updates, maximizing battery life.
	- Only wakes up briefly to download and display the image.
- **Flexible dashboard design:**
	- All dashboard logic and design is handled in Home Assistant.
	- Easily update the dashboard without touching the e-ink device firmware.