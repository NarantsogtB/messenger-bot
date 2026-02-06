export * from './palettes';
export * from './selectBalanced';
import { PALETTES } from './palettes';
import { selectBalancedColors } from './selectBalanced';
import { SeasonType } from '../season_types';

export function getPaidRingSelection(seasonType: SeasonType) {
  const palette = PALETTES[seasonType];
  const best12 = selectBalancedColors(palette.bestColors, 12);
  const avoid12 = selectBalancedColors(palette.avoidColors, 12);
  
  return { best12, avoid12 };
}
