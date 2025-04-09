
import { useEffect, useRef } from 'react';

export const useVisibility = (onVisible?: () => void, onHidden?: () => void) => {
  const isVisible = useRef(true);
  const firstLoad = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      
      // Skip callback on first visibility change which happens on initial page load
      if (firstLoad.current) {
        firstLoad.current = false;
        isVisible.current = visible;
        return;
      }
      
      // Only trigger callbacks when visibility actually changes
      if (visible !== isVisible.current) {
        isVisible.current = visible;
        
        if (visible && onVisible) {
          onVisible();
        } else if (!visible && onHidden) {
          onHidden();
        }
      }
    };

    // Set initial state
    isVisible.current = document.visibilityState === 'visible';
    
    // Add listener for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisible, onHidden]);

  return { isVisible: () => isVisible.current };
};
