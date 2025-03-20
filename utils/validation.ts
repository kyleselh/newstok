import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Schema for query parameters
export const newsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Schema for validating news article data
export const newsArticleSchema = z.object({
  source: z.object({
    id: z.string().nullable(),
    name: z.string()
  }),
  author: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  urlToImage: z.string().url().nullable(),
  publishedAt: z.string().datetime(),
  content: z.string()
});

export async function validateRequest(
  req: NextRequest,
  schema: z.ZodSchema
) {
  try {
    const data = await req.json().catch(() => ({}));
    const queryParams = Object.fromEntries(new URL(req.url).searchParams);
    
    const validatedData = schema.parse({
      ...data,
      ...queryParams
    });
    
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: {
          message: 'Validation error',
          details: error.errors
        }
      };
    }
    return {
      data: null,
      error: {
        message: 'Invalid request',
        details: error
      }
    };
  }
}

// Sanitize HTML content
export function sanitizeContent(content: string): string {
  if (!content) return '';
  
  return content
    // Remove scripts and event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove expressions
    .replace(/expression\s*\([^)]*\)/gi, '')
    // Remove base64 encoded content that could contain scripts
    .replace(/base64/gi, 'base_64') 
    .trim();
}