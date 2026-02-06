import { Env, Session } from './types';

const SESSION_PREFIX = 'session:';

export async function getSession(env: Env, userId: string): Promise<Session | null> {
  return await env.KV_MAIN.get<Session>(`${SESSION_PREFIX}${userId}`, 'json');
}

export async function createSession(env: Env, userId: string): Promise<Session> {
  const defaultSession: Session = {
    hasSeenGreeting: false,
    isPaid: false,
  };
  await env.KV_MAIN.put(`${SESSION_PREFIX}${userId}`, JSON.stringify(defaultSession));
  return defaultSession;
}

export async function updateSession(env: Env, userId: string, data: Partial<Session>): Promise<void> {
  const currentSession = await getSession(env, userId);
  if (!currentSession) {
     await createSession(env, userId);
     await updateSession(env, userId, data); // Retry update after creation
     return;
  }
  
  const updatedSession = { ...currentSession, ...data };
  await env.KV_MAIN.put(`${SESSION_PREFIX}${userId}`, JSON.stringify(updatedSession));
}
