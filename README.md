# HA Screenshotter - Home Assistant Add-on Repository

A Home Assistant add-on that takes screenshots of web pages on a configurable schedule and serves them via a web interface.

## Installation

1. In your Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**
2. Click the menu (⋮) in the top right corner and select **Repositories**
3. Add this repository URL: `https://github.com/jantielens/ha-screenshotter`
4. Find "HA Screenshotter" in the add-on store and click **Install**
5. Start the add-on

## Current Status

### ✅ Step 1: "Hello World" Add-on (Current)
- Basic Home Assistant add-on structure
- Simple Node.js application that logs "Hello World"
- Repository structure for Home Assistant add-on store
- Ready for installation and testing

### 🔄 Planned Features
- **Step 2**: Basic screenshot functionality using Puppeteer
- **Step 3**: Configurable URLs and schedule via Home Assistant UI
- **Step 4**: Web server to serve and access screenshots

## Development

This add-on is being developed incrementally following a step-by-step plan. Check the [PLAN.md](PLAN.md) file for detailed development roadmap.

### Current Implementation
- Simple "Hello World" Node.js application
- Proper Home Assistant add-on structure
- Logging and configuration support
- Graceful shutdown handling

## Support

If you encounter any issues, please check the add-on logs in Home Assistant and report issues on the [GitHub repository](https://github.com/jantielens/ha-screenshotter/issues).

## License

MIT License - see LICENSE file for details.