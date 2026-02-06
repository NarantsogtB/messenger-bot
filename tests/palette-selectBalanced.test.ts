import { describe, it, expect } from 'vitest';
import { selectBalancedColors, selectFreePreview } from '../src/palette/selectBalanced';
import { ColorEntry } from '../src/palette/palettes';

// Helpers to generate dummy colors
const createColor = (hex: string, group: any, name = 'Test'): ColorEntry => ({ name: name + hex, hex, group });

describe('selectBalancedColors', () => {
  it('returns exactly requested count (12 by default)', () => {
    // Large enough input
    const input = Array.from({ length: 20 }, (_, i) => {
        const h = i.toString(16).padStart(2, '0');
        return createColor(`#${h}${h}${h}`, 'core');
    });
    const result = selectBalancedColors(input, 12);
    expect(result).toHaveLength(12);
  });

  it('filters duplicates', () => {
    const input = [
        createColor('#FFFFFF', 'core'),
        createColor('#FFFFFF', 'core'),
        createColor('#000000', 'core')
    ];
    const result = selectBalancedColors(input, 3);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.hex)).toEqual(['#FFFFFF', '#000000']);
  });

  it('prioritizes required composition: 3 neutrals, 2 accents', () => {
     const pool: ColorEntry[] = [
         createColor('#CCCCCC', 'neutral', 'N1'),
         createColor('#DDDDDD', 'neutral', 'N2'),
         createColor('#EEEEEE', 'neutral', 'N3'),
         createColor('#888888', 'neutral', 'N4'),
         
         createColor('#FF0000', 'accent', 'A1'),
         createColor('#00FF00', 'accent', 'A2'),
         createColor('#0000FF', 'accent', 'A3'),
         
         // Fill with cores (diverse hues essentially or just distinct hexes)
         ...Array.from({ length: 10 }, (_, i) => createColor(`#${i}${i}0000`, 'core', `C${i}`))
     ];

     const result = selectBalancedColors(pool, 12);
     
     const neutrals = result.filter(c => c.group === 'neutral');
     const accents = result.filter(c => c.group === 'accent');
     const cores = result.filter(c => c.group === 'core');

     // Expect 3 neutrals (since we have at least 3)
     // Expect at least 3 neutrals
     expect(neutrals.length).toBeGreaterThanOrEqual(3);
     // Expect at least 2 accents
     expect(accents.length).toBeGreaterThanOrEqual(2);
     // Cores should fill the rest
     expect(cores.length).toBeGreaterThan(0);
  });
});

describe('selectFreePreview', () => {
  it('returns 6 items by default (logic usage)', () => {
     const input = Array.from({ length: 20 }, (_, i) => createColor(`#${i}0${i}0${i}0`, 'core'));
     const result = selectFreePreview(input, 6);
     expect(result).toHaveLength(6);
  });

  it('selects 2 neutrals if available', () => {
     const pool: ColorEntry[] = [
         createColor('#CCCCCC', 'neutral', 'N1'),
         createColor('#DDDDDD', 'neutral', 'N2'),
         createColor('#EEEEEE', 'neutral', 'N3'),
         ...Array.from({ length: 10 }, (_, i) => createColor(`#${i}0${i}0${i}0`, 'core'))
     ];
     const result = selectFreePreview(pool, 6);
     const neutrals = result.filter(c => c.group === 'neutral');
     expect(neutrals).toHaveLength(2);
  });
});
