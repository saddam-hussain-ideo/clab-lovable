import { type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';

export const handleInputChange = (
  value: string,
  setter: Dispatch<SetStateAction<string>>
) => {
  // Remove non-numeric characters except for decimal point
  let sanitizedValue = value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = sanitizedValue.split('.');
  if (parts.length > 2) {
    sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Ensure we don't have more than 6 decimal places
  if (parts.length === 2 && parts[1].length > 6) {
    sanitizedValue = parts[0] + '.' + parts[1].substring(0, 6);
  }
  
  // Clean leading zeros (but keep a single zero)
  if (sanitizedValue.startsWith('0') && sanitizedValue.length > 1 && sanitizedValue[1] !== '.') {
    sanitizedValue = sanitizedValue.replace(/^0+/, '');
  }
  
  // Set the value even if empty to allow clearing the input
  setter(sanitizedValue);
  
  // Log the value for debugging
  console.log(`Input changed to: '${sanitizedValue}'`);
};

export const fetchActivePresaleStage = async (
  network: 'mainnet' | 'testnet' = 'mainnet'
) => {
  try {
    const { data, error } = await supabase
      .from('presale_stages')
      .select('*')
      .eq('is_active', true)
      .eq('network', network)
      .single();
    
    if (error) {
      console.error("Error fetching active presale stage:", error);
      return null;
    }
    
    console.log("Fetched active presale stage:", data);
    return data;
  } catch (err) {
    console.error("Unexpected error fetching presale stage:", err);
    return null;
  }
};

export const getMinimumPurchaseAmount = async (
  currency: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
  solPrice: number = 0
): Promise<number> => {
  try {
    // Updated default minimum purchase amounts
    const DEFAULT_MIN_SOL = 0.001;  // Changed from 0.1 to 0.001
    const DEFAULT_MIN_USDC = 1;     // Changed from 10 to 1
    const DEFAULT_MIN_USDT = 1;     // Changed from 10 to 1
    
    // Fetch presale settings
    const { data, error } = await supabase
      .from('presale_settings')
      .select('min_purchase_sol, min_purchase_usdc, min_purchase_usdt')
      .eq('network', network)
      .maybeSingle();
    
    if (error || !data) {
      console.warn("Could not fetch minimum purchase amounts, using defaults", error);
      
      if (currency === 'SOL') return DEFAULT_MIN_SOL;
      if (currency === 'USDC') return DEFAULT_MIN_USDC;
      if (currency === 'USDT') return DEFAULT_MIN_USDT;
      return DEFAULT_MIN_SOL;
    }
    
    // Return the appropriate minimum based on currency, or use defaults if not set
    if (currency === 'SOL') return data.min_purchase_sol || DEFAULT_MIN_SOL;
    if (currency === 'USDC') return data.min_purchase_usdc || DEFAULT_MIN_USDC;
    if (currency === 'USDT') return data.min_purchase_usdt || DEFAULT_MIN_USDT;
    
    return DEFAULT_MIN_SOL;
  } catch (err) {
    console.error("Error getting minimum purchase amount:", err);
    return currency === 'SOL' ? 0.001 : 1; // Updated fallback defaults
  }
};

// New utility functions for network management
export const getNetworkPreference = async (): Promise<{
  show_network_toggle: boolean;
  active_network: 'mainnet' | 'testnet';
}> => {
  try {
    // First try to get settings from page_content table
    const { data, error } = await supabase
      .from("page_content")
      .select("content")
      .eq("page_id", "tokenomics")
      .eq("section_id", "presale_ui_settings")
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching network preferences:", error);
      return { show_network_toggle: false, active_network: 'mainnet' };
    }
    
    if (data?.content) {
      return {
        show_network_toggle: data.content.show_network_toggle || false,
        active_network: data.content.active_network || 'mainnet'
      };
    }
    
    // Fallback to default values
    return { show_network_toggle: false, active_network: 'mainnet' };
  } catch (error) {
    console.error("Error in getNetworkPreference:", error);
    return { show_network_toggle: false, active_network: 'mainnet' };
  }
};

export const setActiveNetwork = (network: 'mainnet' | 'testnet'): void => {
  localStorage.setItem('activeNetwork', network);
  
  // Optionally dispatch an event that components can listen for
  const event = new CustomEvent('networkChanged', {
    detail: {
      network
    }
  });
  window.dispatchEvent(event);
};

export const getActiveNetwork = (): 'mainnet' | 'testnet' => {
  // For admins, respect their preference if set
  const adminPreference = localStorage.getItem('userNetworkPreference');
  if (adminPreference === 'mainnet' || adminPreference === 'testnet') {
    return adminPreference;
  }
  
  // Otherwise use the global setting
  const globalPreference = localStorage.getItem('activeNetwork');
  if (globalPreference === 'mainnet' || globalPreference === 'testnet') {
    return globalPreference;
  }
  
  // Default to mainnet
  return 'mainnet';
};
