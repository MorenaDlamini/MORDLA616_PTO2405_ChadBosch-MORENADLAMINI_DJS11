// src/pages/NotFound.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import './Pages.css';

/**
 * 404 Not Found page
 * - Displays when a user navigates to an undefined route.
 * - Encourages the user to return to the homepage.
 *
 * @returns {JSX.Element}
 */
const NotFound: React.FC = () => {
  return (
    <div className="page not-found">
      <div className="not-found__content">
        {/* 🔢 Error code headline */}
        <h1 className="not-found__title">404</h1>

        {/* 🧭 Short description */}
        <h2 className="not-found__subtitle">Page Not Found</h2>

        {/* 📣 Contextual message */}
        <p className="not-found__message">
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* 🔗 CTA to guide user back to home */}
        <Link to="/" className="not-found__home-btn">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
