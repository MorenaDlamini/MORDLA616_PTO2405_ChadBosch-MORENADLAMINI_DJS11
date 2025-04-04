// src/components/ShowCarousel/ShowCarousel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShowPreview } from '../../types';
import { formatRelativeDate } from '../../utils/dateUtils';
import './ShowCarousel.css';

interface ShowCarouselProps {
  shows: ShowPreview[];
  title?: string;
}

/**
 * ShowCarousel component
 * - Displays a horizontal slider of ShowPreview cards.
 * - Supports auto-sliding, swipe gestures, and manual navigation.
 * - Optional `title` prop overrides default heading.
 *
 * @param {ShowPreview[]} shows - List of shows to render
 * @param {string} [title="Recommended Shows"] - Optional carousel heading
 */
const ShowCarousel: React.FC<ShowCarouselProps> = ({ 
  shows, 
  title = "Recommended Shows" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  /** 🔄 Reset current index when the show list changes */
  useEffect(() => {
    setCurrentIndex(0);
  }, [shows.length]);

  /** ◀️ Navigate to previous slide */
  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? shows.length - 1 : prevIndex - 1
    );
  }, [shows.length]);

  /** ▶️ Navigate to next slide */
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === shows.length - 1 ? 0 : prevIndex + 1
    );
  }, [shows.length]);

  /** ⏱ Auto-slide the carousel every 5 seconds */
  useEffect(() => {
    if (shows.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, shows.length, nextSlide]); // Added nextSlide to dependency array

  /** 👉 Handle swipe start */
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  /** 👉 Track swipe movement */
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  /** 👉 Swipe logic (left/right) on release */
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();

    setTouchStart(null);
    setTouchEnd(null);
  };

  /** ⛔ Don't render anything if no shows provided */
  if (shows.length === 0) return null;

  return (
    <div className="carousel">
      <h2 className="carousel__title">{title}</h2>

      <div 
        className="carousel__container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ◀️ Previous Arrow */}
        <button 
          className="carousel__arrow carousel__arrow--left" 
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* 🖼️ Slides */}
        <div className="carousel__content">
          {shows.map((show, index) => (
            <Link
              to={`/show/${show.id}`}
              key={show.id}
              className={`carousel__slide ${index === currentIndex ? 'carousel__slide--active' : ''}`}
              style={{
                transform: `translateX(${(index - currentIndex) * 100}%)`
              }}
            >
              <div className="carousel__image-container">
                <img 
                  src={show.image} 
                  alt={show.title} 
                  className="carousel__image" 
                />
              </div>
              <div className="carousel__info">
                <h3 className="carousel__show-title">{show.title}</h3>
                <p className="carousel__show-details">
                  {show.seasons} {show.seasons === 1 ? 'Season' : 'Seasons'} • Updated {formatRelativeDate(show.updated)}
                </p>
                <p className="carousel__show-description">
                  {show.description.length > 150
                    ? `${show.description.substring(0, 150)}...`
                    : show.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ▶️ Next Arrow */}
        <button 
          className="carousel__arrow carousel__arrow--right" 
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* 🧭 Slide Indicators */}
      <div className="carousel__indicators">
        {shows.map((_, index) => (
          <button
            key={index}
            className={`carousel__indicator ${index === currentIndex ? 'carousel__indicator--active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ShowCarousel;