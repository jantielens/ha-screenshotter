# Image Cropping

Extract specific regions from screenshots using pixel coordinates for focused content.

## How It Works
- Per-URL crop settings
- Crop before rotation and color processing
- Automatic validation of crop areas

## Usage Example
```yaml
urls: '{"https://dashboard.local": {"crop": {"x": 0, "y": 0, "width": 400, "height": 300}}}'
```

Use cropping to focus on headers, sidebars, widgets, or specific panels. 