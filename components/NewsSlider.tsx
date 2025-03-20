'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

  const getRandomArticle = useCallback(() => {
    const unseenArticles = articles.filter(article => !seenArticles.current.has(article.url));
    
    if (unseenArticles.length === 0) {
      onNeedMoreArticles();
      return articles[Math.floor(Math.random() * articles.length)];
    }
    if (unseenArticles.length < 5) {
      onNeedMoreArticles();
    }
    return unseenArticles[Math.floor(Math.random() * unseenArticles.length)];
  }, [articles, onNeedMoreArticles]);

  const handleNext = useCallback(() => {
    if (isTransitioning.current) return;
    
    isTransitioning.current = true;
    const newArticle = getRandomArticle();
    seenArticles.current.add(newArticle.url);
    
    setDisplayedArticles(prev => [...prev, newArticle]);
    setCurrentIndex(prev => prev + 1);
    
    setTimeout(() => {
      isTransitioning.current = false;
    }, 300);
  }, [getRandomArticle]);

  const handlePrevious = useCallback(() => {
    if (isTransitioning.current || currentIndex === 0) return;
    
    isTransitioning.current = true;
    setCurrentIndex(prev => prev - 1);
    
    setTimeout(() => {
      isTransitioning.current = false;
    }, 300);
  }, [currentIndex]);

  useEffect(() => {
    if (articles.length > 0) {
      const firstArticle = getRandomArticle();
      setDisplayedArticles([firstArticle]);
      seenArticles.current.add(firstArticle.url);
    }
  }, [articles, getRandomArticle]);

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
  }, [currentIndex, handleNext, handlePrevious]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartX = 0;
    let isSwiping = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      isSwiping = false;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      
      // Calculate vertical and horizontal movement
      const deltaY = Math.abs(touchY - touchStartY);
      const deltaX = Math.abs(touchX - touchStartX);
      
      // If vertical movement is greater than horizontal and exceeds threshold, 
      // consider it a vertical swipe and prevent default scrolling
      if (deltaY > deltaX && deltaY > 10) {
        isSwiping = true;
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;
      
      touchEndY = e.changedTouches[0].clientY;
      
      // Calculate swipe direction and distance
      const swipeDistance = touchEndY - touchStartY;
      const swipeThreshold = 50; // Minimum distance to consider it a swipe
      
      if (!isTransitioning.current) {
        if (swipeDistance < -swipeThreshold) {
          // Swiped up, show next article
          handleNext();
        } else if (swipeDistance > swipeThreshold && currentIndex > 0) {
          // Swiped down, show previous article
          handlePrevious();
        }
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, handleNext, handlePrevious]);

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-hidden relative"
    >
      <div className="fixed top-0 left-0 right-0 z-50 bg-white p-2 text-center shadow-md">
        <h1 className="text-2xl font-bold text-blue-600">NewsTok</h1>
        <p className="text-sm text-gray-600">Discover what's happening beyond US headlines</p>
      </div>
      <div 
        className="absolute w-full transition-transform duration-300 ease-in-out pt-2"
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`
        }}
      >
        {displayedArticles.map((article, index) => (
          <div
            key={`${article.url}-${index}`}
            className="h-screen flex items-center justify-center pt-14 pb-14 px-4 md:pb-16 sm:px-2"
            style={{
              backgroundColor: index % 2 === 0 ? '#f8fafc' : '#f1f5f9',
            }}
          >
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden max-h-[90vh] sm:max-h-[95vh]">
              <div className="flex flex-col">
                <div className="relative w-full h-[280px] sm:h-[220px]">
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
                  <h2 className="text-xl font-bold mb-1 leading-tight line-clamp-3 text-gray-900">{article.title}</h2>
                  <p className="text-gray-600 mb-2 text-sm line-clamp-2">{article.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
                    >
                      Read More
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