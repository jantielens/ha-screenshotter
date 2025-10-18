# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.19.0] - 2025-10-18

### Changed
- **CRC32 history modal** now highlights checksum change runs with rotating color stripes and "Changed" badges for immediate visual cues
- Duplicate CRC32 entries are dimmed and display consolidated timestamp ranges to clarify how long a checksum remained unchanged

## [1.18.0] - 2025-10-18

### Added
- **CRC32 History Tracking** for screenshot change monitoring and diagnostics
  - Stores last 500 CRC32 checksum values with timestamps for each screenshot
  - History persisted to `checksum-history.json` in screenshots directory
  - Automatic trimming of oldest entries when limit exceeded
  - New `/checksums` API endpoint to get current CRC32 values for all screenshots
  - New `/checksums/:index` API endpoint to get full history for specific screenshot
  - Gallery UI enhanced to display current CRC32 value for each screenshot
  - Interactive "View History" button opens modal with historical checksums table
  - No configuration required - feature enabled by default with fixed 500-entry limit
  - Atomic file writes for history persistence (write temp, rename)
  - Facilitates change detection patterns and diagnostic analysis

### Changed
- **Webserver CI tests** enhanced with CRC32 history endpoint validation
  - Added test for `/checksums` endpoint to verify current checksums for all screenshots
  - Added test for `/checksums/:index` endpoint to verify historical data retrieval
  - Validates JSON structure, required fields, and history length settings

## [1.17.0] - 2025-10-17

### Changed
- **Pixel-based CRC32 checksums** for improved reliability and battery savings
  - Checksums now calculated over raw pixel buffer instead of PNG file
  - Eliminates false positives from PNG metadata or compression differences
  - Checksum only changes when actual displayed pixels change
  - Prevents unnecessary e-ink device wakeups and image downloads
  - Improves battery life for battery-powered e-ink displays
  - CRC32 lookup table precomputed at module load for better performance
  - Maintains backward compatibility: same `.crc32` file format (8-char lowercase hex)

## [1.16.1] - 2025-10-16

### Added
- **Additional Chromium stability flags** to improve browser reliability and reduce background interference
  - Disabled software rasterizer, extensions, and background networking features
  - Disabled background timer throttling and renderer backgrounding
  - Disabled component updates, domain reliability, sync, and breakpad crash reporting
  - Added flags to mute audio, disable pings, and prevent zygote process
  - Disabled TranslateUI and BlinkGenPropertyTrees features for cleaner rendering

### Changed
- **Reduced log verbosity** by ~50% to make output more concise and readable
- Removed low-value verbose logs (browser checks, memory info, intermediate processing steps)
- Retained all essential logs for progress tracking and debugging (navigation, screenshot capture, finalization, errors)

## [1.16.0] - 2025-10-16

### Added
- **CRC32 checksum support** for efficient e-ink device screenshot change detection
- Automatic generation of `.crc32` checksum files alongside each screenshot
- Web server now serves checksum files at `/screenshots/{index}.png.crc32`
- Checksum files contain 8-character hexadecimal CRC32 hash (only 8 bytes)
- E-ink devices can download tiny checksum file to detect changes before downloading full image
- Fallback CRC32 implementation for compatibility with all Node.js versions
- Comprehensive documentation in EINK.md with ESP32/Arduino example code
- Updated WEBSERVER.md with checksum endpoint documentation
- CI tests for checksum file creation, format validation, and web accessibility

### Changed
- Gallery view now filters out `.crc32` checksum files
- Web server blocks temporary checksum files (`*_temp.png.crc32`) from being served

## [1.15.1] - 2025-10-15

### Fixed
- **Emoji rendering support**: Added `font-noto-emoji` package to fix emoji rendering in screenshots (emojis no longer appear as boxes with an X)
- Run `fc-cache -fv` after font installation to ensure Chromium can find the new fonts

## [1.15.0] - 2025-10-15

### Added
- **Web server now starts before screenshot generation** to provide near-zero downtime for the gallery UI
- **Existing screenshots are now preserved on container restart** instead of being deleted

### Changed
- Web server initialization moved to start immediately after configuration validation, before initial screenshots are taken
- Startup cleanup now only removes temporary files (`*_temp.png`) instead of deleting all existing screenshots
- Users can now access the gallery and download existing screenshots immediately when the container starts
- New screenshots atomically overwrite previous versions, providing seamless updates visible in the web UI

