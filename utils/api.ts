import { NewsResponse } from '../types/news';

export async function getTopNews(page = 1, retryCount = 2): Promise<NewsResponse> {
  try {
    const response = await fetch(`/api/news?page=${page}`, {
      headers: {
        'Cache-Control': 'no-store'
      },
      // Add a longer timeout for the fetch request
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to fetch news';
      const errorDetails = errorData.details || 'An unexpected error occurred';
      
      console.error(`API Error (${response.status}):`, errorMessage, errorDetails);
      throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Implement retry logic for network errors
    if (retryCount > 0 && (
      error instanceof TypeError && error.message.includes('Failed to fetch') ||
      error instanceof DOMException && error.name === 'AbortError'
    )) {
      console.log(`Retrying fetch (${retryCount} attempts left)...`);
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retryCount)));
      return getTopNews(page, retryCount - 1);
    }
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // Network error - likely CORS or network connectivity issue
      throw new Error('Network error: Unable to connect to the news service. Please check your internet connection.');
    }
    
    throw error;
  }
}