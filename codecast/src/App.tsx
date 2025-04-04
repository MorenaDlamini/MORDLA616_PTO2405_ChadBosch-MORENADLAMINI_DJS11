// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Show from './pages/Show';
import Season from './pages/Season';
import Favorites from './pages/Favorites';
import NotFound from './pages/NotFound';

/**
 * App component – root of the application.
 * - Wraps all pages with React Router and MainLayout.
 * - Defines routes for all available pages.
 *
 * @returns {JSX.Element}
 */
const App: React.FC = () => {
  return (
    <Router>
      {/* Shared layout applied to all routes */}
      <MainLayout>
        <Routes>
          {/* 🎬 Home page – list of all shows */}
          <Route path="/" element={<Home />} />

          {/* 📄 Show detail page */}
          <Route path="/show/:id" element={<Show />} />

          {/* 📚 Specific season under a show */}
          <Route path="/show/:id/season/:seasonNumber" element={<Season />} />

          {/* ❤️ List of favorited episodes */}
          <Route path="/favorites" element={<Favorites />} />

          {/* ❌ Catch-all route for undefined pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
