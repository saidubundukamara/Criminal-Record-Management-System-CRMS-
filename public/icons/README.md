# PWA Icons

This directory contains the Progressive Web App icons for CRMS.

## Quick Generation

### Option 1: Using the generation script (Recommended)

```bash
# Install sharp (image processing library)
npm install --save-dev sharp

# Run the icon generator
node scripts/generate-icons.js
```

This will generate all required icon sizes (72x72 to 512x512) from `icon.svg`.

### Option 2: Using online tools

If you don't want to install sharp, use these online tools:

1. **PWA Builder Image Generator**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload: `public/icons/icon.svg`
   - Download generated icons
   - Extract to this directory

2. **RealFaviconGenerator**
   - Visit: https://realfavicongenerator.net/
   - Upload: `public/icons/icon.svg`
   - Configure PWA settings
   - Download package
   - Extract icons to this directory

### Option 3: Manual creation

Use any image editor (GIMP, Photoshop, Inkscape) to:
1. Open `icon.svg`
2. Export as PNG at each required size:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

## Icon Specifications

- **Background Color**: #1e40af (police blue)
- **Format**: PNG with transparency
- **Purpose**: `any maskable` (supports Android adaptive icons)
- **Safe Area**: 80% of canvas for maskable icons (20% padding)

## Customization

To customize the icon design:
1. Edit `icon.svg` with your design
2. Run the generation script or use online tools
3. Test on different devices and Android with maskable preview

## Testing Maskable Icons

Test your icons for Android adaptive icons:
- Visit: https://maskable.app/editor
- Upload your 512x512 icon
- Verify the safe area looks good in circular, rounded, and square masks

## Icon Sizes Reference

| Size | Purpose |
|------|---------|
| 72x72 | Android (small) |
| 96x96 | Android (medium), Windows tile |
| 128x128 | Chrome Web Store |
| 144x144 | Microsoft tile |
| 152x152 | iOS (iPad) |
| 192x192 | Android (recommended minimum) |
| 384x384 | Android (recommended for high-DPI) |
| 512x512 | PWA splash screens, Android maskable |

## Pan-African Design Note

The current icon features:
- **Blue shield**: Represents police/law enforcement
- **Star**: Symbolizes justice and authority
- **"CRMS" text**: Clear branding

This design is intentionally simple and professional, suitable for law enforcement use across different African countries. Consider localizing the design for specific country deployments if needed.
