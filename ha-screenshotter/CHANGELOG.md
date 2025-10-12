# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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