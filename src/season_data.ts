import { SeasonType } from './season_types';

export interface SeasonInfo {
  nameMn: string;
  keywordsMn: string;
  keywordsEn: string;
  descriptionMn: string;
  descriptionEn: string;
}

export const SEASON_DETAILS: Record<SeasonType, SeasonInfo> = {
  [SeasonType.LIGHT_SPRING]: {
    nameMn: "Цайвар Хавар",
    keywordsMn: "ТУНГАЛАГ, ДУЛААН, ЦАЙВАР",
    keywordsEn: "CLEAR, WARM, LIGHT",
    descriptionMn: "Танд цайвар, дулаан өнгөнүүд гайхалтай зохино. Хэт бараан эсвэл хэт хурц өнгөнөөс татгалзаарай.",
    descriptionEn: "Light, warm colors suit you best. Avoid extremely dark or vivid shades."
  },
  [SeasonType.TRUE_SPRING]: {
    nameMn: "Жинхэнэ Хавар",
    keywordsMn: "ТОД, ДУЛААН, СИНГЭГ",
    keywordsEn: "VIBRANT, WARM, FRESH",
    descriptionMn: "Дулаан, тод өнгөнүүд таныг гэрэлтүүлэх болно.",
    descriptionEn: "Warm, vibrant colors will make you glow."
  },
  [SeasonType.BRIGHT_SPRING]: {
    nameMn: "Тод Хавар",
    keywordsMn: "ТУНГАЛАГ, ДУЛААН, ТОД",
    keywordsEn: "CLEAR, WARM, VIVID",
    descriptionMn: "Та тод, контрасттай өнгөнүүдэд гайхалтай харагдана.",
    descriptionEn: "You look stunning in clear, high-contrast colors."
  },
  [SeasonType.WARM_SPRING]: {
    nameMn: "Дулаан Хавар",
    keywordsMn: "ДУЛААН, НАРЛАГ, ГЭРЭЛТҮҮЛЭГЧ",
    keywordsEn: "WARM, SUNNY, RADIANT",
    descriptionMn: "Алтан шаргал туяатай дулаан өнгөнүүдийг сонгоорой.",
    descriptionEn: "Choose warm colors with golden undertones."
  },
  [SeasonType.LIGHT_SUMMER]: {
    nameMn: "Цайвар Зун",
    keywordsMn: "ЗӨӨЛӨН, ХҮЙТЭН, ЦАЙВАР",
    keywordsEn: "SOFT, COOL, LIGHT",
    descriptionMn: "Зөөлөн, хүйтэн цайвар өнгөнүүд зохино. Хурц, тод өнгөнөөс зайлсхий.",
    descriptionEn: "Soft, cool, and light colors suit you best. Avoid bright or warm shades."
  },
  [SeasonType.TRUE_SUMMER]: {
    nameMn: "Жинхэнэ Зун",
    keywordsMn: "ЗӨӨЛӨН, ХҮЙТЭН, ТАЙВАН",
    keywordsEn: "SOFT, COOL, CALM",
    descriptionMn: "Хүйтэн, зөөлөн хөх туяатай өнгөнүүд зохино.",
    descriptionEn: "Cool, soft colors with blue undertones are your best match."
  },
  [SeasonType.SOFT_SUMMER]: {
    nameMn: "Зөөлөн Зун",
    keywordsMn: "БҮДЭГ, ХҮЙТЭН, ЗӨӨЛӨН",
    keywordsEn: "MUTED, COOL, SOFT",
    descriptionMn: "Саарал хольцтой, зөөлөн өнгөнүүд зохино.",
    descriptionEn: "Soft, muted colors with a greyish quality suit you well."
  },
  [SeasonType.COOL_SUMMER]: {
    nameMn: "Хүйтэн Зун",
    keywordsMn: "ХҮЙТЭН, ШИНЭЛЭГ, СЭРҮҮН",
    keywordsEn: "COOL, FRESH, BREEZY",
    descriptionMn: "Цэвэр хүйтэн, усан цэнхэр өнгөнүүд зохино.",
    descriptionEn: "Pure cool, watery blue tones are best for you."
  },
  [SeasonType.SOFT_AUTUMN]: {
    nameMn: "Зөөлөн Намар",
    keywordsMn: "БҮДЭГ, ДУЛААН, ШОРООН",
    keywordsEn: "MUTED, WARM, EARTHY",
    descriptionMn: "Зөөлөн, бүдэг бор шаргал өнгөнүүд зохино.",
    descriptionEn: "Soft, muted earthy tones like beige and sand suit you."
  },
  [SeasonType.TRUE_AUTUMN]: {
    nameMn: "Жинхэнэ Намар",
    keywordsMn: "БАЯЛАГ, ДУЛААН, ШОРООН",
    keywordsEn: "RICH, WARM, EARTHY",
    descriptionMn: "Намрын навчис шиг дулаан, баялаг өнгөнүүд танд төгс тохирно.",
    descriptionEn: "Warm, rich earthy colors like autumn leaves are perfect for you."
  },
  [SeasonType.DARK_AUTUMN]: {
    nameMn: "Гүн Намар",
    keywordsMn: "ГҮН, ДУЛААН, БАЯЛАГ",
    keywordsEn: "DEEP, WARM, RICH",
    descriptionMn: "Гүн, дулаан, баялаг өнгөнүүд зохино.",
    descriptionEn: "Deep, warm, and rich colors are your best choices."
  },
  [SeasonType.WARM_AUTUMN]: {
    nameMn: "Дулаан Намар",
    keywordsMn: "ДУЛААН, АЛТАН, БАЯЛАГ",
    keywordsEn: "WARM, GOLDEN, RICH",
    descriptionMn: "Шар туяа давамгайлсан баялаг өнгөнүүд зохино.",
    descriptionEn: "Rich colors with heavy golden undertones suit you best."
  },
  [SeasonType.DARK_WINTER]: {
    nameMn: "Гүн Өвөл",
    keywordsMn: "ГҮН, ХҮЙТЭН, ТОД",
    keywordsEn: "DEEP, COOL, VIVID",
    descriptionMn: "Гүн, тод, хүйтэн өнгөнүүд зохино.",
    descriptionEn: "Deep, vivid, and cool colors are your power colors."
  },
  [SeasonType.TRUE_WINTER]: {
    nameMn: "Жинхэнэ Өвөл",
    keywordsMn: "ХҮЧТЭЙ, ХҮЙТЭН, ТУНГАЛАГ",
    keywordsEn: "BOLD, COOL, CLEAR",
    descriptionMn: "Тэрс хүйтэн, тод, контрасттай өнгөнүүд зохино.",
    descriptionEn: "High-contrast, pure cool colors make you stand out."
  },
  [SeasonType.BRIGHT_WINTER]: {
    nameMn: "Тод Өвөл",
    keywordsMn: "ӨНДӨР КОНТРАСТ, ХҮЙТЭН, ТОД",
    keywordsEn: "HIGH-CONTRAST, COOL, VIVID",
    descriptionMn: "Маш тод, гялалзсан хүйтэн өнгөнүүд зохино.",
    descriptionEn: "Extremely bright and glowing cool colors look great on you."
  },
  [SeasonType.COOL_WINTER]: {
    nameMn: "Хүйтэн Өвөл",
    keywordsMn: "ХҮЙТЭН, ТУНГАЛАГ, МӨСӨН",
    keywordsEn: "COOL, CRISP, ICY",
    descriptionMn: "Цэвэр хүйтэн, мөсөн өнгөнүүд зохино.",
    descriptionEn: "Pure cool, icy tones are best for your features."
  }
};
