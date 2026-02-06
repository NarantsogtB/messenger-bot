import { processQueue } from './src/consumer';
import { Action } from './src/constants';
import { Env, QueueJob } from './src/types';

// Mock Env
const mockEnv = {
    KV_MAIN: {
        get: async (key: string) => null,
        put: async (key: string, value: string) => console.log(`[KV PUT] ${key} = ${value}`),
    },
    ANALYSIS_QUEUE: {
        send: async (msg: any) => console.log(`[QUEUE SEND]`, msg),
    },
    FB_PAGE_ACCESS_TOKEN: 'fake_token',
    GOOGLE_VISION_API_KEY: 'fake_key',
    MESSENGER_VERIFY_TOKEN: 'fake_verify',
    MESSENGER_APP_SECRET: 'fake_secret'
} as unknown as Env;

// Test Job 1: Text Hint
const textJob: QueueJob = {
    userId: 'user-123',
    messageId: 'msg-text-1',
    intent: Action.TEXT_MESSAGE,
    timestamp: Date.now()
};

// Mock Batch
const mockBatch = {
    messages: [
        {
            body: textJob,
            ack: () => console.log('[ACK] Text Job'),
            retry: () => console.log('[RETRY] Text Job')
        }
    ]
} as any;

console.log('Running Test Harness...');
processQueue(mockBatch, mockEnv).then(() => {
    console.log('Test Complete');
});
