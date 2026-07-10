import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { seedMockData, ensureTransferCategory } from './db';

// Seed mock data in the background (don't block rendering)
seedMockData()
  .then(() => ensureTransferCategory())
  .catch((err) => console.warn('Mock data seeding skipped:', err));

// Always render the app immediately
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/kita/">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
