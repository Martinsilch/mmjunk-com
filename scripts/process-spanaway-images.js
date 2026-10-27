const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'assets', 'images', 'house cleanout & Sorting project');

const imageMappings = [
  {
    src: 'photo_1_2026-10-26_23-52-47.jpg',
    destName: 'spanaway-estate-cleanout-oak-cabinet-donation.webp'
  },
  {
    src: 'photo_2_2026-10-26_23-52-47.jpg',
    destName: 'spanaway-estate-cleanout-document-sorting.webp'
  },
  {
    src: 'photo_3_2026-10-26_23-52-47.jpg',
    destName: 'spanaway-estate-cleanout-bedframe-disassembly.webp'
  },
  {
    src: 'photo_4_2026-10-26_23-52-47.jpg',
    destName: 'spanaway-estate-cleanout-staging-sorting-zone.webp'
  },
  {
    src: 'photo_5_2026-10-26_23-52-47.jpg',
    destName: 'spanaway-estate-cleanout-family-heirlooms-secured.webp'
  },
  {
    src: 'photo_6_2026-10-26_23-52-47.jpg',
    destName: 'spanaway-estate-cleanout-dresser-charity-prep.webp'
  }
];

const targetDirs = [
  path.join(__dirname, '..', 'assets', 'images', 'projects'),
  path.join(__dirname, '..', 'images', 'projects'),
  path.join(__dirname, '..', 'public', 'assets', 'images', 'projects'),
  path.join(__dirname, '..', 'public', 'images', 'projects')
];

// Ensure all target directories exist
for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function convertImages() {
  console.log('Converting Spanaway estate cleanout images to WebP...');

  for (const item of imageMappings) {
    const inputPath = path.join(srcDir, item.src);
    if (!fs.existsSync(inputPath)) {
      console.error(`Source not found: ${inputPath}`);
      continue;
    }

    // Process image: resize to max width 1200 maintaining aspect ratio, 85% webp quality
    const buffer = await sharp(inputPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    for (const dir of targetDirs) {
      const outputPath = path.join(dir, item.destName);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved: ${outputPath} (${buffer.length} bytes)`);
    }
  }

  console.log('All Spanaway images converted and deployed successfully!');
}

convertImages().catch(err => {
  console.error('Image conversion error:', err);
  process.exit(1);
});
