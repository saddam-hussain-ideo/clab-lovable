import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { ProfileLink } from "./ProfileLink";
import { WalletButton } from "../wallet/WalletButton";
import { WalletDisplay } from "../wallet/WalletDisplay";
import { WalletType } from "@/services/wallet/walletService";
import { NavLinks } from "./NavLinks";
import { useEffect } from "react";

interface DesktopNavProps {
  session: Session | null;
  userProfile: any;
  walletConnected: boolean;
  walletAddress?: string | null;
  walletType?: WalletType | null;
  handlePresaleClick: (e: React.MouseEvent) => void;
  onWalletConnectChange: (connected: boolean, address?: string | null, type?: WalletType | null) => void;
}

export const DesktopNav = ({ 
  session, 
  userProfile, 
  walletConnected,
  walletAddress,
  walletType,
  handlePresaleClick, 
  onWalletConnectChange 
}: DesktopNavProps) => {
  
  // Debug logged wallet state
  console.log("[DesktopNav] Rendering with wallet:", {
    connected: walletConnected,
    address: walletAddress ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}` : null,
    type: walletType
  });
  
  const handleWalletDisconnect = () => {
    onWalletConnectChange(false, null, null);
  };
  
  useEffect(() => {
    // Listen for wallet connection events
    const handleWalletChanged = (event: CustomEvent) => {
      const { detail } = event;
      if (detail && detail.action === 'connected') {
        const { wallet } = detail;
        onWalletConnectChange(true, wallet.address, wallet.type);
      } else if (detail.action === 'disconnected') {
        onWalletConnectChange(false, null, null);
      }
    };

    const handleGlobalWalletConnected = (event: CustomEvent) => {
      const { detail } = event;
      if (detail && detail.connected) {
        onWalletConnectChange(true, detail.address, detail.walletType);
      } else {
        onWalletConnectChange(false, null, null);
      }
    };

    window.addEventListener('walletChanged', handleWalletChanged);
    window.addEventListener('globalWalletConnected', handleGlobalWalletConnected);
    
    return () => {
      window.removeEventListener('walletChanged', handleWalletChanged);
      window.removeEventListener('globalWalletConnected', handleGlobalWalletConnected);
    };
  }, [onWalletConnectChange]);
  
  return (
    <div className="hidden md:flex items-center pr-4 space-x-4">
      {/* Use NavLinks component to display main navigation items */}
      <NavLinks 
        handlePresaleClick={handlePresaleClick} 
        walletConnected={walletConnected}
      />
      
      <div className="flex items-center space-x-4">
        <WalletButton 
          variant="nav" 
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onConnectChange={onWalletConnectChange}
          useModal={true}
          isConnected={walletConnected}
          walletAddress={walletAddress}
          walletType={walletType}
        />
        
        <ProfileLink 
          session={session} 
          userProfile={userProfile}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
        />
      </div>
    </div>
  );
};
