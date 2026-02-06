import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processJob } from '../src/consumer';
import { Action } from '../src/constants';
import { QueueJob } from '../src/types';
import * as vision from '../src/image/vision';

// Mock Dependencies
const kvStore = new Map();
const env = {
  KV_MAIN: {
    get: vi.fn((key) => kvStore.get(key)),
    put: vi.fn((key, val) => kvStore.set(key, val)),
  },
  FB_PAGE_ACCESS_TOKEN: 'fake'
};

vi.mock('../src/messenger');
vi.mock('../src/image/vision', () => ({
  detectFace: vi.fn()
}));

describe('Paid No Vision', () => {
    it('MENU_PAID_ENTRY should NEVER call detectFace', async () => {
        // Even if paid and delivering content, or asking for gender...
        // The flow relies on CACHED result. If cached result missing, it asks for text. 
        // It NEVER takes an input image in this flow.
        
        const job: QueueJob = {userId: 'uNoVis', messageId: 'm1', intent: Action.MENU_PAID_ENTRY, timestamp: 1};
        
        await processJob(job, env as any);
        
        expect(vision.detectFace).not.toHaveBeenCalled();
    });
});
