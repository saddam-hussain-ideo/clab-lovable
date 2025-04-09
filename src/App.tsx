import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider'; 
import { WalletProviders } from '@/components/providers/WalletProviders';
import { AppRoutes } from './AppRoutes';
import { Toaster } from '@/components/ui/toaster';

function App() {
  // Ensure activeNetwork is set to mainnet on application startup
  useEffect(() => {
    // Force activeNetwork to be 'mainnet' in production
    localStorage.setItem('activeNetwork', 'mainnet');
    
    // Dispatch event to notify components of the network change
    window.dispatchEvent(new CustomEvent('presaleNetworkChanged', {
      detail: { network: 'mainnet' }
    }));
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WalletProviders>
            <AppRoutes />
            <Toaster />
          </WalletProviders>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
