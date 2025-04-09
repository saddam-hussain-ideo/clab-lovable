
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { ProfileLink } from "./ProfileLink";
import { WalletButton } from "../wallet/WalletButton";
import { WalletDisplay } from "../wallet/WalletDisplay";
import { WalletType } from "@/services/wallet/walletService";
import { NavLinks } from "./NavLinks";

interface MobileMenuProps {
  isOpen: boolean;
  session: Session | null;
  userProfile: any;
  walletConnected: boolean;
  walletAddress?: string | null;
  walletType?: WalletType | null;
  handlePresaleClick: (e: React.MouseEvent) => void;
  toggleMenu: () => void;
  onWalletConnectChange: (connected: boolean, address?: string | null, type?: WalletType | null) => void;
}

export const MobileMenu = ({ 
  isOpen,
  session, 
  userProfile, 
  walletConnected,
  walletAddress,
  walletType,
  handlePresaleClick,
  toggleMenu,
  onWalletConnectChange
}: MobileMenuProps) => {
  
  console.log("[MobileMenu] Rendering with wallet:", {
    connected: walletConnected,
    address: walletAddress ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}` : null,
    type: walletType
  });

  const handleWalletDisconnect = () => {
    onWalletConnectChange(false, null, null);
    toggleMenu();
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden absolute top-[76px] left-0 right-0 bg-black/95 border-b border-white/10 py-4 z-10">
      <div className="flex flex-col">
        {/* Use NavLinks component with mobile prop to properly format menu items */}
        <NavLinks 
          handlePresaleClick={(e) => {
            handlePresaleClick(e);
            toggleMenu();
          }} 
          onItemClick={toggleMenu}
          mobile={true}
          walletConnected={walletConnected}
        />
        
        <div className="mt-4 px-4">
          {walletConnected && walletAddress ? (
            <div className="mb-3 p-3 bg-zinc-800/80 rounded-md border border-zinc-700/60">
              <WalletDisplay 
                walletAddress={walletAddress}
                walletType={walletType}
                onDisconnect={handleWalletDisconnect}
                variant="default"
              />
            </div>
          ) : (
            <WalletButton
              variant="default"
              size="default"
              className="w-full mb-3 bg-purple-600 hover:bg-purple-700 text-white"
              onConnectChange={onWalletConnectChange}
              useModal={true}
              isConnected={walletConnected}
            />
          )}
        </div>
        
        <ProfileLink 
          session={session} 
          userProfile={userProfile} 
          onItemClick={toggleMenu} 
          mobile={true}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
        />
      </div>
    </div>
  );
};
