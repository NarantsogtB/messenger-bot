import { Env, QueueJob, Session } from './types';
import { Action } from './constants';
import { fetchImage, hashImage } from './image/fetch';
import { detectFace } from './image/vision';
import { analyzeWithPythonAPI } from './image/python_api';
import { mapResultToSeason } from './decision_engine';
import { formatAnalysisResponse } from './formatter';
import { sendText, sendImage, sendQuickReplies } from './messenger';
import { SeasonType } from './season_types';
import { isUserPaid } from './paid';
import { handleChat, enableChat } from './chat';
import { getPaidRingSelection } from './palette';
import { getSession, updateSession } from './session';
import { incrementMetric } from './metrics';
import { checkQuality } from './image/quality';
import { SEASON_DETAILS } from './season_data';
import * as jpeg from 'jpeg-js';
import { Buffer } from 'node:buffer';

// @ts-ignore
globalThis.Buffer = Buffer;


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
    const message = `Сайн байна уу? Танд энэ өдрийн мэнд хүргэе. Би таны илгээсэн зурагт шинжилгээ хийж, таны төрөлх өнгөний улирлыг тодорхойлоход бэлэн байна.

(Disclaimer: Шинжилгээний хариу гэрэлтүүлгээс хамаарч бага зэрэг зөрөх магадлалтайг анхаарна уу).`;

    await sendText(env, userId, message);
    await updateSession(env, userId, { onboarded: true });
}

async function sendPaidContent(env: Env, userId: string, season: SeasonType, gender: 'male' | 'female') {
    const details = SEASON_DETAILS[season];
    const mapping = mapResultToSeason(season, 'Medium'); // Use Medium if contrast not cached? 
    // Actually, we can fetch lastContrast from KV
    const contrast = await env.KV_MAIN.get(`lastContrast:${userId}`) || 'Medium';
    const slug = mapResultToSeason(season, contrast).templateId;
    
    const baseUrl = env.APP_BASE_URL;

    // 1. Paid Greeting
    await sendText(env, userId, "Баярлалаа. Төлбөр баталгаажлаа. Танд зориулсан 40 өнгө бүхий 'Ring Palette' болон таны зайлсхийх ёстой өнгөнүүдийн жагсаалтыг бэлдлээ. Мөн таны нүүр будалт, үсний өнгө, хувцаслалтад зориулсан мэргэжлийн зөвлөмжийг хүргэж байна.");

    // 2. Deliver Rings
    await sendImage(env, userId, `${baseUrl}/assets/rings/${slug}/harmony_rings.png`);
    await sendImage(env, userId, `${baseUrl}/assets/rings/${slug}/avoid_rings.png`);

    // 3. Deliver recommendations (Example logic: reuse cards or send text)
    // The prompt says "Deliver the mapped harmony_rings.png and avoid_rings.png".
    // And "Professional recommendations for makeup, hair, clothing".
    
    await sendText(env, userId, `✨ МЭРГЭЖЛИЙН ЗӨВЛӨМЖ (${details.nameMn}) ✨

Үсний өнгө: ${details.descriptionMn}
Нүүр будалт: Танд ${details.keywordsMn} өнгөнүүд гайхалтай зохино.
Хувцаслалт: ${details.keywordsMn} туяатай материалуудыг сонгоорой.`);

    // 4. Enable Chat
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
  const cachedData = await env.KV_MAIN.get(cacheKey);
  let season: string;
  let contrast: string;

  if (cachedData) {
      console.log('Cache Hit for image:', hash);
      const data = JSON.parse(cachedData);
      season = data.season;
      contrast = data.contrast;
  } else {
      // 3. Vision API (Optional Quality Check)
      await incrementMetric(env, 'vision_api_calls');
      const face = await detectFace(imageBuffer, env.GOOGLE_VISION_API_KEY);
      
      if (!face) {
          const text = "Царай тод харагдсан, гэрэл сайн зураг илгээнэ үү. / Please send a clear photo with good lighting where your face is visible.";
          await sendText(env, job.userId, text);
          return { ok: false, replyText: text };
      }

      // 4. Python API Analysis
      await incrementMetric(env, 'python_api_calls');
      const pythonResult = await analyzeWithPythonAPI(env, imageBuffer);
      
      if (!pythonResult) {
          const text = "Уучлаарай, шинжилгээ хийхэд алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.";
          await sendText(env, job.userId, text);
          return { ok: false, replyText: text };
      }

      season = pythonResult.season;
      contrast = pythonResult.contrast;
      
      // 5. Cache Result (TTL 7 days)
      await env.KV_MAIN.put(cacheKey, JSON.stringify({ season, contrast }), { expirationTtl: 604800 });
  }

  // 6. Decision Engine Mapping
  const mapping = mapResultToSeason(season, contrast);
  const seasonType = mapping.seasonType;
  const slug = mapping.templateId;
  
  // Store Last Result for User
  await env.KV_MAIN.put(`lastResult:${job.userId}`, seasonType);
  await env.KV_MAIN.put(`lastContrast:${job.userId}`, contrast);

  // 7. Free Phase Response
  const details = SEASON_DETAILS[seasonType];
  const responseText = `Таны шинжилгээний хариу гарлаа. Та ${details.nameMn} төрлийн хүн байна.

Танд хамгийн сайн зохих хэдэн өнгөний жишээг харуулж байна. Дэлгэрэнгүй 40 өнгө бүхий палитраа харахыг хүсвэл төлбөрөө төлнө үү.`;
  
  await sendText(env, job.userId, responseText);
  await sendImage(env, job.userId, `${env.APP_BASE_URL}/assets/summary/summary_${slug}.png`);

  // 8. Auto-send Paid Content if already paid
  const paid = await isUserPaid(env, job.userId);
  if (paid) {
      const session = await getSession(env, job.userId);
      await sendPaidContent(env, job.userId, seasonType, session?.gender || 'female');
  }

  return { ok: true, season: seasonType, replyText: responseText };
}
