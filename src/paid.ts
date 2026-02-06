import { Env } from './types';

// Feature Flags
// DEBUG_AUTO_PAID can be set in .dev.vars or env to force paid mode for all users
// This is for local development/testing without manipulating KV manually repeatedly.

export async function isUserPaid(env: Env, userId: string): Promise<boolean> {
  // 1. Check Debug Flag
  // Note: Env vars are strings or undefined usually in Workers
  const debugPaid = (env as any).DEBUG_AUTO_PAID;
  if (debugPaid === 'true' || debugPaid === true) {
      return true;
  }

  // 2. Check KV Entitlement
  const paidKey = `paid:${userId}`;
  const val = await env.KV_MAIN.get(paidKey);
  
  return val === '1';
}

export async function setUserPaid(env: Env, userId: string): Promise<void> {
  // Grant access (e.g. permanent or long expiry)
  await env.KV_MAIN.put(`paid:${userId}`, '1');
}
