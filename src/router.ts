import { WebhookEntry } from './types';
import { Action } from './constants';

export function detectIntent(entry: WebhookEntry): Action {
  // We only look at the first messaging event in the entry
  const event = entry.messaging[0];

  if (!event) return Action.UNKNOWN;

  // 1. Postback / Menu
  if (event.postback) {
    if (event.postback.payload === 'MENU_FREE') return Action.MENU_FREE_ENTRY;
    if (event.postback.payload === 'MENU_PAID') return Action.MENU_PAID_ENTRY;
    // Fallback for other postbacks
    return Action.UNKNOWN;
  }

  // 2. Message
  if (event.message) {
    // Image attachment
    if (event.message.attachments && event.message.attachments.some(a => a.type === 'image')) {
      return Action.IMAGE_MESSAGE;
    }
    
    // Text message
    if (event.message.text) {
       // Simple keyword matching can be added here if needed, but for now map all text to TEXT_MESSAGE
       // Exception: if text is exactly a menu command (unlikely if using buttons, but good for testing)
       if (event.message.text === 'MENU_FREE') return Action.MENU_FREE_ENTRY;
       if (event.message.text === 'MENU_PAID') return Action.MENU_PAID_ENTRY;

       return Action.TEXT_MESSAGE;
    }
  }

  return Action.UNKNOWN;
}
