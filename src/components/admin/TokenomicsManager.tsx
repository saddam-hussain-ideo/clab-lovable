import React, { useRef, useEffect, useMemo } from 'react';
import { AdminTokenomicsContent } from './TokenomicsContent';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminNavigation } from "@/hooks/useAdminNavigation";
import { useLocation } from "react-router-dom";

export function TokenomicsManager() {
  const { activeTab, handleTabChange } = useAdminNavigation();
  const location = useLocation();
  const initialMountRef = useRef(true);

  // Memoize the content component to prevent unnecessary re-renders
  const content = useMemo(() => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tokenomics Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Manage your project's tokenomics configuration including allocation percentages, 
              distribution schedules, and token metrics.
            </p>
            
            <AdminTokenomicsContent />
          </CardContent>
        </Card>
      </div>
    );
  }, []);

  // Handle tab change only on initial mount
  useEffect(() => {
    if (initialMountRef.current && 
        location.pathname.includes('/admin/tokenomics') && 
        activeTab !== 'tokenomics') {
      handleTabChange('tokenomics');
      initialMountRef.current = false;
    }
  }, [activeTab, handleTabChange]);

  return content;
}
