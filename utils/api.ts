import { NewsResponse } from '../types/news';

export async function getTopNews(page = 1): Promise<NewsResponse> {
  try {
    const response = await fetch(`/api/news?page=${page}`, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch news');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}