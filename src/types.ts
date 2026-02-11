import { Action } from "./constants";


export interface Env {
  KV_MAIN: KVNamespace;
  MESSENGER_VERIFY_TOKEN: string;
  MESSENGER_APP_SECRET: string;
  FB_PAGE_ACCESS_TOKEN: string;
  GOOGLE_VISION_API_KEY: string;
  R2_ASSETS: R2Bucket;
  R2_IMAGES: R2Bucket;
  APP_BASE_URL: string;
  FEATURE_QUALITY_GATE?: string;
  FEATURE_ONBOARDING?: string;
}

export interface Session {
  hasSeenGreeting: boolean;
  isPaid: boolean;
  gender?: 'female' | 'male';
  onboarded?: boolean;
}

export interface WebhookEntry {
  messaging: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{
        type: string;
        payload: { url?: string };
      }>;
    };
    postback?: {
      mid: string;
      payload: string;
      title: string;
    }
  }>;
}

export interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

export interface QueueJob {
  userId: string;
  messageId: string;
  intent: Action;
  imageUrl?: string;
  text?: string;
  timestamp: number;
}
