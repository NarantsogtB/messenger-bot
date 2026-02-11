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

  // 3. Process Chat (Mock LLM)
  // In real implementation: call Gemini/OpenAI
  try {
      // Mock delay
      // await new Promise(r => setTimeout(r, 1000));
      
      const reply = await mockLLMResponse(text);
      
      await sendText(env, userId, reply);

      // 4. Update Usage
      state.turnsUsed += 1;
      await env.KV_MAIN.put(chatKey, JSON.stringify(state));

  } catch (error) {
      console.error("Chat Error:", error);
      await sendText(env, userId, "Одоогоор зөвлөгөө өгөхөд алдаа гарлаа. Дахин оролдоно уу.");
  }
}

async function mockLLMResponse(input: string): Promise<string> {
    // Basic echo/heuristic for demo
    if (input.includes('өнгө')) return "Танд цайвар өнгөнүүд илүү зохино.";
    if (input.includes('үс')) return "Байгалийн бор өнгө танд зохимжтой.";
    return "Таны асуултыг хүлээж авлаа. (AI хариулт энд байх болно)";
}

export async function enableChat(env: Env, userId: string): Promise<void> {
    const state: ChatState = { enabled: true, turnsUsed: 0 };
    await env.KV_MAIN.put(`chat:${userId}`, JSON.stringify(state));
}
