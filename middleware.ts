import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;
function getRatelimit() {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      // 20 write requests per minute per IP
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: false,
    });
  }
  return ratelimit;
}

export async function middleware(req: NextRequest) {
  // Only rate limit mutating operations — reads are fine
  if (req.method === 'GET') return NextResponse.next();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const { success } = await getRatelimit().limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests — slow down' },
      { status: 429 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
