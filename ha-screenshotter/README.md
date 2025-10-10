# HA Screenshotter Add-on

Takes screenshots of web pages on a configurable schedule and serves them via a web interface.

## About

This is a Home Assistant add-on that automates web page screenshots. Currently in Step 1 of development - this version provides a basic "Hello World" implementation to verify the add-on infrastructure works correctly.

## Current Features (Step 3)

- ✅ Basic Home Assistant add-on structure
- ✅ Node.js runtime environment with Puppeteer
- ✅ Web page screenshot capability using Chromium
- ✅ **Configurable URLs** via Home Assistant UI
- ✅ **Cron-based scheduling** (default: every minute)
- ✅ **Multiple URL support** with index-based naming (0.jpg, 1.jpg, etc.)
- ✅ Screenshots saved to `/share/screenshots/` directory
- ✅ Comprehensive logging and error handling
- ✅ **Configuration validation** and error handling
- ✅ Graceful shutdown handling
- ✅ Access to Home Assistant shared storage

## Planned Features

- **Step 4**: Web server to access and serve screenshots

## Installation

1. Add the repository to Home Assistant: `https://github.com/jantielens/ha-screenshotter`
2. Install the "HA Screenshotter" add-on
3. Start the add-on
4. Check the logs to see the "Hello World" message

## Configuration

The add-on can be configured through the Home Assistant UI:

### Schedule
- **Format**: Cron format (minute hour day month weekday)
- **Default**: `* * * * *` (every minute)
- **Examples**: 
  - `*/5 * * * *` - Every 5 minutes
  - `0 */6 * * *` - Every 6 hours
  - `0 9 * * *` - Daily at 9 AM

### URLs
- **Format**: JSON string containing array of URLs
- **Default**: `["https://google.com", "https://time.now/"]`
- **Naming**: Screenshots saved as `0.jpg`, `1.jpg`, `2.jpg`, etc.
- **Example**:
  ```json
  ["https://google.com", "https://github.com", "https://news.ycombinator.com"]
  ```

## Support

Check the add-on logs for any issues. The current implementation should show:
- Startup messages
- "Hello World from HA Screenshotter!" message
- Heartbeat messages every 5 minutes
- Configuration status

## Development Status

This add-on is being developed incrementally. The current version (Step 1) focuses on establishing the basic add-on infrastructure and Home Assistant integration.

## Version History

- **0.3.0**: Added configurable URLs and cron scheduling (Step 3)
- **0.2.0**: Added basic screenshot functionality (Step 2)
- **0.1.0**: Initial "Hello World" implementation (Step 1)