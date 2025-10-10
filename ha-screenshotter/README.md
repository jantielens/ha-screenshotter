# HA Screenshotter Add-on

Takes screenshots of web pages on a configurable schedule and serves them via a web interface.

## About

This is a Home Assistant add-on that automates web page screenshots. Currently in Step 1 of development - this version provides a basic "Hello World" implementation to verify the add-on infrastructure works correctly.

## Current Features (Step 2)

- ✅ Basic Home Assistant add-on structure
- ✅ Node.js runtime environment with Puppeteer
- ✅ Web page screenshot capability using Chromium
- ✅ Automatic screenshot of Google.com on startup
- ✅ Screenshots saved to `/share/screenshots/` directory
- ✅ Comprehensive logging and error handling
- ✅ Configuration support framework
- ✅ Graceful shutdown handling
- ✅ Access to Home Assistant shared storage

## Planned Features

- **Step 3**: Configurable URLs and scheduling via Home Assistant UI
- **Step 4**: Web server to access and serve screenshots

## Installation

1. Add the repository to Home Assistant: `https://github.com/jantielens/ha-screenshotter`
2. Install the "HA Screenshotter" add-on
3. Start the add-on
4. Check the logs to see the "Hello World" message

## Configuration

Currently no configuration options are available. This will be added in Step 3.

## Support

Check the add-on logs for any issues. The current implementation should show:
- Startup messages
- "Hello World from HA Screenshotter!" message
- Heartbeat messages every 5 minutes
- Configuration status

## Development Status

This add-on is being developed incrementally. The current version (Step 1) focuses on establishing the basic add-on infrastructure and Home Assistant integration.

## Version History

- **0.2.0**: Added basic screenshot functionality (Step 2)
- **0.1.0**: Initial "Hello World" implementation (Step 1)