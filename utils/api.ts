import axios from 'axios';
import { NewsResponse, NewsArticle } from '../types/news';

const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

// Define news sources by region for better organization
const NEWS_SOURCES = {
  europe: 'bbc.co.uk,theguardian.com,dw.com,euronews.com,france24.com,irishtimes.com,thelocal.fr,thelocal.de,thelocal.it',
  asia: 'scmp.com,japantimes.co.jp,straitstimes.com,aljazeera.com,channelnewsasia.com,koreatimes.co.kr,hindustantimes.com',
  africa: 'news24.com,africanews.com,nation.africa,mg.co.za,egyptindependent.com',
  latinAmerica: 'mercopress.com,batimes.com.ar,brazilnews.net',
  oceania: 'abc.net.au,nzherald.co.nz,stuff.co.nz'
};

// Combine all sources
const ALL_SOURCES = Object.values(NEWS_SOURCES).join(',');

export async function getTopNews(page = 1): Promise<NewsResponse> {
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
    });

    // Additional filter to remove any bulletin-type content that might slip through
    const filteredArticles = response.data.articles.filter((article: NewsArticle) => 
      !article.title.toLowerCase().includes('minute news') &&
      !article.title.toLowerCase().includes('news bulletin') &&
      !article.title.toLowerCase().includes('latest bulletin')
    );

    return {
      ...response.data,
      articles: filteredArticles
    };
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}