// src/components/SearchFilter/SearchFilter.tsx

import React, { useState, useEffect, useRef } from 'react';
import './SearchFilter.css';

interface SearchFilterProps {
  /**
   * Callback invoked after user stops typing (debounced)
   * @param query Search input value
   */
  onSearch: (query: string) => void;

  /**
   * Optional placeholder text for the search input
   */
  placeholder?: string;
}

/**
 * SearchFilter Component
 *
 * Renders a search input with:
 * - 300ms debounced search behavior
 * - Clearable input UI
 * - Accessible icons and ARIA labels
 *
 * @param {SearchFilterProps} props Component props
 * @returns {JSX.Element}
 */
const SearchFilter: React.FC<SearchFilterProps> = ({ 
  onSearch, 
  placeholder = 'Search shows...'
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  /** 🧼 Clear debounce timeout on unmount */
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  /**
   * ⌨️ Handles input change with 300ms debounce
   * - Debounces `onSearch` to reduce re-renders or API calls
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  };

  /**
   * ❌ Clears the search input and calls `onSearch('')`
   */
  const handleClearSearch = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-filter">
      <div className="search-filter__input-container">
        {/* 🔍 Search Icon */}
        <svg 
          className="search-filter__icon"
          viewBox="0 0 24 24" 
          width="18" 
          height="18" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        {/* 🧾 Search Input Field */}
        <input
          ref={inputRef}
          type="text"
          className="search-filter__input"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-label="Search"
        />

        {/* ❎ Clear Button */}
        {query && (
          <button 
            className="search-filter__clear-btn"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <svg 
              viewBox="0 0 24 24" 
              width="16" 
              height="16" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
