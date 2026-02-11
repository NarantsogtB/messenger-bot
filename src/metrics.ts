import { Env } from './types';

export async function incrementMetric(env: Env, name: string): Promise<void> {
  const key = `metrics:${name}`;
  try {
    const val = await env.KV_MAIN.get(key);
    const count = parseInt(val || '0', 10);
    await env.KV_MAIN.put(key, (count + 1).toString());
  } catch (error) {
    console.error(`Error incrementing metric ${name}:`, error);
  }
}

export async function getMetrics(env: Env): Promise<Record<string, number>> {
  const list = await env.KV_MAIN.list({ prefix: 'metrics:' });
  const metrics: Record<string, number> = {};
  for (const key of list.keys) {
    const val = await env.KV_MAIN.get(key.name);
    metrics[key.name.replace('metrics:', '')] = parseInt(val || '0', 10);
  }
  return metrics;
}
