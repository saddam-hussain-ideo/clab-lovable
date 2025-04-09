
import { useEffect } from 'react';
import { initSyncService } from '../services/syncService';

/**
 * Hook to initialize app-wide services and listeners
 */
export const useAppInitialization = () => {
  useEffect(() => {
    // Initialize the sync service
    const syncService = initSyncService();
    
    // Clean up function
    return () => {
      // No cleanup needed for now
    };
  }, []);
};
