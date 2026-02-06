import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processJob } from '../src/consumer';
import { Action } from '../src/constants';
import { QueueJob } from '../src/types';
import * as messenger from '../src/messenger';
import { SeasonType } from '../src/season_types';

// Mock Dependencies
const kvStore = new Map();
const env = {
  KV_MAIN: {
    get: vi.fn((key, type) => {
        const val = kvStore.get(key);
        if (val && type === 'json') {
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    }),
    put: vi.fn((key, val) => kvStore.set(key, val)),
  },
  FB_PAGE_ACCESS_TOKEN: 'fake-token',
  WORKER_URL: 'https://test-worker'
};

vi.mock('../src/messenger', () => ({
  sendText: vi.fn(),
  sendImage: vi.fn(),
  sendQuickReplies: vi.fn()
}));

describe('Paid Consumer Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    kvStore.clear();
  });

  const userId = 'u1';

  it('MENU_PAID_ENTRY: asks for photo if no last result', async () => {
    const job: QueueJob = { userId, messageId: 'm1', intent: Action.MENU_PAID_ENTRY, timestamp: 123 };
    await processJob(job, env as any);
    
    expect(messenger.sendText).toHaveBeenCalledWith(
        expect.anything(), 
        userId, 
        expect.stringContaining('Эхлээд өөрийн зургаа')
    );
  });

  it('MENU_PAID_ENTRY: asks for gender if known season but no gender', async () => {
    // Setup Last Result
    kvStore.set(`lastResult:${userId}`, SeasonType.TRUE_WINTER);
    // No gender in session (default fetch mock in consumer uses getSession... we invoke processJob which calls getSession)
    // We need to mock getSession? 
    // Wait, processJob calls getSession or assumes default.
    // In consumer.ts I imported getSession from './session'. I need to mock that module or it relies on KV?
    // getSession reads KV `session:${userId}`. So I can set KV.
    
    // Default session (no gender)
    
    const job: QueueJob = { userId, messageId: 'm2', intent: Action.MENU_PAID_ENTRY, timestamp: 123 };
    await processJob(job, env as any);

    expect(messenger.sendQuickReplies).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        expect.stringContaining('сонгоно уу'),
        ['Эмэгтэй', 'Эрэгтэй']
    );
  });

  it('MENU_PAID_ENTRY: Upsells if gender known but NOT paid', async () => {
    kvStore.set(`lastResult:${userId}`, SeasonType.TRUE_WINTER);
    kvStore.set(`session:${userId}`, JSON.stringify({ gender: 'female' })); // Session exists with gender

    const job: QueueJob = { userId, messageId: 'm3', intent: Action.MENU_PAID_ENTRY, timestamp: 123 };
    await processJob(job, env as any);

    expect(messenger.sendText).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        expect.stringContaining('төлбөртэй хувилбар шаардлагатай')
    );
  });

  it('MENU_PAID_ENTRY: Delivers content if Paid', async () => {
    kvStore.set(`lastResult:${userId}`, SeasonType.TRUE_WINTER);
    kvStore.set(`session:${userId}`, JSON.stringify({ gender: 'female' }));
    kvStore.set(`paid:${userId}`, '1'); // Paid!

    const job: QueueJob = { userId, messageId: 'm4', intent: Action.MENU_PAID_ENTRY, timestamp: 123 };
    
    await processJob(job, env as any);

    // Should send text intro, ring images, card images
    expect(messenger.sendText).toHaveBeenCalledWith(expect.anything(), userId, expect.stringContaining('дэлгэрэнгүй зөвлөгөө'));
    expect(messenger.sendImage).toHaveBeenCalledTimes(5); // 2 Rings + 3 Cards
    
    // Check URLs
    expect(messenger.sendImage).toHaveBeenCalledWith(expect.anything(), userId, expect.stringContaining('best.png'));
    expect(messenger.sendImage).toHaveBeenCalledWith(expect.anything(), userId, expect.stringContaining('accessory'));
  });
});
