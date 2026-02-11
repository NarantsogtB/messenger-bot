import { Env, QueueJob } from './types';

import { processJob } from './consumer';

export async function enqueueJob(env: Env, job: QueueJob, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(processJob(job, env));
}
