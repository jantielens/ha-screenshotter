# Local Development Testing Guide

This guide explains how to test the HA Screenshotter container locally during development.

## Prerequisites

- Docker Desktop installed and running
- PowerShell or Command Prompt
- Text editor for configuration files

## Quick Start

1. **Build the container:**
   ```bash
   cd ha-screenshotter
   docker build -t ha-screenshotter-test .
   ```

2. **Create test configuration and output folder:**
  ```bash
  mkdir -p ha-screenshotter/data ha-screenshotter/config/www/ha-screenshotter
  ```

3. **Configure test settings** (create `ha-screenshotter/data/options.json`; see [Configuration](#configuration) section below)

   Example `options.json` (place in `ha-screenshotter/data/options.json`):

   ```json
   {
     "schedule": "*/5 * * * *",
     "urls": "[\"https://example.com\"]",
     "resolution_width": 800,
     "resolution_height": 600,
     "rotation_degrees": 0,
     "grayscale": false,
     "bit_depth": 24,
     "run_once": true
   }
   ```

4. **Run the container (Windows example above).**

Linux / macOS example:

```bash
# From repository root
docker build -t ha-screenshotter:local -f ha-screenshotter/Dockerfile .
mkdir -p ha-screenshotter/data ha-screenshotter/config/www/ha-screenshotter
# A sample options.json is included at ha-screenshotter/data/options.json and targets https://google.com with run_once=true
docker run --rm -v "$(pwd)/ha-screenshotter/data:/data:ro" -v "$(pwd)/ha-screenshotter/config/www:/config/www:rw" ha-screenshotter:local
```

## Configuration

### Creating Test Configuration

Create a file `data/options.json` with your test settings:

```json
{
  "schedule": "*/2 * * * *",
  "urls": "[\"https://example.com\", \"https://google.com\"]",
  "resolution_width": 1366,
  "resolution_height": 768,
  "rotation_degrees": 0
}
```

### Configuration Options

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `schedule` | string | Cron schedule for screenshots | `"*/2 * * * *"` (every 2 minutes) |
| `urls` | string | JSON array of URLs to screenshot | `"[\"https://example.com\"]"` |
| `resolution_width` | integer | Screenshot width in pixels | `1366` |
| `resolution_height` | integer | Screenshot height in pixels | `768` |
| `rotation_degrees` | integer | Degrees to rotate screenshots (0, 90, 180, 270) | `90` |

### Common Test Resolutions

- **Full HD**: `1920x1080`
- **HD**: `1366x768`
- **4K**: `3840x2160`
- **Mobile**: `375x667`
- **Tablet**: `768x1024`

## Running Tests

### Basic Test Run

```bash
# Navigate to the addon directory
cd ha-screenshotter

# Build the test container
docker build -t ha-screenshotter-test .

# Run with volume mounts (Windows paths)
docker run --rm -v "c:\dev\ha-screenshotter\ha-screenshotter\data:/data" -v "c:\dev\ha-screenshotter\ha-screenshotter\config\www:/config/www" ha-screenshotter-test
```

### Background Test Run

To run the container in the background:

```bash
docker run -d --name ha-screenshotter-test -v "c:\dev\ha-screenshotter\ha-screenshotter\data:/data" -v "c:\dev\ha-screenshotter\ha-screenshotter\share:/share" ha-screenshotter-test
```

View logs:
```bash
docker logs -f ha-screenshotter-test
```

Stop the container:
```bash
docker stop ha-screenshotter-test
docker rm ha-screenshotter-test
```

## Verifying Results

### Check Screenshots


Screenshots are saved to: `/config/www/ha-screenshotter/` (served at `/local/ha-screenshotter/`)

- `0.jpg` - First URL in the list
- `1.jpg` - Second URL in the list
- etc.

### Verify Resolution

Right-click on screenshot files → Properties → Details to verify dimensions match your configuration.

### Log Output

Look for these key log messages:

```
✅ Resolution width from configuration: 1366
✅ Resolution height from configuration: 768
✅ Rotation degrees from configuration: 90
🔧 Configuration loaded: { resolution: '1366x768', rotation: '90°' }
📐 Setting viewport to 1366x768
✅ Screenshot saved: /config/www/ha-screenshotter/0.png
🔄 Rotating image 90°: /config/www/ha-screenshotter/0.png
✅ Image rotated successfully
```

## Troubleshooting

### Container Won't Start

- Ensure Docker Desktop is running
- Check that the image built successfully
- Verify volume mount paths are correct

### Configuration Not Loading

- Verify `data/options.json` exists and has valid JSON
- Check file permissions
- Ensure volume mount path is correct: `-v "full-path-to-data:/data"`

### Screenshots Not Generated

Ensure `/config/www/ha-screenshotter` directory exists

### Invalid Resolution Values

- Ensure resolution values are positive integers
- Very large resolutions may cause browser issues
- Very small resolutions may not render properly

## Test Scenarios

### Resolution Testing

Test different resolutions:

```json
// Mobile portrait
{"resolution_width": 375, "resolution_height": 667}

// Desktop standard
{"resolution_width": 1920, "resolution_height": 1080}

// Ultra-wide
{"resolution_width": 3440, "resolution_height": 1440}
```

### Rotation Testing

Test different rotation angles:

```json
// No rotation (default)
{"rotation_degrees": 0}

// 90 degrees clockwise (portrait displays)
{"rotation_degrees": 90}

// 180 degrees (upside down)
{"rotation_degrees": 180}

// 270 degrees clockwise (landscape displays)
{"rotation_degrees": 270}
```

**Note**: Invalid rotation values (like 45, 135) will default to 0 degrees.

### Schedule Testing

Use frequent schedules for testing:

```json
// Every minute for quick testing
{"schedule": "* * * * *"}

// Every 30 seconds (custom, might not work in all environments)
{"schedule": "*/30 * * * * *"}
```

### URL Testing

Test various website types:

```json
{
  "urls": "[\"https://example.com\", \"https://google.com\", \"https://github.com\"]"
}
```

## Cleanup

### Remove Test Files

Test files are excluded from git via `.gitignore`, but you can manually clean up:

```bash
# Remove test directories
rmdir /s data
rmdir /s config\www\ha-screenshotter

# Remove test container image
docker rmi ha-screenshotter-test
```

### Reset for Fresh Test

```bash
# Stop any running containers
docker stop $(docker ps -q --filter ancestor=ha-screenshotter-test)

# Remove test directories
rmdir /s data share

# Rebuild and retest
docker build -t ha-screenshotter-test .
```

## Development Workflow

1. **Make code changes** in `index.js`, `config.yaml`, etc.
2. **Update test configuration** in `data/options.json` if needed
3. **Rebuild container**: `docker build -t ha-screenshotter-test .`
4. **Run test**: Use docker run command with volume mounts
5. **Verify results** by checking logs and generated screenshots
6. **Iterate** as needed

## Notes

- Test files in `data/` and `share/` directories are automatically excluded from git
- Use absolute Windows paths in volume mounts for reliability
- Container runs as single-shot by default; use background mode for longer testing
- Screenshots are overwritten on each run (same filename per URL index)