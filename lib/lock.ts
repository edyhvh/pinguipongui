import { Redis } from '@upstash/redis';

const DEFAULT_LOCK_KEY = 'pinguipongui:data';
const DEFAULT_TIMEOUT_MS = 6000;
const DEFAULT_LEASE_SECONDS = 8;

const hasRedisConfig =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' && process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string' && process.env.UPSTASH_REDIS_REST_TOKEN.length > 0;

const redis = hasRedisConfig ? Redis.fromEnv() : null;
const localQueues = new Map<string, Promise<void>>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runInLocalQueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = localQueues.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  localQueues.set(key, prev.then(() => current));

  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (localQueues.get(key) === current) {
      localQueues.delete(key);
    }
  }
}

async function acquireDistributedLock(lockKey: string, token: string, timeoutMs: number, leaseSeconds: number) {
  if (!redis) return;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await redis.set(lockKey, token, { nx: true, ex: leaseSeconds });
    if (result === 'OK') return;
    await sleep(60 + Math.floor(Math.random() * 80));
  }

  throw Object.assign(new Error('System is busy, please retry'), { status: 503 });
}

async function releaseDistributedLock(lockKey: string, token: string) {
  if (!redis) return;

  const current = await redis.get<string>(lockKey);
  if (current === token) {
    await redis.del(lockKey);
  }
}

export async function withLock<T>(
  fn: () => Promise<T>,
  lockKey: string = DEFAULT_LOCK_KEY,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  return runInLocalQueue(lockKey, async () => {
    const token = crypto.randomUUID();
    const redisLockKey = `lock:${lockKey}`;

    await acquireDistributedLock(redisLockKey, token, timeoutMs, DEFAULT_LEASE_SECONDS);
    try {
      return await fn();
    } finally {
      await releaseDistributedLock(redisLockKey, token);
    }
  });
}
