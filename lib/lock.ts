// Server-only — distributed write lock via Upstash Redis
import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;
function getRedis() {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}
const LOCK_KEY = 'pinguipongui:write-lock';
const LOCK_TTL_MS = 10_000; // auto-expires if something crashes
const RETRY_COUNT = 6;
const RETRY_DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const token = crypto.randomUUID();

  // Try to acquire lock with retries
  let acquired = false;
  for (let i = 0; i < RETRY_COUNT; i++) {
    const result = await getRedis().set(LOCK_KEY, token, { nx: true, px: LOCK_TTL_MS });
    if (result === 'OK') { acquired = true; break; }
    await sleep(RETRY_DELAY_MS);
  }

  if (!acquired) {
    throw new Error('Could not acquire write lock — please try again');
  }

  try {
    return await fn();
  } finally {
    // Only release if we still own the lock
    const current = await getRedis().get(LOCK_KEY);
    if (current === token) await getRedis().del(LOCK_KEY);
  }
}
