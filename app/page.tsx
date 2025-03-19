'use client';

import { useEffect, useState } from 'react';
import { NewsArticle } from '../types/news';
import { getTopNews } from '../utils/api';
import NewsSlider from '../components/NewsSlider';

export default function Home() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews(page = 1) {
    try {
      setLoading(true);
      const response = await getTopNews(page);
      if (page === 1) {
        setNews(response.articles);
      } else {
        setNews(prev => [...prev, ...response.articles]);
      }
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to fetch news. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const handleNeedMoreArticles = async () => {
    if (isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await getTopNews(nextPage);
      setNews(prev => [...prev, ...response.articles]);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Failed to load more articles:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {loading && (
        <div className="h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="h-screen flex justify-center items-center">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <NewsSlider 
          articles={news} 
          onNeedMoreArticles={handleNeedMoreArticles}
        />
      )}
    </main>
  );
}