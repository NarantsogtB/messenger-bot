import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'assets/palettes/summary-palettes.json');
const OUTPUT_DIR = path.join(process.cwd(), 'assets/summary');

interface PaletteData {
  keywords: string[];
  best: string[];
  avoid: string[];
}

async function generateImages() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const data: Record<string, PaletteData> = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

  for (const [season, info] of Object.entries(data)) {
    const slug = season.toLowerCase().replace(/\s+/g, '_');
    const outputPath = path.join(OUTPUT_DIR, `summary_${slug}.png`);

    const svg = createSVG(season, info);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`Generated: ${outputPath}`);
  }
}

function createSVG(name: string, info: PaletteData): string {
  const title = name.toUpperCase();
  const subtext = info.keywords.join(' • ');

  // Swatch config
  const swatchWidth = 140;
  const swatchHeight = 140;
  const gap = 16;
  const borderRadius = 24;

  const startX = (1080 - (6 * swatchWidth + 5 * gap)) / 2;
  const avoidStartX = (1080 - (4 * swatchWidth + 3 * gap)) / 2;

  const bestSwatches = info.best.map((color, i) => {
    const x = startX + i * (swatchWidth + gap);
    return `<rect x="${x}" y="420" width="${swatchWidth}" height="${swatchHeight}" rx="${borderRadius}" fill="${color}" />`;
  }).join('');

  const avoidSwatches = info.avoid.map((color, i) => {
    const x = avoidStartX + i * (swatchWidth + gap);
    return `<rect x="${x}" y="760" width="${swatchWidth}" height="${swatchHeight}" rx="${borderRadius}" fill="${color}" />`;
  }).join('');

  return `
    <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#FFFFFF" />
      
      <!-- Season Title -->
      <text x="540" y="220" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="bold" fill="#333333">${title}</text>
      
      <!-- Keywords -->
      <text x="540" y="290" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="normal" fill="#666666" letter-spacing="2">${subtext}</text>
      
      <!-- Best Section -->
      <text x="540" y="380" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#999999" letter-spacing="1">BEST</text>
      ${bestSwatches}
      
      <!-- Avoid Section -->
      <text x="540" y="720" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#999999" letter-spacing="1">AVOID</text>
      ${avoidSwatches}
      
    </svg>
  `;
}

generateImages().catch(err => {
  console.error(err);
  process.exit(1);
});
