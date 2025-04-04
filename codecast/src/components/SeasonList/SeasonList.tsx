// src/components/SeasonList/SeasonList.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Season } from '../../types';
import './SeasonList.css';

/**
 * Props for the SeasonList component.
 */
interface SeasonListProps {
  showId: string;
  seasons: Season[];
}

/**
 * Displays a grid of season cards for a given show.
 *
 * Each season card links to the individual season view,
 * and includes an image, episode count, and season title.
 *
 * @component
 * @param {SeasonListProps} props - Component props
 * @returns {JSX.Element} A rendered list of seasons
 */
const SeasonList: React.FC<SeasonListProps> = ({ showId, seasons }) => {
  return (
    <div className="season-list">
      <h2 className="season-list__title">Seasons</h2>

      <div className="season-list__grid">
        {seasons.map((season) => (
          <Link
            key={season.season}
            to={`/show/${showId}/season/${season.season}`}
            className="season-card"
          >
            <div className="season-card__image-container">
              <img
                src={season.image}
                alt={season.title}
                className="season-card__image"
              />

              {/* Display episode count with correct singular/plural */}
              <div className="season-card__episodes">
                <span>
                  {season.episodes.length}{' '}
                  {season.episodes.length === 1 ? 'Episode' : 'Episodes'}
                </span>
              </div>
            </div>

            <div className="season-card__content">
              <h3 className="season-card__title">{season.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SeasonList;
