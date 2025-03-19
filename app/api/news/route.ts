import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/utils/rateLimit';
import { throttleRequest } from '@/utils/throttle';
import { validateRequest, newsQuerySchema, sanitizeContent } from '@/utils/validation';
import axios, { AxiosError } from 'axios';

const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

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
    // 1. Apply request throttling
    const throttleResult = await throttleRequest(req);
    if (throttleResult) return throttleResult;

    // 2. Check rate limit
    const rateLimitResult = await rateLimiter(req);
    if (rateLimitResult) return rateLimitResult;

    // 3. Validate query parameters
    const validation = await validateRequest(req, newsQuerySchema);
    
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { page } = validation.data;
    
    if (!API_KEY) {
      console.error('News API key is missing');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // 4. Make the API request with sanitized parameters
    const response = await axios.get(`${BASE_URL}/everything`, {
      params: {
        q: '(world OR international OR global) -US -USA -"United States" -"news bulletin" -"minute news" -"latest bulletin"',
        domains: ALL_SOURCES,
        sortBy: 'publishedAt',
        pageSize: 100,
        page,
        apiKey: API_KEY,
      },
      timeout: 5000, // 5 second timeout
    });

    // 5. Sanitize and filter the response
    const filteredArticles = response.data.articles
      .filter((article: NewsArticle) => 
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
          'X-XSS-Protection': '1; mode=block'
        }
      }
    );
  } catch (error) {
    console.error('Detailed error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      response: error instanceof AxiosError ? error.response?.data : undefined,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const axiosError = error as AxiosError<{ message?: string }>;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch news',
        details: axiosError.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: axiosError.response?.status || 500 }
    );
  }
}