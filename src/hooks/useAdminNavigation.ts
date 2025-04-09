
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdminMenuItems } from '@/components/admin/layout/menuItems';

export interface UseAdminNavigationResult {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleTabChange: (tab: string) => void;
  isNavigationReady: boolean;
}

export const useAdminNavigation = (): UseAdminNavigationResult => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Get all menu items for validation
  const menuItems = getAdminMenuItems('');
  
  // Refs to track state without causing rerenders
  const initializedRef = useRef(false);
  const previousPathRef = useRef('');
  const lastActiveTabRef = useRef<string | null>(null);
  const pendingNavigationRef = useRef<string | null>(null);

  // Parse tab from URL path
  const getTabFromPath = useCallback(() => {
    // Handle the special case for settings in dashboard
    if (location.pathname === '/admin' && location.search.includes('tab=settings')) {
      return 'settings';
    }
    
    const pathSegments = location.pathname.split('/');
    const tabFromPath = pathSegments.length > 2 ? pathSegments[2] : '';
    
    // If we're at /admin/, use dashboard as the active tab
    if (!tabFromPath) {
      return 'dashboard';
    }
    
    // Check if it's a valid tab
    const validTab = menuItems.find(item => item.id === tabFromPath);
    if (validTab) {
      console.log(`Found valid tab '${tabFromPath}' in URL`);
      return tabFromPath;
    }
    
    console.log(`No valid tab found in URL path: ${location.pathname}`);
    return null;
  }, [location.pathname, location.search, menuItems]);

  // Get initial tab from URL, localStorage, or default
  const getInitialTab = useCallback(() => {
    // First try to get from URL path
    const tabFromPath = getTabFromPath();
    if (tabFromPath) {
      return tabFromPath;
    }
    
    // Then try localStorage
    try {
      const storedTab = localStorage.getItem('adminActiveTab');
      if (storedTab && menuItems.some(item => item.id === storedTab)) {
        return storedTab;
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }
    
    // Default to dashboard
    return "dashboard";
  }, [getTabFromPath, menuItems]);

  // Initialize tab state from URL or localStorage
  useEffect(() => {
    if (initializedRef.current) return;
    
    const initialTab = getInitialTab();
    console.log(`Initializing admin navigation with tab: ${initialTab}`);
    
    previousPathRef.current = location.pathname + location.search;
    lastActiveTabRef.current = initialTab;
    setActiveTab(initialTab);
    
    initializedRef.current = true;
    
    // Short delay before allowing navigation to prevent initial flicker
    setTimeout(() => {
      setIsNavigationReady(true);
      console.log('Admin navigation is ready');
    }, 50);
  }, [getInitialTab, location.pathname, location.search]);

  // Update active tab when URL changes (external navigation)
  useEffect(() => {
    if (!isNavigationReady) return;
    
    const currentPath = location.pathname + location.search;
    
    // Skip if the path hasn't actually changed
    if (currentPath === previousPathRef.current) {
      return;
    }
    
    previousPathRef.current = currentPath;
    const tabFromPath = getTabFromPath();
    
    console.log(`Path changed to ${currentPath}, extracted tab: ${tabFromPath}`);
    
    // Only update activeTab if the URL contains a valid tab that's different from current
    if (tabFromPath && tabFromPath !== activeTab) {
      // Update refs to prevent loops
      lastActiveTabRef.current = tabFromPath;
      
      // Update state (which will trigger the navigation effect, but it will be skipped
      // because lastActiveTabRef.current === tabFromPath)
      setActiveTab(tabFromPath);
      
      console.log(`URL changed to ${currentPath}, updating active tab to ${tabFromPath}`);
    }
  }, [location.pathname, location.search, activeTab, getTabFromPath, isNavigationReady]);

  // Update URL when active tab changes (internal navigation)
  useEffect(() => {
    if (!isNavigationReady) return;
    
    // Skip if tab hasn't changed from last known value
    if (activeTab === lastActiveTabRef.current && pendingNavigationRef.current === null) {
      return;
    }
    
    // Update refs to track the new state
    lastActiveTabRef.current = activeTab;
    
    // Handle the special case for settings (embedded in dashboard)
    if (activeTab === 'settings') {
      const targetPath = '/admin?tab=settings';
      
      // Skip navigation if we're already on this path
      if ((location.pathname + location.search) === targetPath && pendingNavigationRef.current === null) {
        return;
      }
      
      console.log(`Updating URL to ${targetPath}`);
      navigate(targetPath, { replace: true });
    } else {
      // Calculate the target path
      const targetPath = `/admin/${activeTab === 'dashboard' ? '' : activeTab}`;
      
      // Skip navigation if we're already on this path
      if (location.pathname === targetPath && pendingNavigationRef.current === null) {
        return;
      }
      
      console.log(`Updating URL to ${targetPath}`);
      navigate(targetPath, { replace: true });
    }
    
    try {
      localStorage.setItem('adminActiveTab', activeTab);
    } catch (e) {
      console.warn('Failed to write to localStorage:', e);
    }
    
    // Clear any pending navigation
    pendingNavigationRef.current = null;
    
  }, [activeTab, navigate, location.pathname, location.search, isNavigationReady]);

  // Safe tab change handler that prevents navigation loops
  const handleTabChange = useCallback((tab: string) => {
    if (tab === activeTab) return; // Skip if already on this tab
    
    console.log(`Tab changing to ${tab}`);
    
    // Set pending navigation to be handled in the URL effect
    pendingNavigationRef.current = tab;
    
    // Update the state
    setActiveTab(tab);
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    handleTabChange,
    isNavigationReady
  };
};
