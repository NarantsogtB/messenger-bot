import { Face } from './vision';

export interface QualityResult {
  isValid: boolean;
  reason?: string;
}

export function checkQuality(face: Face, imgWidth: number, imgHeight: number): QualityResult {
  // 1. Multiple Faces
  if (face.totalFaces > 1) {
    return { isValid: false, reason: 'Олон хүн илэрсэн' };
  }

  // 2. Face Size Check (Min 20% of area)
  // Simple heuristic: faceBoundingBox area / totalArea
  const faceArea = face.boundingBox.width * face.boundingBox.height;
  const totalArea = imgWidth * imgHeight;
  const faceRatio = faceArea / totalArea;

  if (faceRatio < 0.15) { // Adjusted to 15% as 20% might be too strict for full selfies
    return { isValid: false, reason: 'Нүүр хэтэрхий хол байна' };
  }

  // 3. Blur Detection (Using Google Vision Likelihoods)
  // Likelihood: VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
  const badLikelihoods = ['LIKELY', 'VERY_LIKELY'];
  
  if (face.blurLikelihood && badLikelihoods.includes(face.blurLikelihood)) {
    return { isValid: false, reason: 'Зураг будгарсан байна' };
  }

  // 4. Brightness Check
  if (face.underExposedLikelihood && badLikelihoods.includes(face.underExposedLikelihood)) {
    return { isValid: false, reason: 'Гэрэлтүүлэг хангалтгүй байна' };
  }

  return { isValid: true };
}
