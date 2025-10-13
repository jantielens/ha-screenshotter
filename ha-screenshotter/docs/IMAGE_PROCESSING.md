# Advanced Image Processing

Process screenshots with rotation, grayscale conversion, bit depth reduction, and advanced image enhancements including contrast, saturation, gamma correction, and level adjustments.

## How It Works
- **Rotate images** for different display orientations
- **Grayscale and color depth** options (1, 4, 8, 16, 24-bit)
- **Floyd-Steinberg dithering** for smooth gradients
- **Contrast adjustment** to enhance image clarity
- **Saturation control** from full color to grayscale
- **Gamma correction** for display-specific optimization
- **Black/White level adjustments** to crush shadows and highlights
- **Gamma removal** for e-ink displays

### Processing Order
Image processing is performed in the following order:
1. **Screenshot capture** – The full page is rendered and captured.
2. **Cropping** (if configured) – The image is cropped to the specified region.
3. **Advanced processing** (if configured) – Contrast, saturation, gamma, and level adjustments are applied.
4. **Rotation** – The processed image is rotated as specified.
5. **Grayscale conversion** – The image is converted to grayscale if enabled.
6. **Bit depth reduction** – The color depth is reduced, with optional dithering for smoother gradients.

## Configuration Options

### Basic Processing Options
- `rotation_degrees`: Rotate image (0, 90, 180, 270)
- `grayscale`: Convert to grayscale (true/false)
- `bit_depth`: Color depth (1, 4, 8, 16, 24)

### Advanced Processing Options
- `contrast`: Contrast multiplier (1.0 = no change, 2.0 = double contrast)
- `saturation`: Saturation multiplier (1.0 = no change, 0.0 = grayscale)
- `gamma_correction`: Gamma correction value (1.0 = no change, 2.2 = standard)
- `black_level`: Black point as percentage (e.g., "20%" crushes blacks below 20%)
- `white_level`: White point as percentage (e.g., "90%" crushes whites above 90%)
- `remove_gamma`: Remove gamma correction (true/false) - useful for e-ink displays

## Usage Examples

### Basic Examples
```yaml
# Example 1: Black & White for e-ink
grayscale: true
bit_depth: 1

# Example 2: 4-bit color with dithering
rotation_degrees: 90
grayscale: false
bit_depth: 4

# Example 3: Full color, rotated
rotation_degrees: 270
grayscale: false
bit_depth: 24

# Example 4: Grayscale, rotated portrait
rotation_degrees: 90
grayscale: true
bit_depth: 8
```

### Advanced Processing Examples
```yaml
# Example 5: E-ink display optimization
remove_gamma: true        # Remove standard gamma for linear response
contrast: 1.5             # Increase contrast for better readability
black_level: "20%"        # Crush dark grays to black
white_level: "90%"        # Crush light grays to white
grayscale: true
bit_depth: 1

# Example 6: Enhance color screenshots
contrast: 1.3             # Slightly increase contrast
saturation: 1.2           # Make colors more vivid

# Example 7: Desaturated, high-contrast look
saturation: 0.5           # Reduce color intensity
contrast: 1.4             # Increase contrast
black_level: "10%"        # Slightly crush blacks

# Example 8: Custom gamma for specific display
gamma_correction: 2.2     # Apply standard sRGB gamma
contrast: 1.1             # Slight contrast boost

# Example 9: Per-URL advanced settings
urls: '[
  {
    "url": "https://dashboard.local",
    "remove_gamma": true,
    "contrast": 1.5,
    "black_level": "20%"
  },
  {
    "url": "https://weather.com",
    "saturation": 0.8,
    "gamma_correction": 2.2
  }
]'
```

## E-ink Display Optimization

For optimal results on e-ink displays, use this configuration:

```yaml
# Optimized for e-ink displays
remove_gamma: true        # Remove gamma for linear response
contrast: 1.5             # Increase contrast
black_level: "20%"        # Crush shadows to pure black
white_level: "90%"        # Crush highlights to pure white
grayscale: true           # Convert to grayscale
bit_depth: 1              # Pure black and white
```

## Technical Details

### Gamma Correction
- **remove_gamma**: Applies inverse gamma (1/2.2) to linearize the image, useful for displays without built-in gamma correction (like e-ink)
- **gamma_correction**: Applies custom gamma curve for display-specific optimization

### Contrast and Saturation
- **Contrast**: Uses linear transformation to adjust the difference between light and dark areas
- **Saturation**: Controls color intensity from full color (>1.0) to grayscale (0.0)

### Level Adjustments
- **black_level**: Maps the specified percentage to black (0), crushing darker tones
- **white_level**: Maps the specified percentage to white (255), crushing lighter tones
- Useful for improving readability on limited dynamic range displays