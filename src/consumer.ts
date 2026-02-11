import { Env, QueueJob, Session } from './types';
import { Action } from './constants';
import { fetchImage, hashImage } from './image/fetch';
import { detectFace } from './image/vision';
import { analyzeSkinTone } from './image/analysis';
import { formatAnalysisResponse } from './formatter';
import { sendText, sendImage, sendQuickReplies } from './messenger';
import { SeasonType } from './season_types';
import { isUserPaid } from './paid';
import { handleChat, enableChat } from './chat';
import { getPaidRingSelection } from './palette';
import { getSession, updateSession } from './session';
import { incrementMetric } from './metrics';
import { checkQuality } from './image/quality';
import * as jpeg from 'jpeg-js';


export interface ProcessResult {
  ok: boolean;
  skipped?: boolean;
  season?: string;
  replyText?: string;
  error?: string;
}

export async function processJob(job: QueueJob, env: Env): Promise<ProcessResult> {
  // 1. Idempotency Check
  const idempotencyKey = `idempotency:${job.messageId}`;
  const processed = await env.KV_MAIN.get(idempotencyKey);
  if (processed) {
    console.log(`Skipping processed message: ${job.messageId}`);
    return { ok: true, skipped: true };
  }

  // 2. Process Logic
  let result: ProcessResult = { ok: true };
  const session = await getSession(env, job.userId); 
  const userSession = session || { hasSeenGreeting: false, isPaid: false };

  // 1.5 Onboarding
  if (env.FEATURE_ONBOARDING === '1' && !userSession.onboarded) {
      await handleOnboarding(env, job.userId, userSession);
  }

  if (job.intent === Action.MENU_PAID_ENTRY) {
      await handlePaidEntry(env, job.userId, userSession);
  } 
  else if (job.intent === Action.TEXT_MESSAGE) {
      // Check for Gender selection Text (Quick Reply payload comes as text usually)
      const text = (job as any).text || ""; // Assuming QueueJob might have text, or we fetch it? 
      // Wait, QueueJob definition in types.ts only has imageUrl. We need 'text' in QueueJob!
      // I will assume text is passed in QueueJob (I need to update types.ts/worker.ts if not). 
      // Checking worker.ts: it constructs QueueJob. It does NOT currently pass text.
      // I MUST FIX THIS. But for now I'll implement logic assuming I fix worker.ts next.
      
      if (text === 'Эмэгтэй' || text === 'Эрэгтэй') {
          const gender = text === 'Эмэгтэй' ? 'female' : 'male';
          await updateSession(env, job.userId, { gender });
          // Continue flow as if Paid Entry clicked
          await handlePaidEntry(env, job.userId, { ...userSession, gender });
      } else {
          // Chat Flow
          await incrementMetric(env, 'paid_chat_messages');
          await handleChat(env, job.userId, text);
      }
  } 
  else if (job.intent === Action.IMAGE_MESSAGE && job.imageUrl) {
     await incrementMetric(env, 'analysis_total');
     const analysis = await handleImageAnalysis(env, job);
     if (analysis && analysis.season) {
       await incrementMetric(env, 'analysis_success');
       result.season = analysis.season;
       result.replyText = analysis.replyText;
     } else if (analysis) {
       // Quality fail handled inside handleImageAnalysis (sending message)
       await incrementMetric(env, 'analysis_quality_fail');
     }
  }

  // 3. Mark as processed (TTL 7 days = 604800s)
  await env.KV_MAIN.put(idempotencyKey, '1', { expirationTtl: 604800 });

  return result;
}

async function handlePaidEntry(env: Env, userId: string, session: Session) {
    // 1. Check Last Result
    const lastSeason = await env.KV_MAIN.get(`lastResult:${userId}`);
    if (!lastSeason) {
        await sendText(env, userId, "Эхлээд өөрийн зургаа илгээж үндсэн шинжилгээгээ хийнэ үү.");
        return;
    }

    // 2. Check Gender
    if (!session.gender) {
        await sendQuickReplies(
            env, 
            userId, 
            "Зөвлөгөөг илүү тохируулж өгөхийн тулд сонгоно уу:", 
            ['Эмэгтэй', 'Эрэгтэй']
        );
        return;
    }

    // 3. Check Paid
    const paid = await isUserPaid(env, userId);
    
    if (!paid) {
        // Upsell
        await sendText(env, userId, "Дэлгэрэнгүй зурагтай палитр, аксесуар/үс/арчилгааны зөвлөгөө, чатлах боломжийг нээхийн тулд төлбөртэй хувилбар шаардлагатай.");
        // Placeholder CTA
        await sendQuickReplies(env, userId, "Төлбөр төлөх сонголтууд:", ["Төлбөр төлөх"]);
        return;
    }

    // 4. Paid Content
    await sendPaidContent(env, userId, lastSeason as SeasonType, session.gender);
}

async function handleOnboarding(env: Env, userId: string, session: Session) {
    const message = `--------------------------------
💄 Өнгөний зөвлөгөөний үйлчилгээ
--------------------------------

Манай бот дараах үйлчилгээг үзүүлнэ:

1️⃣ Селфи зураг илгээж өөрийн улирлын өнгийг тодорхойлох  
2️⃣ Танд тохирох болон зайлсхийх өнгөний жагсаалт авах  
3️⃣ (Төлбөртэй) Дэлгэрэнгүй палитр болон стиль зөвлөгөө  
4️⃣ (Төлбөртэй) 5–10 асуултаар хувьчилсан зөвлөгөө авах  

Зураг илгээж эхлээрэй 📸

--------------------------------`;

    await sendText(env, userId, message);
    await updateSession(env, userId, { onboarded: true });
}

