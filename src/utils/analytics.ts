
// Enhanced analytics utility with debug mode and improved event tracking

// Define a type for analytics events
export interface AnalyticsEvent {
  eventName: string;
  eventParams?: Record<string, any>;
}

// Debug mode - set to true to see analytics logging in console
const DEBUG_ANALYTICS = true;

/**
 * Track page views in Google Analytics
 * @param path The current path to track
 */
export const trackPageView = (path: string) => {
  try {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      window.gtag('event', 'page_view', {
        page_path: path,
      });
      
      if (DEBUG_ANALYTICS) {
        console.log(`📊 Analytics page view tracked: ${path}`);
      }
      
      // Store in analytics debug history
      addToAnalyticsHistory({
        eventName: 'page_view',
        eventParams: { page_path: path }
      });
    } else if (DEBUG_ANALYTICS) {
      console.warn('📊 Analytics: gtag not available for tracking page view');
    }
  } catch (error) {
    console.error('Error tracking analytics page view:', error);
  }
};

/**
 * Track custom events in Google Analytics
 * @param eventName Name of the event to track
 * @param eventParams Additional parameters for the event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  try {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      window.gtag('event', eventName, eventParams);
      
      if (DEBUG_ANALYTICS) {
        console.log(`📊 Analytics event tracked: ${eventName}`, eventParams);
      }
      
      // Store in analytics debug history
      addToAnalyticsHistory({
        eventName,
        eventParams
      });
    } else if (DEBUG_ANALYTICS) {
      console.warn('📊 Analytics: gtag not available for tracking event:', eventName);
    }
  } catch (error) {
    console.error('Error tracking analytics event:', error);
  }
};

/**
 * Initialize Google Analytics with measurement ID
 * Should be called once when the app loads
 * @param measurementId Google Analytics measurement ID
 */
export const initializeAnalytics = (measurementId: string) => {
  try {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      window.gtag('config', measurementId);
      
      if (DEBUG_ANALYTICS) {
        console.log(`📊 Analytics initialized with ID: ${measurementId}`);
      }
      
      // Store initialization in history
      addToAnalyticsHistory({
        eventName: 'analytics_initialized',
        eventParams: { measurementId }
      });
      
      return true;
    } else if (DEBUG_ANALYTICS) {
      console.warn('📊 Analytics: gtag not available for initialization');
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing analytics:', error);
    return false;
  }
};

// Store analytics history for debugging
const analyticsHistory: AnalyticsEvent[] = [];
const MAX_HISTORY_SIZE = 100;

/**
 * Add an event to the analytics history
 */
const addToAnalyticsHistory = (event: AnalyticsEvent) => {
  analyticsHistory.push(event);
  if (analyticsHistory.length > MAX_HISTORY_SIZE) {
    analyticsHistory.shift();
  }
};

/**
 * Get analytics history for debugging
 */
export const getAnalyticsHistory = () => {
  return [...analyticsHistory];
};

/**
 * Check if Google Analytics is properly loaded
 */
export const isAnalyticsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 'gtag' in window;
};

/**
 * Test analytics tracking with a test event
 * Useful for debugging
 */
export const testAnalyticsTracking = () => {
  trackEvent('test_event', { test_param: 'test_value', timestamp: new Date().toISOString() });
  return isAnalyticsLoaded();
};
