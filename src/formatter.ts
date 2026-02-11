import { SeasonType } from './season_types';
import { SEASON_DETAILS } from './season_data';

export function formatAnalysisResponse(seasonType: SeasonType): string {
  const details = SEASON_DETAILS[seasonType];
  
  const response = `✨ ШИНЖИЛГЭЭНИЙ ХАРИУ / ANALYSIS RESULT ✨

--------------------------------
УЛИРЛЫН ТӨРӨЛ / SEASON TYPE:
👉 ${seasonType} (${details.nameMn})
--------------------------------

ТӨЛӨВ / CHARACTERISTICS:
✅ ${details.keywordsMn}
✅ ${details.keywordsEn}

ЗӨВЛӨГӨӨ / ADVICE:
🇲🇳 ${details.descriptionMn}
🇺🇸 ${details.descriptionEn}

--------------------------------
👇 Таны өнгөний дэлгэрэнгүй палитрыг доорх зургаас харна уу.
Check your detailed color palette in the image below.
`;

  return response;
}
