import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processJob } from '../src/consumer';
import { Action } from '../src/constants';
import { QueueJob, Env } from '../src/types';
import { SeasonType } from '../src/season_types';

// Mocks
const mockDetectFace = vi.fn();
const mockFetchImage = vi.fn();
const mockHashImage = vi.fn();
const mockAnalyzeSkinTone = vi.fn();
const mockSendText = vi.fn();

vi.mock('../src/image/vision', () => ({
  detectFace: (...args: any[]) => mockDetectFace(...args)
}));

vi.mock('../src/image/fetch', () => ({
  fetchImage: (...args: any[]) => mockFetchImage(...args),
  hashImage: (...args: any[]) => mockHashImage(...args)
}));

vi.mock('../src/image/analysis', () => ({
  analyzeSkinTone: (...args: any[]) => mockAnalyzeSkinTone(...args)
}));

vi.mock('../src/messenger', () => ({
  sendText: (...args: any[]) => mockSendText(...args)
}));

// Mock KV
const kvStore = new Map<string, any>();
const mockKV = {
  get: vi.fn(async (key: string) => kvStore.get(key) || null),
  put: vi.fn(async (key: string, value: any) => kvStore.set(key, value)),
};

const mockEnv = {
  KV_MAIN: mockKV,
  GOOGLE_VISION_API_KEY: 'test-key',
  MESSENGER_QUEUE: {},
  MESSENGER_VERIFY_TOKEN: 'token',
  MESSENGER_APP_SECRET: 'secret',
  FB_PAGE_ACCESS_TOKEN: 'access-token',
} as unknown as Env;

describe('Consumer processJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    kvStore.clear();
    mockFetchImage.mockResolvedValue(new Uint8Array([1, 2, 3]));
    mockHashImage.mockResolvedValue('hash-123');
    mockAnalyzeSkinTone.mockReturnValue({ season: SeasonType.TRUE_WINTER, confidence: 0.9 });
  });

  const baseJob: QueueJob = {
    userId: 'user-1',
    messageId: 'msg-1',
    intent: Action.IMAGE_MESSAGE,
    imageUrl: 'http://example.com/photo.jpg',
    timestamp: 123456
  };

  it('Processing valid image -> calls Vision -> responds with Analysis', async () => {
    // Setup Vision mock to return a face
    mockDetectFace.mockResolvedValue({ boundingPoly: {} });

    // Execute
    const result = await processJob(baseJob, mockEnv);

    // Verify
    expect(mockFetchImage).toHaveBeenCalledWith(baseJob.imageUrl);
    expect(mockHashImage).toHaveBeenCalled();
    expect(mockEnv.KV_MAIN.get).toHaveBeenCalledWith(`imagehash:hash-123`);
    expect(mockDetectFace).toHaveBeenCalled();
    
    // Should put result in KV
    expect(mockEnv.KV_MAIN.put).toHaveBeenCalledWith(`imagehash:hash-123`, expect.any(String), expect.anything());
    // Should put idempotency
    expect(mockEnv.KV_MAIN.put).toHaveBeenCalledWith(`idempotency:msg-1`, '1', expect.anything());
    
    // Result
    expect(result.ok).toBe(true);
    expect(result.season).toBeDefined();
    expect(mockSendText).toHaveBeenCalledWith(mockEnv, baseJob.userId, expect.stringContaining('Таны улирлын төрөл'));
  });

  it('Idempotency -> skips processed message', async () => {
    // Pre-fill KV
    kvStore.set(`idempotency:msg-1`, '1');

    const result = await processJob(baseJob, mockEnv);

    expect(result.skipped).toBe(true);
    expect(mockDetectFace).not.toHaveBeenCalled();
    expect(mockSendText).not.toHaveBeenCalled();
  });

  it('Cache Hit -> skips Vision -> returns cached result', async () => {
    // Pre-fill Image Cache
    const cachedSeason = SeasonType.TRUE_WINTER;
    kvStore.set(`imagehash:hash-123`, cachedSeason);

    const result = await processJob(baseJob, mockEnv);

    expect(mockHashImage).toHaveBeenCalled();
    expect(mockDetectFace).not.toHaveBeenCalled(); // Vision skipped!
    
    expect(result.season).toBe(cachedSeason);
    expect(result.replyText).toContain('True Winter');
    expect(mockSendText).toHaveBeenCalled();
  });

  it('No Face Detected -> sends warning', async () => {
    mockDetectFace.mockResolvedValue(null);

    const result = await processJob(baseJob, mockEnv);

    expect(mockDetectFace).toHaveBeenCalled();
    expect(result.season).toBeUndefined();
    expect(result.replyText).toContain('Царай тод харагдсан');
    
    // Should NOT cache result (as per logic)
    expect(mockEnv.KV_MAIN.put).not.toHaveBeenCalledWith(`imagehash:hash-123`, expect.anything(), expect.anything());
    // BUT should mark as processed (idempotency)? logic says yes, it returns.
    expect(mockEnv.KV_MAIN.put).toHaveBeenCalledWith(`idempotency:msg-1`, '1', expect.anything());
  });
});
