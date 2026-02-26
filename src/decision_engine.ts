import { SeasonType } from './season_types';

export interface MappingResult {
  seasonType: SeasonType;
  templateId: string;
}

export function mapResultToSeason(season: string, contrast: string): MappingResult {
  const s = season.toLowerCase();
  const c = contrast.toLowerCase();

  let seasonType: SeasonType = SeasonType.TRUE_AUTUMN; // Default
  let templateId = 'true_autumn';

  if (s.includes('winter')) {
    if (c === 'high') {
      seasonType = SeasonType.BRIGHT_WINTER;
      templateId = 'bright_winter';
    } else if (c === 'low') {
      seasonType = SeasonType.DARK_WINTER;
      templateId = 'dark_winter';
    } else {
      seasonType = SeasonType.TRUE_WINTER;
      templateId = 'true_winter';
    }
  } else if (s.includes('summer')) {
    if (c === 'high') {
      seasonType = SeasonType.COOL_SUMMER;
      templateId = 'cool_summer';
    } else if (c === 'low') {
      seasonType = SeasonType.LIGHT_SUMMER;
      templateId = 'light_summer';
    } else {
      seasonType = SeasonType.SOFT_SUMMER;
      templateId = 'soft_summer';
    }
  } else if (s.includes('spring')) {
    if (c === 'high') {
      seasonType = SeasonType.BRIGHT_SPRING;
      templateId = 'bright_spring';
    } else if (c === 'low') {
      seasonType = SeasonType.LIGHT_SPRING;
      templateId = 'light_spring';
    } else {
      seasonType = SeasonType.TRUE_SPRING;
      templateId = 'true_spring';
    }
  } else if (s.includes('autumn')) {
    if (c === 'high') {
      seasonType = SeasonType.DARK_AUTUMN;
      templateId = 'dark_autumn';
    } else if (c === 'low') {
      seasonType = SeasonType.SOFT_AUTUMN;
      templateId = 'soft_autumn';
    } else {
      seasonType = SeasonType.TRUE_AUTUMN;
      templateId = 'true_autumn';
    }
  }

  return { seasonType, templateId };
}
