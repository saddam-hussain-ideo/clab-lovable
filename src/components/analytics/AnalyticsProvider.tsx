
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeAnalytics, trackPageView, isAnalyticsLoaded } from '@/utils/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  measurementId: string;
  debug?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ 
  children, 
  measurementId,
  debug = false
}) => {
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);
  
  // Initialize GA with the measurement ID
  useEffect(() => {
    if (!measurementId) {
      console.warn("Analytics Provider: No measurement ID provided");
      return;
    }
    
    const result = initializeAnalytics(measurementId);
    setInitialized(result);
    
    if (debug) {
      // Add visible debug info to console for easier troubleshooting
      console.log('%c Google Analytics Debug Info ', 'background: #4285F4; color: white; padding: 2px 5px; border-radius: 3px;');
      console.log(`Measurement ID: ${measurementId}`);
      console.log(`GA Loaded: ${isAnalyticsLoaded()}`);
      console.log(`Window gtag available: ${typeof window !== 'undefined' && 'gtag' in window}`);
    }
    
  }, [measurementId, debug]);
  
  // Track page views
  useEffect(() => {
    if (!measurementId || !initialized) return;
    
    // Send pageview with the current page URL
    trackPageView(location.pathname + location.search);
    
    if (debug) {
      console.log(`Analytics page view tracked for: ${location.pathname}`);
    }
    
  }, [location, measurementId, initialized, debug]);
  
  return <>{children}</>;
};
