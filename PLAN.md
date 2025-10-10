# Home Assistant Screenshot Add-on - Development Plan

## Overview
This document outlines the step-by-step plan for creating a Home Assistant add-on that takes screenshots of web pages on a configurable schedule.

## Requirements
- Node.js based implementation
- Simple code and structure
- Configurable schedule (cron-style)
- Configurable web pages (URLs)
- Web server to serve latest screenshots
- Home Assistant add-on compatibility

## Step-by-Step Implementation Plan

### Step 1: Create "Hello World" Home Assistant Add-on
**Goal**: Get a basic add-on structure working and deployable via GitHub repository

**Tasks**:
- Create the basic add-on directory structure
- Set up `config.yaml` with addon metadata and proper repository structure
- Create `repository.yaml` for Home Assistant add-on repository support
- Create a simple Node.js `Dockerfile` 
- Add basic `package.json` with minimal dependencies
- Create simple `index.js` that logs "Hello World" and keeps running
- Push to public GitHub repository
- Test adding repository via Home Assistant's "Manage add-on repositories" feature
- Test add-on installation and deployment from the repository

**Deliverables**: Working add-on repository that can be added to Home Assistant via GitHub URL and add-on runs without errors

### Step 2: Add Basic Screenshot Functionality
**Goal**: Verify screenshot capability works in the add-on environment

**Tasks**:
- Add Puppeteer dependency for web screenshots
- Modify `index.js` to take a screenshot of google.com on startup
- Save screenshot to `/share` directory (accessible from Home Assistant)
- Add proper error handling and logging
- Test that screenshot is created and accessible

**Deliverables**: Add-on that creates a screenshot file on startup

### Step 3: Add Configuration Options
**Goal**: Make URLs and schedule configurable through Home Assistant UI

**Tasks**:
- Update `config.yaml` to define configuration schema:
  - `schedule`: string (cron format, default: "* * * * *" - every minute)
  - `urls`: array of strings (default: ["https://google.com"])
- Modify Node.js code to read configuration from `/data/options.json`
- Add cron scheduler (using `node-cron` package)
- Update screenshot logic to handle multiple URLs with index-based naming:
  - First URL (index 0) → `0.jpg`
  - Second URL (index 1) → `1.jpg`
  - And so on...
- Test configuration changes through Home Assistant UI

**Deliverables**: Configurable add-on that takes screenshots on schedule

### Step 4: Enhancements
**Goal**: Add advanced screenshot configuration options for improved functionality

**Features to Add**:
- [x] **Configurable screen resolution** - Allow users to specify custom width and height (e.g., 1920x1080, 1366x768, 800x600) for viewport size before taking screenshots. Add configuration options like `resolution_width` and `resolution_height` with sensible defaults.
- [x] **Screenshot rotation** - Add ability to rotate screenshots by specified degrees (0, 90, 180, 270). Useful for displays that are mounted in different orientations. Add `rotation_degrees` configuration option with validation.
- [x] **Grayscale conversion** - Optional conversion of screenshots to grayscale to reduce file size and for aesthetic purposes. Add boolean `grayscale` configuration option (default: false).
- [x] **Configurable bit depth** - Allow adjustment of image bit depth to create limited color palettes (1-bit = black/white, 4-bit = 16 colors, 8-bit = 256 colors, etc.). Add `bit_depth` configuration option with values 1, 4, 8, 16, 24 bits.

## Technical Architecture

### File Structure
```
ha-screenshotter/
├── repository.yaml      # Home Assistant add-on repository metadata
├── ha-screenshotter/    # Add-on directory
│   ├── config.yaml      # Add-on metadata and configuration schema
│   ├── Dockerfile       # Container setup with Node.js and Chromium
│   ├── package.json     # Node.js dependencies
│   ├── index.js         # Main application logic
│   └── README.md        # Add-on documentation
└── README.md            # Repository documentation
```

### Key Dependencies
- `puppeteer` - Web page screenshots
- `node-cron` - Schedule management  
- `fs-extra` - File system operations

### Home Assistant Integration
- Screenshots saved to `/share/screenshots/` 
- Configuration via `/data/options.json`
- Logs accessible through Home Assistant UI

## Development Notes

### Design Principles
- Keep code simple and readable
- Minimal dependencies where possible
- Clear separation of concerns
- Proper error handling and logging
- Incremental development and testing

### Testing Strategy
- Test each step independently before proceeding
- Verify Home Assistant integration at each stage
- Test configuration changes through HA UI
- Validate screenshot quality and file handling
- Test web server endpoints and file serving

## Success Criteria

### Step 1 Success
- [x] Repository can be added via "Manage add-on repositories" in Home Assistant
- [x] Add-on appears in Home Assistant add-on store after repository is added
- [x] Add-on can be installed from the repository
- [x] Add-on starts and runs without errors
- [x] Logs show "Hello World" message

### Step 2 Success
- [x] Screenshot of google.com is created on startup
- [x] Screenshot file is saved to accessible location
- [x] No errors in add-on logs

### Step 3 Success
- [x] Configuration options appear in Home Assistant UI
- [x] Schedule configuration works (cron format)
- [x] URL list configuration works
- [x] Screenshots are taken according to schedule
- [x] Multiple URLs are handled correctly

## Next Steps
Start with Step 1 to create the basic "Hello World" add-on structure and verify Home Assistant integration works correctly.