import { SeasonType } from './season_types';

export interface MappingResult {
  seasonType: SeasonType;
  templateId: string;
}

export function mapResultToSeason(season: string, contrast: string): MappingResult {
  const s = season.toLowerCase();
  const c = contrast.toLowerCase();

  let seasonType: SeasonType = SeasonType.TRUE_AUTUMN; // Default
  let templateId = 'true-autumn';

  if (s.includes('winter')) {
    if (c === 'high') {
      seasonType = SeasonType.BRIGHT_WINTER;
      templateId = 'bright-winter';
    } else if (c === 'low') {
      seasonType = SeasonType.DARK_WINTER;
      templateId = 'dark-winter';
    } else {
      seasonType = SeasonType.TRUE_WINTER;
      templateId = 'true-winter';
    }
  } else if (s.includes('summer')) {
    if (c === 'high') {
      seasonType = SeasonType.COOL_SUMMER;
      templateId = 'cool-summer';
    } else if (c === 'low') {
      seasonType = SeasonType.LIGHT_SUMMER;
      templateId = 'light-summer';
    } else {
      seasonType = SeasonType.SOFT_SUMMER;
      templateId = 'soft-summer';
    }
  } else if (s.includes('spring')) {
    if (c === 'high') {
      seasonType = SeasonType.BRIGHT_SPRING;
      templateId = 'bright-spring';
    } else if (c === 'low') {
      seasonType = SeasonType.LIGHT_SPRING;
      templateId = 'light-spring';
    } else {
      seasonType = SeasonType.TRUE_SPRING;
      templateId = 'true-spring';
    }
  } else if (s.includes('autumn')) {
    if (c === 'high') {
      seasonType = SeasonType.DARK_AUTUMN;
      templateId = 'dark-autumn';
    } else if (c === 'low') {
      seasonType = SeasonType.SOFT_AUTUMN;
      templateId = 'soft-autumn';
    } else {
      seasonType = SeasonType.TRUE_AUTUMN;
      templateId = 'true-autumn';
    }
  }

  return { seasonType, templateId };
}