## [1.14.1] - 2025-10-13

### Fixed
- **Race condition fix**: Screenshots are now processed using temporary filenames to prevent users from downloading partially processed or corrupted images
- Implemented atomic file operations with `fs.move()` to ensure screenshots are only served after all processing is complete
- Added automatic cleanup of temporary files when processing fails


## [1.14.0] - 2025-10-13

### Added
- **Advanced image processing** capabilities for enhanced screenshot quality
- **Contrast adjustment** to control image clarity and tonal differences
- **Saturation control** to adjust color intensity from full color to grayscale
- **Gamma correction** for display-specific optimization
- **Black/White level adjustments** to crush shadows and highlights for better readability
- **Gamma removal** feature specifically optimized for e-ink displays
- Per-URL advanced processing settings support
- Configuration options: `contrast`, `saturation`, `gamma_correction`, `black_level`, `white_level`, `remove_gamma`
- Comprehensive test cases for all advanced processing features
- Updated IMAGE_PROCESSING.md documentation with e-ink optimization examples

### Changed
- Processing order now includes advanced processing step after cropping and before rotation
- Updated config.yaml schema to include new advanced processing options

## [1.13.0] - 2025-10-12

### Added
- **Mobile viewport emulation** for responsive layout screenshots
- Support for built-in device presets (iPhone 12, iPhone SE, iPad, etc.)
- Custom mobile viewport configuration with device scale factor control
- Per-URL device emulation settings
- Global device emulation configuration option
- Mobile user agent simulation for authentic mobile rendering

### Fixed
- Corrected screenshot resolution to always match configured dimensions instead of device viewport size
- Fixed device scale factor handling to prevent unwanted screenshot scaling
- Updated test cases to properly validate mobile emulation behavior

## [1.12.3] - 2025-10-12

### Added
- Additional CI tests for internal webserver functionality
- `test-webserver-customport`: Tests webserver on custom port 6666
- `test-webserver-invalidport`: Tests that invalid port configuration causes expected failure
## [1.12.2] - 2025-10-12

### Fixed
- Fixed changelog visibility in Home Assistant by moving CHANGELOG.md to add-on directory
- Updated all documentation and scripts to reference correct changelog location


## [1.12.1] - 2025-10-12

### Fixed
- Fixed intermittent "Execution context was destroyed" error when injecting authentication token into localStorage
- Improved page stability handling by waiting for network to be idle before localStorage injection
- Moved viewport configuration before token injection to ensure proper page initialization order

## [1.12.0] - 2025-10-12

### Added
- **PR Validation System**: Automatic validation of version bumps and changelog updates in GitHub Actions
- **Agent Instructions**: Comprehensive documentation for GitHub Copilot and automated agents (`AGENT_INSTRUCTIONS.md`)
- **GitHub Templates**: Issue and PR templates with agent-specific guidance and checklists
- **Version Bump Helper Script**: Interactive script (`scripts/bump_version.sh`) for proper version management
- **Developer Documentation**: Setup guides and validation requirements documentation

### Changed
- Enhanced README with prominent developer and agent requirements notice
- Improved repository structure with organized documentation for contributors


## [1.11.0] - 2025-10-12

### Added
- Mutex implementation to prevent overlapping cron executions
- Documentation for overlap prevention feature

### Changed
- Ensure lock is explicitly released before process exit

## [1.10.0] - 2025-10-12

### Added
- **Cropping functionality** with configuration options and validation
- Comprehensive cropping functionality tests
- New test cases for image processing, including rotation, grayscale, and validation for invalid parameters
- Validation for crop area dimensions in configuration loading
- Enhanced test case structure with padded test directory naming

### Changed
- Update crop and rotation processing order in screenshot functionality
- Refactor CI workflow to separate screenshot and webserver testing jobs
- Enhanced test summary reporting for screenshot and webserver tests
- Update CI workflow to reference correct path for test cases and enhance README with cropping features
- Reduce minimum screenshot size validation threshold from 1000 bytes to 10 bytes

### Fixed
- Fix webserver screenshot download path in CI workflow
- Update artifact upload path pattern to match numbered test directories
- Skip grayscale detection and validation for palette-based images due to unreliability
- Enhanced grayscale detection in image validation by implementing content analysis
- Refine grayscale detection logic and PNG color type checks

