import { Env } from './types';

export async function sendText(env: Env, userId: string, text: string): Promise<void> {
  const message = {
    recipient: { id: userId },
    message: { text: text }
  };
  await callMessengerApi(env, message);
}

export async function sendImage(env: Env, recipientId: string, imageUrl: string): Promise<void> {
  const message = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'image',
        payload: { 
            url: imageUrl, 
            is_reusable: true 
        }
      }
    }
  };
  await callMessengerApi(env, message);
}

export async function sendQuickReplies(env: Env, recipientId: string, text: string, options: string[]): Promise<void> {
  const quick_replies = options.map(opt => ({
      content_type: 'text',
      title: opt,
      payload: opt 
  }));

  const message = {
    recipient: { id: recipientId },
    message: {
      text: text,
      quick_replies
    }
  };
  await callMessengerApi(env, message);
}

// Ensure callMessengerApi is generic enough or exported/internal
async function callMessengerApi(env: Env, payload: any) {
  const url = `https://graph.facebook.com/v11.0/me/messages?access_token=${env.FB_PAGE_ACCESS_TOKEN}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
      const err = await response.text();
      console.error('Messenger API Error:', err);
      // Don't throw to avoid crashing worker loops? Or throw?
      // Better to log.
  }
}
