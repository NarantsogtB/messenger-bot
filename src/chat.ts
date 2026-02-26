import { Env } from './types';
import { sendText } from './messenger';

const PAID_MAX_TURNS = 20;

interface ChatState {
  enabled: boolean;
  turnsUsed: number;
}

import { isUserPaid } from './paid';

export async function handleChat(env: Env, userId: string, text: string): Promise<void> {
    
  const chatKey = `chat:${userId}`;
  const rawState = await env.KV_MAIN.get(chatKey);
  
  let state: ChatState = rawState ? JSON.parse(rawState) : { enabled: false, turnsUsed: 0 };

  // 1. Check if chat enabled or user is paid (debug mode)
  const paid = await isUserPaid(env, userId);
  if (!state.enabled && !paid) {
      await sendText(env, userId, "Чатлах эрх нээгдээгүй байна. Төлбөртэй хувилбарт шилжинэ үү.");
      return;
  }

  // 2. Check Limits
  if (state.turnsUsed >= PAID_MAX_TURNS) {
      await sendText(env, userId, "Өнөөдрийн зөвлөгөөний лимит дууслаа. Дараа дахин асуугаарай.");
      return;
  }

  // 3. Process Chat (Gemini LLM)
  try {
      const lastSeason = await env.KV_MAIN.get(`lastResult:${userId}`);
      const reply = await callGemini(env, text, lastSeason || undefined);
      
      await sendText(env, userId, reply);

      // 4. Update Usage
      state.turnsUsed += 1;
      await env.KV_MAIN.put(chatKey, JSON.stringify(state));

  } catch (error) {
      console.error("Chat Error:", error);
      await sendText(env, userId, "Одоогоор зөвлөгөө өгөхөд алдаа гарлаа. Дахин оролдоно уу.");
  }
}

async function callGemini(env: Env, input: string, season?: string): Promise<string> {
    const apiKey = env.GOOGLE_VISION_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
    // Or gemini-2.0-flash-lite-preview-02-05 if stable not yet in v1?
    // According to search, 2.0-flash is out. Let's use gemini-2.0-flash-lite

    const prompt = `
You are a Professional Seasonal Color Stylist AI.
Your objective is to provide expert advice on seasonal color analysis, including clothing, makeup, and hair color recommendations based on the user's analyzed features.

Context:
- User's Analyzed Season: ${season || 'Шинжилгээ хийгдээгүй'}
- Language: Strictly Mongolian

Instructions:
- Respond ONLY in natural, professional, and grammatically correct Mongolian.
- Maintain a helpful, polite, and styling-focused tone.
- Be concise but expert (2-3 sentences max).
- If the user's season is unknown, politely encourage them to send a clear photo for analysis.
- Do not use filler or English terms where a Mongolian equivalent exists.
- Focus strictly on seasonal color styling.
`;

    const body = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        if (response.status === 429) {
            return "⏳ AI үйлчилгээ түр ачаалалтай байна.Өдөр тутмын үнэгүй эрх хэтэрсэн байж болзошгүй.15–30 минутын дараа дахин оролдоно уу.";
        }
        const err = await response.text();
        console.error("Gemini API Error:", err);
        return "Уучлаарай, AI хариу өгөхөд алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.";
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Зөвлөгөө өгөхөд алдаа гарлаа.";
}

export async function enableChat(env: Env, userId: string): Promise<void> {
    const state: ChatState = { enabled: true, turnsUsed: 0 };
    await env.KV_MAIN.put(`chat:${userId}`, JSON.stringify(state));
}