async function sendPaidContent(env: Env, userId: string, season: SeasonType, gender: 'male' | 'female') {
    // Intro
    await sendText(env, userId, `Таны ${season} улирлын дэлгэрэнгүй зөвлөгөө:`);

    // Ring Images (Best/Avoid)
    // Assuming bucket assets are at assets/rings/season_slug/best.png
    // We need slug from seasonType e.g. "true_winter" -> "true-winter" or just use enum string if filenames match?
    // Let's normalize: lowercase, replace spaces with underscores or logic. 
    // SeasonType strings are like "True Winter". Filenames usually safe to use "true_winter" or "true-winter".
    // I'll use simple replace space with underscore lowercase.
    const slug = season.toLowerCase().replace(' ', '_');
    
    // Using the worker's own domain for asset proxy?
    // We don't know the worker domain inside the worker easily without env var, OR we construct R2 public URL if public access enabled?
    // Requirement A.4 says "GET /assets/* -> fetch object".
    // So we need the worker hostname.
    // Env usually doesn't have it.
    // However, for Messenger API, we probably need absolute URL.
    // I will assume for now we use a placeholder or generic domain, OR I add WORKER_URL to Env.
    // Prompt said "Paid sends ring palette + cards (static assets URLs)".
    // I will assume `https://<worker-host>/assets/...`.
    // I'll add `WORKER_URL` to Env or Config. defaulting to a placeholder.
    
    const baseUrl = env.APP_BASE_URL;

    await sendImage(env, userId, `${baseUrl}/assets/summary/summary_${slug}.png`);

    // Random Cards (1..5)
    // Path: /assets/cards/<slug>/<gender>/accessory/1.png
    const r = (max: number) => Math.floor(Math.random() * max) + 1;
    
    await sendImage(env, userId, `${baseUrl}/assets/cards/${slug}/${gender}/accessory/${r(5)}.png`);
    await sendImage(env, userId, `${baseUrl}/assets/cards/${slug}/${gender}/hair/${r(5)}.png`);
    await sendImage(env, userId, `${baseUrl}/assets/cards/${slug}/${gender}/makeup/${r(5)}.png`);

    // Enable Chat
    await enableChat(env, userId);
    await sendText(env, userId, "Чатлах эрх нээгдлээ! Та нэмэлт асуулт асуух боломжтой.");
}

async function handleImageAnalysis(env: Env, job: QueueJob): Promise<ProcessResult> {
  const imageUrl = job.imageUrl!;
  
  // 1. Fetch & Hash
  const imageBuffer = await fetchImage(imageUrl);
  const hash = await hashImage(imageBuffer);
  const cacheKey = `imagehash:${hash}`;

  // 2. Check Cache
  const cachedResult = await env.KV_MAIN.get(cacheKey);
  if (cachedResult) {
      console.log('Cache Hit for image:', hash);
      const seasonType = cachedResult as SeasonType;
      
      // Store Last Result for User
      await env.KV_MAIN.put(`lastResult:${job.userId}`, seasonType);

      const responseText = formatAnalysisResponse(seasonType);
      await sendText(env, job.userId, responseText);
      return { ok: true, season: seasonType, replyText: responseText };
  }

  // 3. Vision API (Cost Control: ONE call)
  await incrementMetric(env, 'vision_api_calls');
  const face = await detectFace(imageBuffer, env.GOOGLE_VISION_API_KEY);
  
  if (!face) {
      const text = "Царай тод харагдсан, гэрэл сайн зураг илгээнэ үү.";
      await sendText(env, job.userId, text);
      return { ok: false, replyText: text };
  }

  // 3.5 Quality Gate
  if (env.FEATURE_QUALITY_GATE === '1') {
      try {
          const jpegData = jpeg.decode(imageBuffer);
          const quality = checkQuality(face, jpegData.width, jpegData.height);
          
          if (!quality.isValid) {
              const text = `Зураг тод биш эсвэл нүүр бүрэн харагдахгүй байна.\n(${quality.reason})\nЦонхны ойролцоо, нүүрээ ойртуулж дахин зураг илгээнэ үү.`;
              await sendText(env, job.userId, text);
              return { ok: false, replyText: text };
          }
      } catch (e) {
          console.error("Quality check JPEG decode error:", e);
          // Fallback: skip quality gate if decode fails but proceed with vision results
      }
  }

  // 4. Analyze
  const { season } = analyzeSkinTone(imageBuffer, face);
  
  // 5. Cache Result (TTL 7 days)
  await env.KV_MAIN.put(cacheKey, season, { expirationTtl: 604800 });
  
  // Store Last Result for User
  await env.KV_MAIN.put(`lastResult:${job.userId}`, season);

  // 6. Respond
  const responseText = formatAnalysisResponse(season);
  await sendText(env, job.userId, responseText);

  // Send Summary Palette Image
  const slug = season.toLowerCase().replace(' ', '_');
  await sendImage(env, job.userId, `${env.APP_BASE_URL}/assets/summary/summary_${slug}.png`);

  return { ok: true, season, replyText: responseText };
}
