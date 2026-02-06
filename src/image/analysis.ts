import jpeg from 'jpeg-js';
import { Face } from './vision';
import { SeasonType } from '../season_types'; // We'll create this enum

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export function analyzeSkinTone(buffer: ArrayBuffer, face: Face): { season: SeasonType, confidence: number } {
    const rawData = jpeg.decode(buffer, { useTArray: true });
    
    // Sample region: cheek area
    // 60-75% down from top of face, 55-70% from left
    const startX = Math.floor(face.boundingBox.x + face.boundingBox.width * 0.55);
    const startY = Math.floor(face.boundingBox.y + face.boundingBox.height * 0.60);
    const endX = Math.floor(face.boundingBox.x + face.boundingBox.width * 0.70);
    const endY = Math.floor(face.boundingBox.y + face.boundingBox.height * 0.75);

    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            // Check image bounds
            if (x < 0 || x >= rawData.width || y < 0 || y >= rawData.height) continue;

            const idx = (y * rawData.width + x) * 4;
            const r = rawData.data[idx];
            const g = rawData.data[idx + 1];
            const b = rawData.data[idx + 2];

            // Simple outlier filtering (avoid extreme dark/light shadows/highlights)
            if ((r + g + b) > 50 && (r + g + b) < 700) {
               totalR += r;
               totalG += g;
               totalB += b;
               count++;
            }
        }
    }

    if (count === 0) {
        // Fallback if sampling failed significantly, return a safe default
        return { season: SeasonType.TRUE_AUTUMN, confidence: 0.1 }; 
    }

    const avgRGB: RGB = {
        r: Math.round(totalR / count),
        g: Math.round(totalG / count),
        b: Math.round(totalB / count)
    };

    const hsv = rgbToHsv(avgRGB);
    
    // Deterministic Season Logic
    return determineSeason(hsv);
}

function rgbToHsv(rgb: RGB): HSV {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
  let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c)); 
  
  if (h < 0) h += 6;
  
  return {
    h: Math.round(h * 60),
    s: Math.round((v && c / v) * 100),
    v: Math.round(v * 100)
  };
}

function determineSeason(hsv: HSV): { season: SeasonType, confidence: number } {
    let season: SeasonType;
    let confidence = 0.8; 

    // Heuristics for Mongolia/Asian skin tones primarily but covering broad ranges
    // Warm vs Cool based on Hue
    // Typically skin Hue is 10-35. 
    // Lower (redder) -> Cool/Winter/Summer tendency
    // Higher (yellower) -> Warm/Spring/Autumn tendency
    
    const isWarm = hsv.h > 20; 
    const isLight = hsv.v > 60; // Value/Lightness
    const isMuted = hsv.s < 30; // Saturation

    if (isWarm) {
        if (isLight) {
            // Warm + Light -> Spring
             season = isMuted ? SeasonType.LIGHT_SPRING : SeasonType.TRUE_SPRING;
        } else {
             // Warm + Dark -> Autumn
             season = isMuted ? SeasonType.SOFT_AUTUMN : SeasonType.TRUE_AUTUMN;
        }
    } else {
        if (isLight) {
            // Cool + Light -> Summer
            season = isMuted ? SeasonType.SOFT_SUMMER : SeasonType.LIGHT_SUMMER;
        } else {
            // Cool + Dark -> Winter
            season = isMuted ? SeasonType.DARK_WINTER : SeasonType.TRUE_WINTER;
        }
    }
    
    // Simplistic mapping to 16 types for this step
    // Expanding logic can be added later
    return { season, confidence };
}
