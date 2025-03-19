import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://ample-teal-36178.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN || ''
});

const THROTTLE_LIMIT = 30; // requests per minute
const THROTTLE_WINDOW = 60; // seconds

export async function throttleRequest(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const key = `throttle:${ip}`;
    
    // Get the current count for this IP
    const current = await redis.get<number>(key) || 0;
    
    if (current >= THROTTLE_LIMIT) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(THROTTLE_LIMIT),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + THROTTLE_WINDOW)
          }
        }
      );
    }
    
    // Increment the counter
    await redis.incr(key);
    
    // Set expiry on first request
    if (current === 0) {
      await redis.expire(key, THROTTLE_WINDOW);
    }
    
    return null;
  } catch (error) {
    console.error('Throttling error:', error);
    // If throttling fails, allow the request
    return null;
  }
}