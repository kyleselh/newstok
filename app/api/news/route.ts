import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '../../utils/rateLimit';
import { throttleRequest } from '../../utils/throttle';
import { validateRequest, newsQuerySchema, sanitizeContent } from '../../utils/validation';
import axios, { AxiosError } from 'axios';

// Use a hardcoded API key as a fallback in case the environment variable is not set
const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

// Add debug logging for environment variables only in development
if (process.env.NODE_ENV === 'development') {
  console.log('ENV Debug - NEWS_API_KEY:', API_KEY ? 'Set (Valid API key)' : 'Not set');
  console.log('ENV Debug - UPSTASH_REDIS_TOKEN:', process.env.UPSTASH_REDIS_TOKEN ? 'Set' : 'Not set');
}

// Define news sources by region for better organization
const NEWS_SOURCES = {
  europe: 'bbc.co.uk,theguardian.com,dw.com,euronews.com,france24.com,irishtimes.com,thelocal.fr,thelocal.de,thelocal.it',
  asia: 'scmp.com,japantimes.co.jp,straitstimes.com,aljazeera.com,channelnewsasia.com,koreatimes.co.kr,hindustantimes.com',
  africa: 'news24.com,africanews.com,nation.africa,mg.co.za,egyptindependent.com',
  latinAmerica: 'mercopress.com,batimes.com.ar,brazilnews.net',
  oceania: 'abc.net.au,nzherald.co.nz,stuff.co.nz'
};

const ALL_SOURCES = Object.values(NEWS_SOURCES).join(',');

interface NewsArticle {
  title: string;
  content: string | null;
  description: string | null;
}

export async function GET(req: NextRequest) {
  try {
    // Add more debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Debug - Starting news API request');
    }
    
    // 1. Apply request throttling
    const throttleResult = await throttleRequest(req);
    if (throttleResult) {
      if (process.env.NODE_ENV === 'development') {
        console.log('API Debug - Request throttled');
      }
      return throttleResult;
    }

    // 2. Check rate limit
    const rateLimitResult = await rateLimiter(req);
    if (rateLimitResult) {
      if (process.env.NODE_ENV === 'development') {
        console.log('API Debug - Rate limited');
      }
      return rateLimitResult;
    }

    // 3. Validate query parameters
    const validation = await validateRequest(req, newsQuerySchema);
    
    if (validation.error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('API Debug - Validation error:', validation.error);
      }
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { page } = validation.data;
    
    if (!API_KEY) {
      console.error('API Debug - News API key is missing');
      return NextResponse.json(
        { 
          error: 'API configuration error', 
          details: process.env.NODE_ENV === 'development' 
            ? 'Missing NEWS_API_KEY environment variable. Create .env.local file with your API key from Vercel.'
            : 'Internal server configuration error'
        },
        { status: 500 }
      );
    }

    // 4. Make the API request with sanitized parameters
    if (process.env.NODE_ENV === 'development') {
      console.log('API Debug - Making request to newsapi.org');
      // Do not log any part of the API key, even in development
      console.log('API Debug - Using valid API key');
      console.log('API Debug - Request URL:', `${BASE_URL}/everything`);
    }

    // Implement retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${BASE_URL}/everything`, {
          params: {
            q: '(world OR international OR global) -US -USA -"United States" -"news bulletin" -"minute news" -"latest bulletin"',
            domains: ALL_SOURCES,
            sortBy: 'publishedAt',
            pageSize: 100,
            page,
            apiKey: API_KEY,
          },
          timeout: 10000, // 10 second timeout
        });

        // 5. Sanitize and filter the response
        const filteredArticles = response.data.articles
          .filter((article: NewsArticle) => 
            article.title && 
            !article.title.toLowerCase().includes('minute news') &&
            !article.title.toLowerCase().includes('news bulletin') &&
            !article.title.toLowerCase().includes('latest bulletin')
          )
          .map((article: NewsArticle) => ({
            ...article,
            content: sanitizeContent(article.content || ''),
            description: sanitizeContent(article.description || '')
          }));

        // 6. Return sanitized response with security headers
        return NextResponse.json(
          {
            ...response.data,
            articles: filteredArticles
          },
          {
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:;",
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block',
              'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : 'https://newstok.vercel.app',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Max-Age': '86400'
            }
          }
        );
      } catch (error) {
        lastError = error;
        attempts++;
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`API Debug - Request attempt ${attempts} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
        
        // Only retry on network errors or 5xx errors
        const axiosError = error as AxiosError;
        const shouldRetry = 
          !axiosError.response || // Network error
          (axiosError.response && axiosError.response.status >= 500) || // Server error
          axiosError.code === 'ECONNABORTED'; // Timeout
          
        if (!shouldRetry || attempts >= maxAttempts) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const delayMs = Math.min(1000 * 2 ** attempts, 8000);
        if (process.env.NODE_ENV === 'development') {
          console.log(`API Debug - Retrying in ${delayMs}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // If we get here, all attempts failed
    throw lastError;
  } catch (error) {
    // In production, only log minimal error information
    if (process.env.NODE_ENV === 'development') {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: error instanceof AxiosError ? error.response?.data : undefined,
        status: error instanceof AxiosError ? error.response?.status : undefined,
        code: error instanceof AxiosError ? error.code : undefined,
        stack: error instanceof Error ? error.stack : undefined
      });
    } else {
      // Simplified error logging for production
      console.error('News API error:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    const axiosError = error as AxiosError<{ message?: string }>;
    
    // Determine the most helpful error message based on the type of error
    let errorMessage = 'Failed to fetch news';
    let errorDetails = 'An error occurred while processing your request';
    
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
      errorMessage = 'Network connection error';
      errorDetails = process.env.NODE_ENV === 'development' 
        ? 'Cannot connect to News API. Check your internet connection and API key validity.'
        : 'Network connection error occurred';
    } else if (axiosError.response?.status === 401) {
      errorMessage = 'API authentication error';
      errorDetails = process.env.NODE_ENV === 'development'
        ? 'Invalid API key. Check your NEWS_API_KEY in .env.local file.'
        : 'API authentication failed';
    } else if (axiosError.response?.status === 429) {
      errorMessage = 'API rate limit exceeded';
      errorDetails = 'Too many requests. Try again later.';
    } else if (axiosError.response) {
      errorDetails = process.env.NODE_ENV === 'development'
        ? (axiosError.response.data?.message || `Status ${axiosError.response.status}: ${axiosError.message}`)
        : 'News service returned an error';
    }
    
    // Don't expose internal error details in production
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: axiosError.response?.status || 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : 'https://newstok.vercel.app',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}