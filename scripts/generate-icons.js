/**
 * PWA Icon Generator Script
 * Generates PNG icons from SVG source in multiple sizes
 *
 * Usage:
 *   npm install sharp (if not installed)
 *   node scripts/generate-icons.js
 *
 * Alternative: Use online tools like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const fs = require('fs');
const path = require('path');

// Try to import sharp (will fail if not installed)
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('\n⚠️  Sharp not installed. To generate icons automatically:');
  console.log('   npm install --save-dev sharp');
  console.log('   node scripts/generate-icons.js\n');
  console.log('📝 Alternative: Generate icons manually using online tools:');
  console.log('   1. Visit: https://realfavicongenerator.net/');
  console.log('   2. Upload: public/icons/icon.svg');
  console.log('   3. Download generated icons');
  console.log('   4. Place in: public/icons/\n');
  process.exit(0);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  if (!fs.existsSync(inputSvg)) {
    console.error('❌ Source SVG not found:', inputSvg);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let generated = 0;
  let failed = 0;

  for (const size of sizes) {
    try {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

      await sharp(inputSvg)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 30, g: 64, b: 175, alpha: 1 } // #1e40af background
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
      generated++;
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
      failed++;
    }
  }

  console.log(`\n✨ Icon generation complete!`);
  console.log(`   Generated: ${generated} icons`);
  if (failed > 0) {
    console.log(`   Failed: ${failed} icons`);
  }
}

generateIcons().catch(console.error);
