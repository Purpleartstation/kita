import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { seedMockData, ensureTransferCategory } from './db';

// Initialize mock data before rendering
seedMockData()
  .then(() => ensureTransferCategory())
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <BrowserRouter basename="/kita/">
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
  });
