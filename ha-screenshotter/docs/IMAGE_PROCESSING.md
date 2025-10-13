# Advanced Image Processing

Process screenshots with rotation, grayscale conversion, and bit depth reduction.

## How It Works
- Rotate images for different display orientations
- Grayscale and color depth options (1, 4, 8, 16, 24-bit)
- Floyd-Steinberg dithering for smooth gradients

### Processing Order
Image processing is performed in the following order:
1. **Screenshot capture** – The full page is rendered and captured.
2. **Cropping** (if configured) – The image is cropped to the specified region.
3. **Rotation** – The cropped image is rotated as specified.
4. **Grayscale conversion** – The image is converted to grayscale if enabled.
5. **Bit depth reduction** – The color depth is reduced, with optional dithering for smoother gradients.

## Usage Examples
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