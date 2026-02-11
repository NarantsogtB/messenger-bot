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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
You are a professional seasonal color analysis assistant.
Context:
- User's Season: ${season || 'Unknown'}
- Language: Mongolian

User Question: ${input}

Instructions:
- Respond ONLY in Mongolian.
- Be EXTREMELY concise (1-2 sentences maximum).
- Goal: Minimize token usage while being helpful.
- If the season is unknown, just ask them to send a photo.
- Do not use unnecessary greetings or filler.
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
        const err = await response.text();
        console.error("Gemini API Error:", err);
        return "Уучлаарай, AI хариу нээхэд алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.";
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Зөвлөгөө өгөхөд алдаа гарлаа.";
}

export async function enableChat(env: Env, userId: string): Promise<void> {
    const state: ChatState = { enabled: true, turnsUsed: 0 };
    await env.KV_MAIN.put(`chat:${userId}`, JSON.stringify(state));
}
