import { Env, QueueJob } from './types';

export async function enqueueJob(env: Env, job: QueueJob): Promise<void> {
  await env.ANALYSIS_QUEUE.send(job);
}