### Removed
- Remove sample configuration files
- Remove redundant header from webserver test results in job summary

## [1.8.0] - 2025-10-11

### Added
- Enhanced per-URL configuration support with comprehensive tests and documentation updates

### Fixed
- Fix bit depth configuration and update comments for rotated dimensions in per-URL tests
- Fix expected bit depth for per-URL object format test case

## [1.7.0] - 2025-10-11

### Added
- Enforce strict configuration validation to prevent container shutdown on invalid values
- Enhanced CI workflow with single test mode and comprehensive matrix testing

### Fixed
- Improve validation output for grayscale and bit depth checks in screenshot tests
- Reduce bit depth from 24 to 8 in test configurations and fallback handling
- Fix JSON escaping for URLs in CI configuration
- Fix syntax for matrix URLs in CI configuration

## [1.5.5] - 2025-10-11

### Added
- **Multi-language support** and updated documentation
- Enhanced long-lived access token handling in screenshot functions to apply to all requests
- Inject long-lived access token into localStorage for Home Assistant authentication

## [1.5.4] - 2025-10-11

### Removed
- Remove redundant EXPOSE directive from Dockerfile

## [1.5.3] - 2025-10-11

### Added
- Add long_lived_access_token option to add-on configuration
- Document long_lived_access_token usage in READMEs

## [1.5.2] - 2025-10-11

### Added
- **Long-lived access token support** for authenticated screenshots

## [1.5.1] - 2025-10-11

### Added
- **Automatic container shutdown** when screenshot failures occur

## [1.5.0] - 2025-10-11

### Added
- **Cleanup of existing screenshots** on container startup

## [1.4.0] - 2025-10-11

### Added
- **Internal web server** feature with optional configuration
- Detailed system information display
- Enhanced logging for image processing
- Host networking support with web server port set to 3000

### Changed
- **Major refactoring**: Split index.js into modular structure
  - Created separate modules for configuration, screenshot functionality, image processing, system info, and web server
- Enhanced README and configuration documentation

### Removed
- Remove development section from README
- Delete REFACTORING.md file

## [1.0.1] - 2025-10-10

### Fixed
- **JPEG Bug Fix**: Refactor bit depth reduction to process PNG files only
- Update logging and remove JPEG handling
- Enhanced feature descriptions and configuration details in README

### Changed
- Change configuration mapping to save screenshots directly to the www folder for easier access
- Refactor code structure for improved readability and maintainability
- Multiple CI workflow improvements and fixes

## [1.0.0] - 2025-10-10

### Added
- **Screenshot rotation** feature with configuration support
- **Grayscale conversion** support for screenshots
- **Adjustable image bit depth** configuration
- **.gitignore** file
- **Local development testing guide**
- **Resolution configuration** support
- **CI workflow** for building and testing screenshot functionality
- **Run-once configuration** option for single execution mode

### Changed
- Update to version 1.0.0 with enhanced features
- Refactor bit depth reduction to use Sharp for improved control
- Add Sharp as a dependency
- Update README and configuration for enhanced features

### Fixed
- Fix screenshot file extension in CI workflow (update checks from .jpg to .png)
- Multiple CI workflow improvements and bug fixes

## [0.4.0] - 2025-10-10

### Added
- Resolution configuration support
- Local development testing guide

## [0.3.0] - 2025-10-10

### Added
- **Enhanced configuration and scheduling features**
- Support for **multiple URLs** with index-based naming for screenshots
- Load configuration from Home Assistant options
- Cron schedule validation and logging
- Updated documentation with new features and usage examples

### Changed
- Update default cron schedule to every minute

### Fixed
- Fix for default values
- Schema fixes

## [0.2.1] - 2025-10-10

### Added
- Enhanced Chromium availability checks in the add-on

### Removed
- Remove test screenshot functionality from initialization

## [0.2.0] - 2025-10-10

### Added
- **Basic screenshot functionality** (Step 2)
- Updated README and Dockerfile for screenshot capabilities

### Fixed
- Remove image reference from configuration

## [0.1.0] - 2025-10-10

### Added
- Initial "hello world" add-on implementation
- Basic project structure and configuration