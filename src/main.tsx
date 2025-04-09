
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setupWalletSystem } from './services/wallet/walletInitializer';
import './index.css';

// Initialize wallet providers before app renders
setupWalletSystem();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
