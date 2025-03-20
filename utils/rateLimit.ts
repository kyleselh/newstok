import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const rateLimit = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  maxRequests: 95 // slightly under the 100 limit to be safe
};

// Check if we have complete Redis configuration
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN);

// Initialize Redis client with REST client only if we have complete configuration
const redis = hasRedisConfig ? new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || ''
}) : null;

export async function rateLimiter(req: NextRequest) {
  try {
    // If Redis client is not initialized, skip rate limiting
    if (!redis) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Rate limiting skipped: Redis configuration not complete');
      }
      return null;
    }

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
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Rate limiting error:', error);
    } else {
      console.error('Rate limiting error occurred');
    }
    // If rate limiting fails, allow the request to proceed
    return null;
  }
}