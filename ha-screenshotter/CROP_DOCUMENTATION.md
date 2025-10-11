# Crop Configuration Documentation

The ha-screenshotter now supports cropping screenshots after they are captured. This allows you to extract specific regions of a webpage, such as:

- Header sections only
- Sidebar content
- Specific widgets or panels
- Removing unwanted UI elements
- Focusing on specific dashboard sections

## Configuration Options

### Global Crop Setting

You can set a global crop configuration that applies to all URLs unless overridden:

```yaml
crop:
  x: 100        # X coordinate of top-left corner (pixels from left edge)
  y: 50         # Y coordinate of top-left corner (pixels from top edge) 
  width: 800    # Width of the crop area in pixels
  height: 600   # Height of the crop area in pixels
```

To disable cropping globally, set:
```yaml
crop: null
# or
crop: false
```

### Per-URL Crop Settings

Each URL can have its own crop configuration that overrides the global setting:

#### Array Format
```yaml
urls: '[
  "https://simple-url.com",
  {
    "url": "https://dashboard.com",
    "crop": {
      "x": 0,
      "y": 0, 
      "width": 1920,
      "height": 200
    }
  }
]'
```

#### Object Format  
```yaml
urls: '{
  "https://simple-url.com": {},
  "https://dashboard.com": {
    "crop": {
      "x": 0,
      "y": 0,
      "width": 1920, 
      "height": 200
    }
  }
}'
```

## Processing Order

Image processing operations are applied in this order:
1. **Screenshot capture** - Full viewport screenshot taken
2. **Rotation** - Image rotated if specified
3. **Cropping** - Applied after rotation (works on final dimensions)
4. **Grayscale** - Color conversion applied
5. **Bit depth** - Final bit depth reduction

## Crop Parameters

- **x**: X coordinate of the top-left corner of the crop area (0-based, from left edge)
- **y**: Y coordinate of the top-left corner of the crop area (0-based, from top edge)  
- **width**: Width of the crop area in pixels (must be positive)
- **height**: Height of the crop area in pixels (must be positive)

## Validation Rules

- All crop parameters must be non-negative integers
- Crop area must fit within the image dimensions after rotation
- Missing crop parameters will cause configuration errors
- Invalid crop coordinates will prevent screenshot processing

## Common Use Cases

### Dashboard Header Only
```yaml
crop:
  x: 0
  y: 0
  width: 1920
  height: 100
```

### Sidebar Content
```yaml  
crop:
  x: 0
  y: 100
  width: 300
  height: 800
```

### Center Widget
```yaml
crop:
  x: 660  # (1920 - 600) / 2
  y: 390  # (1080 - 300) / 2  
  width: 600
  height: 300
```

### Mobile View Header (excluding status bar)
```yaml
crop:
  x: 0
  y: 44   # Skip status bar on mobile
  width: 375
  height: 700
```

## Error Handling

The system validates crop parameters and will:
- Log detailed error messages for invalid configurations
- Prevent screenshot processing if crop area exceeds image bounds
- Provide helpful validation feedback during startup

## Tips

1. **Test coordinates**: Use browser developer tools to identify exact pixel coordinates
2. **Consider rotation**: Crop coordinates apply after rotation is applied
3. **Viewport sizing**: Ensure your viewport size accommodates the desired crop area
4. **Performance**: Cropping reduces final image size, improving storage and transfer efficiency