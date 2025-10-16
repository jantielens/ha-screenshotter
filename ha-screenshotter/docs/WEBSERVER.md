# Optional Web Server

Access screenshots externally via a built-in web server with gallery interface.

# ⚠️ **Warning: No Authentication!**

The built-in web server does **not** have any authentication. Screenshots are accessible from outside Home Assistant to anyone on the network. If your screenshots contain sensitive information, anyone with network access to the server can view them. Only enable the web server on trusted networks!

## How It Works
- Enable web server for external access by setting `webserverport` to a value greater than 0.
- If `webserverport` is set to 0, the web server is not started and screenshots are only available locally.
- Gallery view and direct image URLs (e.g., `http://your-home-assistant-ip:3000/screenshots/0.png`)
- CRC32 checksum files for efficient change detection (e.g., `http://your-home-assistant-ip:3000/screenshots/0.png.crc32`)
- Health check endpoint available at `http://your-home-assistant-ip:3000/health` (returns status info)
- No authentication for trusted networks

## Usage Example
```yaml
webserverport: 3000
```

## Available Endpoints

### Gallery View
- **URL**: `http://your-home-assistant-ip:3000/`
- **Description**: Web interface showing all captured screenshots in a gallery layout
- **Auto-refresh**: Page refreshes every 60 seconds

### Screenshot Images
- **URL Pattern**: `http://your-home-assistant-ip:3000/screenshots/{index}.png`
- **Example**: `http://your-home-assistant-ip:3000/screenshots/0.png`
- **Description**: Direct access to screenshot PNG files
- **Index**: Corresponds to URL configuration order (0, 1, 2, etc.)

### CRC32 Checksum Files
- **URL Pattern**: `http://your-home-assistant-ip:3000/screenshots/{index}.png.crc32`
- **Example**: `http://your-home-assistant-ip:3000/screenshots/0.png.crc32`
- **Description**: CRC32 checksum files for efficient change detection
- **Format**: Plain text file containing 8-character hexadecimal CRC32 hash
- **Size**: 8 bytes
- **Use Case**: E-ink devices can download this tiny file to check if screenshot has changed before downloading the full image

### Health Check
- **URL**: `http://your-home-assistant-ip:3000/health`
- **Description**: JSON endpoint returning server status and configuration
- **Response Example**:
  ```json
  {
    "status": "ok",
    "timestamp": "2025-10-16T07:14:00.000Z",
    "screenshots_path": "/media/ha-screenshotter",
    "config": {
      "schedule": "*/5 * * * *",
      "url_count": 2,
      "resolution": "800x600"
    }
  }
  ```

## Security Notes

- Temporary files (ending with `_temp.png` or `_temp.png.crc32`) are blocked from web access
- No authentication is provided - use only on trusted networks
- Consider using a reverse proxy with authentication for external access