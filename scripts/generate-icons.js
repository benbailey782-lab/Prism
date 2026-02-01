// scripts/generate-icons.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, '..', 'assets');

// Read the logo SVG
const svgPath = path.join(assetsDir, 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

// The SVG ellipses have opacity="0.6", so they need a dark background
// to render correctly. Create a composed image.
const BG_COLOR = { r: 9, g: 9, b: 11, alpha: 1 }; // #09090b

async function generate() {
  // First, render the SVG at proper size (scale up from 280x199 to fit 432x308)
  const svgBuffer = await sharp(Buffer.from(svgContent))
    .resize(432, 308, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 512x512 main icon (square, padded)
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: BG_COLOR }
  })
    .composite([{
      input: svgBuffer,
      top: 102,   // Center the 308px height in 512px: (512-308)/2 = 102
      left: 40    // Center the 432px width in 512px: (512-432)/2 = 40
    }])
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  console.log('✓ assets/icon.png (512x512)');

  // 256x256 icon
  await sharp(path.join(assetsDir, 'icon.png'))
    .resize(256, 256)
    .toFile(path.join(assetsDir, 'icon-256.png'));

  console.log('✓ assets/icon-256.png (256x256)');

  // 32x32 tray icon
  await sharp(path.join(assetsDir, 'icon.png'))
    .resize(32, 32)
    .toFile(path.join(assetsDir, 'tray-icon.png'));

  console.log('✓ assets/tray-icon.png (32x32)');

  // 64x64 tray icon @2x (retina)
  await sharp(path.join(assetsDir, 'icon.png'))
    .resize(64, 64)
    .toFile(path.join(assetsDir, 'tray-icon@2x.png'));

  console.log('✓ assets/tray-icon@2x.png (64x64)');

  console.log('\nAll icons generated successfully.');
}

generate().catch(console.error);
