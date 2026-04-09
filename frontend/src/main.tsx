// File: src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom';
import './assets/styles/Admin.css';
import './assets/styles/custom.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { HelmetProvider } from 'react-helmet-async';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>,
)