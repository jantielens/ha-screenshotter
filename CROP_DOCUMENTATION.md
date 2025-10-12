# Crop Configuration Documentation

The ha-screenshotter supports cropping screenshots after they are captured. This allows you to extract specific regions of a webpage, such as:

- Header sections only
- Sidebar content
- Specific widgets or panels
- Removing unwanted UI elements
- Focusing on specific dashboard sections

## Configuration Options

### Per-URL Crop Settings

Each URL can have its own crop configuration:

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
2. **Cropping** - Applied to original image (coordinates relative to viewport)
3. **Rotation** - Cropped image rotated if specified
4. **Grayscale** - Color conversion applied
5. **Bit depth** - Final bit depth reduction

## Crop Parameters

- **x**: X coordinate of the top-left corner of the crop area (0-based, from left edge)
- **y**: Y coordinate of the top-left corner of the crop area (0-based, from top edge)  
- **width**: Width of the crop area in pixels (must be positive)
- **height**: Height of the crop area in pixels (must be positive)

## Validation Rules

- All crop parameters must be non-negative integers
- Crop area must fit within the image dimensions before rotation
- Missing crop parameters will cause configuration errors
- Invalid crop coordinates will prevent screenshot processing

## Common Use Cases

### Dashboard Header Only
```yaml
urls: '[{
  "url": "https://dashboard.com",
  "crop": {
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 100
  }
}]'
```

### Sidebar Content
```yaml  
urls: '[{
  "url": "https://dashboard.com",
  "crop": {
    "x": 0,
    "y": 100,
    "width": 300,
    "height": 800
  }
}]'
```

### Center Widget
```yaml
urls: '[{
  "url": "https://dashboard.com",
  "crop": {
    "x": 660,
    "y": 390,
    "width": 600,
    "height": 300
  }
}]'
```

### Mobile View Header (excluding status bar)
```yaml
urls: '[{
  "url": "https://github.com/jantielens/ha-screenshotter",
  "crop": {
    "x": 0,
    "y": 44,
    "width": 375,
    "height": 700
  }
}]'
```

## Error Handling

The system validates crop parameters and will:
- Log detailed error messages for invalid configurations
- Prevent screenshot processing if crop area exceeds image bounds
- Provide helpful validation feedback during startup

## Tips

1. **Test coordinates**: Use browser developer tools to identify exact pixel coordinates
2. **Original coordinates**: Crop coordinates are relative to the original viewport before rotation
3. **Viewport sizing**: Ensure your viewport size accommodates the desired crop area
4. **Performance**: Cropping reduces final image size, improving storage and transfer efficiency