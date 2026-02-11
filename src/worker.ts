import { Hono } from 'hono';
import { Env, WebhookBody, QueueJob } from './types';
import { verifyWebhook, verifySignature } from './webhook';
import { detectIntent } from './router';
import { getSession, createSession, updateSession } from './session';
import { enqueueJob } from './queue';
import { Action } from './constants';

import { handleAssetRequest } from './assets';

const app = new Hono<{ Bindings: Env }>();

app.get('/assets/*', (c) => handleAssetRequest(c.req.raw, c.env));
app.get('/webhook', verifyWebhook);

app.post('/webhook', async (c) => {
  const clonedReq = c.req.raw.clone();
  const bodyText = await clonedReq.text();
  
  // Signature verification
  const isVerified = await verifySignature(c.req.raw, bodyText, c.env.MESSENGER_APP_SECRET);
  if (!isVerified) {
    console.error('Signature verification failed');
    return c.text('Forbidden', 403);
  }

  const body = JSON.parse(bodyText) as WebhookBody;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        const userId = event.sender.id;
        const messageId = event.message?.mid || event.postback?.mid || `evt_${Date.now()}`;
        
        // 1. Detect Intent
        const intent = detectIntent({ ...entry, messaging: [event] }); // simplistic wrapping
        
        // 2. Session Management
        let session = await getSession(c.env, userId);
        if (!session) {
          session = await createSession(c.env, userId);
        }

        // 3. Greeting Logic (Free Mode)
        if (intent === Action.MENU_FREE_ENTRY && !session.hasSeenGreeting) {
          // Log instead of calling external API as per requirements
          console.log(`[GREETING] Sending greeting to user ${userId}`);
          
          // Current Mongolian Greeting:
          // "Сайн байна уу!
          // Танд туслахдаа таатай байх болно 😊
          // Өөрийн зургаа илгээж, танд тохирох өнгийг мэдэж аваарай."

          await updateSession(c.env, userId, { hasSeenGreeting: true });
        }

        // 4. Queue Processing
        const imageUrl = event.message?.attachments?.find(a => a.type === 'image')?.payload.url;
        
        const job: QueueJob = {
          userId,
          messageId,
          intent,
          imageUrl,
          text: event.message?.text || event.postback?.payload || undefined,
          timestamp: event.timestamp,
        };

        await enqueueJob(c.env, job, c.executionCtx);
      }
    }
    return c.text('EVENT_RECEIVED', 200);
  }

  return c.text('Not Found', 404);
});

export default {
  fetch: app.fetch,
};
