
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface UseProfileTabsOptions {
  defaultTab?: string;
  paramName?: string;
}

export const useProfileTabs = (options: UseProfileTabsOptions = {}) => {
  const { 
    defaultTab = 'info',
    paramName = 'tab'
  } = options;
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Refs to track state without causing rerenders
  const initialRenderRef = useRef(true);
  const prevSearchRef = useRef(location.search);
  const pendingTabChangeRef = useRef<string | null>(null);
  const navigationLockRef = useRef(false);
  
  // Parse the search params once
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get(paramName);
  
  // Validate tab value or use default
  const getValidTabValue = useCallback((value: string | null) => {
    const validTabs = ['info', 'purchases', 'quiz', 'favorites', 'deficard'];
    return validTabs.includes(value || '') ? value : defaultTab;
  }, [defaultTab]);
  
  // Initialize state with validated tab value
  const [activeTab, setActiveTab] = useState(() => getValidTabValue(tabParam));

  // Handle changes to URL search params
  useEffect(() => {
    // Skip if this is the initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    
    // Skip if navigation is currently locked
    if (navigationLockRef.current) {
      navigationLockRef.current = false;
      return;
    }
    
    // Only process if search params actually changed
    if (location.search === prevSearchRef.current) {
      return;
    }
    
    prevSearchRef.current = location.search;
    const params = new URLSearchParams(location.search);
    const newTabParam = params.get(paramName);
    const validTab = getValidTabValue(newTabParam);
    
    // Only update if the tab is different
    if (validTab !== activeTab) {
      console.log(`URL params changed, updating tab to: ${validTab}`);
      pendingTabChangeRef.current = null; // Clear any pending changes
      setActiveTab(validTab);
    }
  }, [location.search, activeTab, paramName, getValidTabValue]);

  // Update URL when active tab changes
  useEffect(() => {
    // Skip initial render
    if (initialRenderRef.current) {
      return;
    }
    
    // Skip if this change is from a URL update and not a user action
    if (pendingTabChangeRef.current === null) {
      return;
    }
    
    // Lock navigation to prevent loops
    navigationLockRef.current = true;
    
    if (activeTab !== defaultTab) {
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set(paramName, activeTab);
      
      const newSearch = newSearchParams.toString();
      if (`?${newSearch}` !== location.search) {
        console.log(`Tab changed to ${activeTab}, updating URL params`);
        navigate({ search: newSearch }, { replace: true });
      }
    } else {
      // Remove tab param if using default tab
      if (location.search) {
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.delete(paramName);
        
        const newSearch = newSearchParams.toString();
        const searchStr = newSearch ? `?${newSearch}` : '';
        
        if (searchStr !== location.search) {
          console.log(`Tab reset to default, cleaning URL params`);
          navigate({ search: newSearch }, { replace: true });
        }
      }
    }
    
    // Reset pending change
    pendingTabChangeRef.current = null;
    
  }, [activeTab, navigate, location.search, defaultTab, paramName]);

  // Handle tab change, with optional callback
  const handleTabChange = useCallback((value: string, callback?: () => void) => {
    if (value !== activeTab) {
      console.log(`Tab changing to: ${value}`);
      pendingTabChangeRef.current = value; // Mark this as a user-initiated change
      setActiveTab(value);
      if (callback) callback();
    }
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    handleTabChange
  };
};
