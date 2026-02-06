import { describe, it, expect } from 'vitest';
import { PALETTES } from '../src/palette/palettes';
import { SeasonType } from '../src/season_types';

describe('Palette Data Coverage', () => {
  const seasons = Object.values(SeasonType);

  it('Has entry for every season type', () => {
    seasons.forEach(s => {
      expect(PALETTES[s]).toBeDefined();
    });
  });

  it('Each palette has reliable counts (>40)', () => {
    seasons.forEach(s => {
      const p = PALETTES[s];
      expect(p.bestColors.length).toBeGreaterThanOrEqual(40);
      expect(p.avoidColors.length).toBeGreaterThanOrEqual(40);
    });
  });

  it('Each palette has required groups', () => {
     seasons.forEach(s => {
         const p = PALETTES[s];
         
         const hasNeutral = p.bestColors.some(c => c.group === 'neutral');
         const hasCore = p.bestColors.some(c => c.group === 'core');
         const hasAccent = p.bestColors.some(c => c.group === 'accent');
         
         expect(hasNeutral).toBe(true);
         expect(hasCore).toBe(true);
         expect(hasAccent).toBe(true);
     });
  });
  
  it('Avoid colors have names', () => {
      seasons.forEach(s => {
          const p = PALETTES[s];
          p.avoidColors.forEach(c => {
             expect(c.name).toBeTruthy();
             expect(c.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
          });
      });
  });
});
