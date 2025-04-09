
import React, { useState } from 'react';
import { PresaleSettings } from './PresaleSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PresaleAdminProps {
  activeNetwork: string;
  onNetworkChange: (network: string) => void;
}

export const PresaleAdmin: React.FC<PresaleAdminProps> = ({
  activeNetwork,
  onNetworkChange
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch presale settings
  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['presaleSettings', activeNetwork],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presale_settings')
        .select('*')
        .eq('id', activeNetwork === 'mainnet' ? 'default' : 'testnet')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="pt-16">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Presale Configuration</h2>
        <PresaleSettings 
          settings={settings}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          refetchSettings={refetchSettings}
          activeNetwork={activeNetwork}
          onNetworkChange={(network) => onNetworkChange(network)}
        />
      </div>
    </div>
  );
};
