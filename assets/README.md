# Nameless Companion — App Icons

## Required Files

| File | Purpose | Source Size |
|------|---------|-------------|
| `icon.icns` | macOS app icon | 1024×1024 |
| `icon.ico` | Windows app icon | 256×256 |
| `icon.png` | Linux / fallback | 512×512 |
| `tray-icon.png` | Menu bar tray icon | 32×32, white on transparent |
| `dmg-background.png` | DMG installer background | 660×400 |

## Generating from a source PNG

Start with a 1024×1024 source image (your Nameless logo, dark background, rounded corners).

### macOS .icns

```bash
mkdir icon.iconset
for size in 16 32 64 128 256 512; do
  sips -z $size $size source.png --out icon.iconset/icon_${size}x${size}.png
  sips -z $((size*2)) $((size*2)) source.png --out icon.iconset/icon_${size}x${size}@2x.png
done
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset
```

### Windows .ico

```bash
# Requires ImageMagick
convert source.png -resize 256x256 icon.ico
```

### Tray icon

The tray icon MUST be a **white silhouette on transparent background**.
macOS tray uses "template images" that auto-adapt to light/dark menu bars.
A colored or detailed icon looks wrong in the menu bar.

- Create a 32×32 PNG with white (#FFFFFF) logo mark on transparent background
- Save as `tray-icon.png`
- The code calls `setTemplateImage(true)` which handles the color adaptation

### DMG background

- 660×400 PNG
- Dark background matching #0A0A12
- Nameless logo centered, subtle
- "Drag to Applications" hint arrow optional (the icons are positioned at x:180, x:480)
- Keep it minimal — this is a one-time impression
