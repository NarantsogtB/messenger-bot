import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleChat } from '../src/chat';
import * as messenger from '../src/messenger';

const kvStore = new Map();
const env = {
  KV_MAIN: {
    get: vi.fn((key) => kvStore.get(key)),
    put: vi.fn((key, val) => kvStore.set(key, val)),
  },
  FB_PAGE_ACCESS_TOKEN: 'fake'
};

vi.mock('../src/messenger', () => ({
  sendText: vi.fn()
}));

describe('Chat Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    kvStore.clear();
  });

  const userId = 'uChat';
  
  it('Reject if chat not enabled', async () => {
      // No KV state
      await handleChat(env as any, userId, "Hi");
      expect(messenger.sendText).toHaveBeenCalledWith(expect.anything(), userId, expect.stringContaining('Чатлах эрх нээгдээгүй'));
  });

  it('Respond if enabled and within limit', async () => {
      kvStore.set(`chat:${userId}`, JSON.stringify({ enabled: true, turnsUsed: 5 }));
      
      await handleChat(env as any, userId, "өнгө");
      
      expect(messenger.sendText).toHaveBeenCalledWith(expect.anything(), userId, expect.stringContaining('цайвар өнгөнүүд'));
      
      // Check turn increment
      const state = JSON.parse(kvStore.get(`chat:${userId}`));
      expect(state.turnsUsed).toBe(6);
  });

  it('Block if limit reached', async () => {
      kvStore.set(`chat:${userId}`, JSON.stringify({ enabled: true, turnsUsed: 20 }));
      
      await handleChat(env as any, userId, "Hello");
      
      expect(messenger.sendText).toHaveBeenCalledWith(expect.anything(), userId, expect.stringContaining('лимит дууслаа'));
      
      // Check turn did NOT increment
      const state = JSON.parse(kvStore.get(`chat:${userId}`));
      expect(state.turnsUsed).toBe(20);
  });
});
