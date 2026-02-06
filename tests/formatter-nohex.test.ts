import { describe, it, expect } from 'vitest';
import { formatAnalysisResponse } from '../src/formatter';
import { SeasonType } from '../src/season_types';

describe('Formatter Safety', () => {
  it('NEVER shows HEX codes in Free Mode output', () => {
    // Check ALL season types
    const seasons = Object.values(SeasonType);
    
    seasons.forEach(season => {
       const text = formatAnalysisResponse(season);
       // Regex looking for # followed by 3-6 hex digits
       // We use a stricter one than before to catch #123456
       const hexRegex = /#[0-9A-Fa-f]{3,8}/;
       
       if (hexRegex.test(text)) {
           console.error(`Season ${season} failed safety check! Output contains potential hex.`);
           console.log(text);
       }
       expect(text).not.toMatch(hexRegex);
    });
  });

  it('Contains bullet points', () => {
    const text = formatAnalysisResponse(SeasonType.TRUE_WINTER);
    expect(text).toContain('•');
  });
});
