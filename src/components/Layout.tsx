
import React, { useEffect } from 'react';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { AnalyticsProvider } from './analytics/AnalyticsProvider';
import { AnalyticsDebugger } from './analytics/AnalyticsDebugger';
import { useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface LayoutProps {
  children: React.ReactNode;
}

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = "G-ZP9VJDYFHY"; // Updated Google Analytics Property ID
const DEBUG_ANALYTICS = process.env.NODE_ENV === 'development';

// Create a client
const queryClient = new QueryClient();

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider measurementId={GA_MEASUREMENT_ID} debug={DEBUG_ANALYTICS}>
        <div className="flex flex-col min-h-screen bg-black">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
        
        {/* Analytics debugger - only visible in development */}
        <AnalyticsDebugger measurementId={GA_MEASUREMENT_ID} />
      </AnalyticsProvider>
    </QueryClientProvider>
  );
};
