// src/components/ui/Loading/Loading.tsx

import React from 'react';
import './Loading.css';

/**
 * Props for reusable loading components.
 * @property message - Optional message to display alongside the spinner
 */
interface LoadingProps {
  message?: string;
}

/**
 * General-purpose centered loading component.
 * @component
 * @param {LoadingProps} props - Optional loading message
 */
export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="loading">
      <div className="loading__spinner" />
      <p className="loading__message">{message}</p>
    </div>
  );
};

/**
 * Full-page loader for use during route-level loading or blocking fetches.
 * Often used as a fallback for lazy-loaded pages or suspense boundaries.
 *
 * @component
 * @param {LoadingProps} props - Optional message to show
 */
export const PageLoader: React.FC<LoadingProps> = ({
  message = 'Loading content...',
}) => {
  return (
    <div className="page-loader">
      <div className="loading__spinner" />
      <p className="loading__message">{message}</p>
    </div>
  );
};

/**
 * Compact loader for inline use in buttons, small sections, or minimal UI states.
 * Contains no text for minimal visual weight.
 *
 * @component
 */
export const InlineLoader: React.FC = () => {
  return (
    <div className="inline-loader">
      <div className="loading__spinner loading__spinner--small" />
    </div>
  );
};
