import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const rateLimit = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  maxRequests: 95 // slightly under the 100 limit to be safe
};

// Initialize Redis client with REST client
const redis = new Redis({
  url: 'https://ample-teal-36178.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN || ''
});

export async function rateLimiter(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
    const key = `ratelimit:${ip}`;
    
    const current = await redis.incr(key);
    
    // First request in the window
    if (current === 1) {
      await redis.expire(key, rateLimit.windowMs / 1000);
    }
    
    // Check if over limit
    if (current > rateLimit.maxRequests) {
      const ttl = await redis.ttl(key);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: ttl
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(ttl)
          }
        }
      );
    }
    
    return null;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, allow the request to proceed
    return null;
  }
}