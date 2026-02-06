import { ColorEntry } from './palettes';

interface HSV {
  h: number;
  s: number;
  v: number;
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function getHueBucket(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  // 8 buckets: 0-45, 45-90, ...
  return Math.floor(hsv.h / 45) % 8;
}

function uniqByHex(colors: ColorEntry[]): ColorEntry[] {
  const seen = new Set<string>();
  return colors.filter(c => {
    const k = c.hex.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function selectBalancedColors(colors: ColorEntry[], count = 12): ColorEntry[] {
  const unique = uniqByHex(colors);
  
  const neutrals = unique.filter(c => c.group === 'neutral');
  const cores = unique.filter(c => c.group === 'core');
  const accents = unique.filter(c => c.group === 'accent');
  
  const selection: ColorEntry[] = [];
  const usedHex = new Set<string>();

  const add = (c: ColorEntry) => {
    if (!usedHex.has(c.hex)) {
      selection.push(c);
      usedHex.add(c.hex);
    }
  };

  // 1. Neutrals: Take 3
  const pickedNeutrals = neutrals.slice(0, 3);
  pickedNeutrals.forEach(add);

  // 2. Accents: Take 2
  const pickedAccents = accents.slice(0, 2);
  pickedAccents.forEach(add);

  // 3. Core: Take 7, ensuring hue diversity
  // If not enough neutrals/accents were found, we fill the gap with cores later
  
  // We want to fill the remaining slots (target count - current selection)
  // mostly with cores, but diversifying hue.
  
  const remainingSlots = count - selection.length;
  // Candidates for filling: cores -> then accents -> then neutrals
  const candidates = [...cores, ...accents.slice(2), ...neutrals.slice(3)];
  
  // Group candidates by hue bucket
  const buckets: ColorEntry[][] = Array.from({ length: 8 }, () => []);
  candidates.forEach(c => {
    const b = getHueBucket(c.hex);
    buckets[b].push(c);
  });
  
  // Round-robin selection from buckets to maximize diversity
  let bucketIdx = 0;
  let attempts = 0;
  while (selection.length < count && attempts < candidates.length * 2) {
    const bucket = buckets[bucketIdx];
    if (bucket.length > 0) {
      // Pick one from this bucket
      const picked = bucket.shift();
      if (picked && !usedHex.has(picked.hex)) {
        add(picked);
      }
    }
    bucketIdx = (bucketIdx + 1) % 8;
    attempts++;
  }

  // If still strictly under count (palette too small?), just force fill from original list
  if (selection.length < count) {
     for (const c of unique) {
       if (selection.length >= count) break;
       add(c);
     }
  }

  return selection.slice(0, count);
}

export function selectFreePreview(colors: ColorEntry[], count: number): ColorEntry[] {
  // Free preview rules:
  // - Human friendly mix
  // - 2 neutrals (if available)
  // - 1 accent (if available)
  // - rest core
  // - Unique names if possible (since we only show names) -> handled by unique object ref mostly, but let's check names
  
  const unique = uniqByHex(colors);
  const neutrals = unique.filter(c => c.group === 'neutral');
  const accents = unique.filter(c => c.group === 'accent');
  const cores = unique.filter(c => c.group === 'core');
  
  const selection: ColorEntry[] = [];
  const usedNames = new Set<string>();
  
  const add = (c: ColorEntry) => {
     if (!usedNames.has(c.name)) {
       selection.push(c);
       usedNames.add(c.name);
     }
  };

  // 2 Neutrals
  neutrals.slice(0, 2).forEach(add);
  
  // 1 Accent
  accents.slice(0, 1).forEach(add);
  
  // Fill rest with core (diverse hues ideally)
  const remaining = count - selection.length;
  if (remaining > 0) {
    // simple slice for now, assuming cores are somewhat mixed or random access
    cores.forEach(c => {
      if (selection.length < count) add(c);
    });
  }

  // Fill checks
  if (selection.length < count) {
     // try remaining accents/neutrals
     [...accents, ...neutrals].forEach(c => {
       if (selection.length < count) add(c);
     });
  }

  return selection.slice(0, count);
}
