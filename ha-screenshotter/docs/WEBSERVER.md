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
- **Description**: Web interface showing all captured screenshots in a gallery layout with current CRC32 values
- **Features**:
  - View all screenshots with thumbnails
  - Display current CRC32 checksum for each screenshot
  - Click "View History" button to see historical CRC32 values
  - Modal popup showing up to 500 historical checksums with timestamps
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

### Get All Current CRC32 Values
- **URL**: `http://your-home-assistant-ip:3000/checksums`
- **Description**: JSON endpoint returning current CRC32 values for all screenshots
- **Response Example**:
  ```json
  {
    "checksums": {
      "0": {
        "crc32": "a1b2c3d4",
        "timestamp": "2025-10-17T21:47:00.000Z",
        "historyCount": 125
      },
      "1": {
        "crc32": "e5f6g7h8",
        "timestamp": "2025-10-17T21:47:05.000Z",
        "historyCount": 125
      }
    },
    "timestamp": "2025-10-17T21:47:10.000Z",
    "history_length": 500
  }
  ```

### Get CRC32 History for Specific Screenshot
- **URL Pattern**: `http://your-home-assistant-ip:3000/checksums/{index}`
- **Example**: `http://your-home-assistant-ip:3000/checksums/0`
- **Description**: JSON endpoint returning full CRC32 history for a specific screenshot (up to 500 entries)
- **Response Example**:
  ```json
  {
    "screenshot_index": 0,
    "history": [
      {
        "timestamp": "2025-10-17T20:00:00.000Z",
        "crc32": "a1b2c3d4"
      },
      {
        "timestamp": "2025-10-17T21:00:00.000Z",
        "crc32": "a1b2c3d5"
      }
    ],
    "count": 2,
    "max_length": 500,
    "timestamp": "2025-10-17T21:47:10.000Z"
  }
  ```

## CRC32 History Feature

The web server now tracks and stores the last 500 CRC32 checksum values for each screenshot with timestamps. This feature provides:

- **Historical Tracking**: Every time a screenshot is captured, its CRC32 checksum is calculated and stored
- **Change Detection**: View when screenshots changed by comparing historical checksums
- **Diagnostics**: Identify patterns in screenshot changes over time
- **Persistence**: History is saved to `checksum-history.json` in the screenshots directory
- **Fixed Limit**: History is automatically trimmed to 500 entries per screenshot (oldest entries removed first)
- **No Configuration**: This feature is always enabled and requires no configuration changes

## Security Notes

- Temporary files (ending with `_temp.png` or `_temp.png.crc32`) are blocked from web access
- No authentication is provided - use only on trusted networks
- Consider using a reverse proxy with authentication for external access