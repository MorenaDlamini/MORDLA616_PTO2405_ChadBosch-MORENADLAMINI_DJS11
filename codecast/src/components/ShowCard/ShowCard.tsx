// src/components/ShowCard/ShowCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ShowPreview, Genre } from '../../types';
import { formatRelativeDate } from '../../utils/dateUtils';
import './ShowCard.css';

/**
 * Props for the ShowCard component.
 */
interface ShowCardProps {
  show: ShowPreview;
  genres: Genre[];
}

/**
 * Renders a podcast show preview card with title, image, genres, and metadata.
 *
 * @component
 * @param {ShowCardProps} props - Component props
 * @returns {JSX.Element} A clickable show card
 */
const ShowCard: React.FC<ShowCardProps> = ({ show, genres }) => {
  // Resolve genre titles from IDs
  const showGenres = genres
    .filter(genre => show.genres.includes(genre.id))
    .map(genre => genre.title);

  return (
    <Link to={`/show/${show.id}`} className="show-card">
      <div className="show-card__image-container">
        <img 
          src={show.image} 
          alt={show.title} 
          className="show-card__image" 
        />
        <div className="show-card__seasons">
          <span>
            {show.seasons} {show.seasons === 1 ? 'Season' : 'Seasons'}
          </span>
        </div>
      </div>

      <div className="show-card__content">
        <h3 className="show-card__title">{show.title}</h3>

        <p className="show-card__description">
          {show.description.length > 100 
            ? `${show.description.substring(0, 100)}...` 
            : show.description}
        </p>

        <div className="show-card__meta">
          <div className="show-card__genres">
            {showGenres.map((genre, index) => (
              <span key={index} className="show-card__genre">
                {genre}
              </span>
            ))}
          </div>
          <div className="show-card__updated">
            Updated {formatRelativeDate(show.updated)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ShowCard;
