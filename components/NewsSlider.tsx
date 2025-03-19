'use client';

import { useState, useRef, useEffect } from 'react';
import { NewsArticle } from '../types/news';
import Image from 'next/image';
import { getSourceInfo } from '../utils/regions';

interface NewsSliderProps {
  articles: NewsArticle[];
  onNeedMoreArticles: () => void;
}

export default function NewsSlider({ articles, onNeedMoreArticles }: NewsSliderProps) {
  const [displayedArticles, setDisplayedArticles] = useState<NewsArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const seenArticles = useRef(new Set<string>());
  const isTransitioning = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (articles.length > 0) {
      const firstArticle = getRandomArticle();
      setDisplayedArticles([firstArticle]);
      seenArticles.current.add(firstArticle.url);
    }
  }, [articles]);

  const getRandomArticle = () => {
    const unseenArticles = articles.filter(article => !seenArticles.current.has(article.url));
    
    if (unseenArticles.length === 0) {
      onNeedMoreArticles();
      return articles[Math.floor(Math.random() * articles.length)];
    }
    if (unseenArticles.length < 5) {
      onNeedMoreArticles();
    }
    return unseenArticles[Math.floor(Math.random() * unseenArticles.length)];
  };

  const handleNext = () => {
    if (isTransitioning.current) return;
    
    isTransitioning.current = true;
    const newArticle = getRandomArticle();
    seenArticles.current.add(newArticle.url);
    
    setDisplayedArticles(prev => [...prev, newArticle]);
    setCurrentIndex(prev => prev + 1);
    
    setTimeout(() => {
      isTransitioning.current = false;
    }, 300);
  };

  const handlePrevious = () => {
    if (isTransitioning.current || currentIndex === 0) return;
    
    isTransitioning.current = true;
    setCurrentIndex(prev => prev - 1);
    
    setTimeout(() => {
      isTransitioning.current = false;
    }, 300);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (!isTransitioning.current) {
        if (e.deltaY > 0) {
          handleNext();
        } else if (e.deltaY < 0 && currentIndex > 0) {
          handlePrevious();
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [articles, currentIndex]);

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-hidden relative"
    >
      <div 
        className="absolute w-full transition-transform duration-300 ease-in-out"
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`
        }}
      >
        {displayedArticles.map((article, index) => (
          <div
            key={`${article.url}-${index}`}
            className="h-screen flex items-center justify-center p-4"
            style={{
              backgroundColor: index % 2 === 0 ? '#f8fafc' : '#f1f5f9',
            }}
          >
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex flex-col">
                <div className="relative w-full h-[280px]">
                  {article.urlToImage ? (
                    <Image
                      src={article.urlToImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    {(() => {
                      const sourceInfo = getSourceInfo(new URL(article.url).hostname);
                      return (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-blue-600">{sourceInfo?.region || 'International'}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">{sourceInfo?.country || article.source.name}</span>
                        </div>
                      );
                    })()}
                    <span className="text-sm text-gray-500">
                      {new Date(article.publishedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-2 leading-tight line-clamp-2">{article.title}</h2>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-3">{article.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      Read Full Article
                    </a>
                    {article.author && (
                      <span className="text-sm text-gray-500 truncate ml-4">
                        By {article.author}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}