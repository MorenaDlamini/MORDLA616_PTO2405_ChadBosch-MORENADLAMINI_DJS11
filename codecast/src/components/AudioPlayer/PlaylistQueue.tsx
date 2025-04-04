// src/components/AudioPlayer/PlaylistQueue.tsx

import React, { useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import './PlaylistQueue.css';

interface PlaylistQueueProps {
  onClose: () => void;
}

/**
 * Component for displaying and managing the current playlist queue.
 * Allows reordering and removing items from the queue.
 */
const PlaylistQueue: React.FC<PlaylistQueueProps> = ({ onClose }) => {
  const { 
    playlist, 
    currentEpisodeIndex,
    removeFromPlaylist,
    moveInPlaylist,
    clearPlaylist 
  } = usePlayerStore();
  
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Event handlers for drag and drop functionality
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    
    // Highlight the drop area
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Determine if we're dragging above or below the target
    if (y < rect.height / 2) {
      target.classList.add('playlist-item--drag-top');
      target.classList.remove('playlist-item--drag-bottom');
    } else {
      target.classList.add('playlist-item--drag-bottom');
      target.classList.remove('playlist-item--drag-top');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Remove highlighting when leaving an element
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('playlist-item--drag-top', 'playlist-item--drag-bottom');
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Determine if we're dropping above or below
    let dropIndex = index;
    if (y > rect.height / 2 && index < playlist.length - 1) {
      dropIndex = index + 1;
    }
    
    // Reorder the playlist
    moveInPlaylist(dragIndex, dropIndex > dragIndex ? dropIndex - 1 : dropIndex);
    setDragIndex(null);
    
    // Clean up any highlighting
    target.classList.remove('playlist-item--drag-top', 'playlist-item--drag-bottom');
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    
    // Clean up any remaining highlights
    document.querySelectorAll('.playlist-item')
      .forEach(item => {
        item.classList.remove('playlist-item--drag-top', 'playlist-item--drag-bottom');
      });
  };

  return (
    <div className="playlist-queue">
      <div className="playlist-queue__header">
        <h3 className="playlist-queue__title">Up Next</h3>
        <div className="playlist-queue__actions">
          {playlist.length > 0 && (
            <button 
              className="playlist-queue__clear-btn"
              onClick={clearPlaylist}
              aria-label="Clear playlist"
            >
              Clear All
            </button>
          )}
          <button 
            className="playlist-queue__close-btn"
            onClick={onClose}
            aria-label="Close playlist"
          >
            ✕
          </button>
        </div>
      </div>
      
      {playlist.length === 0 ? (
        <div className="playlist-queue__empty">
          <p>No episodes in queue</p>
        </div>
      ) : (
        <ul className="playlist-queue__list">
          {playlist.map((item, index) => (
            <li 
              key={`${item.showId}-${item.seasonNumber}-${item.episode.episode}`}
              className={`playlist-item ${index === currentEpisodeIndex ? 'playlist-item--current' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="playlist-item__number">
                {index === currentEpisodeIndex ? (
                  <div className="playlist-item__playing-indicator">
                    <div className="playing-bar"></div>
                    <div className="playing-bar"></div>
                    <div className="playing-bar"></div>
                  </div>
                ) : (
                  index + 1
                )}
              </div>
              
              <div className="playlist-item__content">
                <div className="playlist-item__title">
                  {item.episode.title}
                </div>
                <div className="playlist-item__show">
                  {item.showTitle} - {item.seasonTitle}
                </div>
              </div>
              
              <button
                className="playlist-item__remove-btn"
                onClick={() => removeFromPlaylist(index)}
                aria-label="Remove from playlist"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <div className="playlist-queue__instructions">
        <p>Drag and drop to reorder episodes</p>
      </div>
    </div>
  );
};

export default PlaylistQueue;