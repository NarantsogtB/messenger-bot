import { SeasonType } from './season_types';
import { PALETTES } from './palette/palettes';
import { selectFreePreview } from './palette/selectBalanced';

export function formatAnalysisResponse(seasonType: SeasonType): string {
  const palette = PALETTES[seasonType];
  
  // Use selection logic (Free Mode: 6 best, 4 avoid, NAMES ONLY)
  const bestPreview = selectFreePreview(palette.bestColors, 6);
  const avoidPreview = selectFreePreview(palette.avoidColors, 4);

  const bestList = bestPreview.map(c => `• ${c.name}`).join('\n');
  const avoidList = avoidPreview.map(c => `• ${c.name}`).join('\n');

  return `Таны улирлын төрөл: ${seasonType}.

Танд дараах өнгөнүүд илүү зохино:
${bestList}

Дараах өнгөнөөс зайлсхийгээрэй:
${avoidList}

Зөвлөгөө: ${palette.advice}`;
}
