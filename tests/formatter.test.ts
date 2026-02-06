import { describe, it, expect } from 'vitest';
import { formatAnalysisResponse } from '../src/formatter';
import { SeasonType } from '../src/season_types';

describe('Formatter', () => {
  it('should not contain HEX codes', () => {
    const text = formatAnalysisResponse(SeasonType.TRUE_SUMMER);
    // Regex for hex codes like #FFFFFF or #fff
    expect(text).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it('should contain Mongolian Season Name', () => {
    const text = formatAnalysisResponse(SeasonType.TRUE_SUMMER);
    expect(text).toContain('True Summer');
  });

  it('should contain bullet points', () => {
    const text = formatAnalysisResponse(SeasonType.TRUE_AUTUMN);
    expect(text).toContain('•');
  });
});
