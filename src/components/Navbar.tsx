import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Rocket } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, useSession } from "@/lib/supabase";
import { DesktopNav } from "./navbar/DesktopNav";
import { MobileMenu } from "./navbar/MobileMenu";
import { logDebug } from "@/utils/debugLogging";
import { WalletType } from "@/services/wallet/walletService";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const session = useSession();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCryptoTickerEnabled, setIsCryptoTickerEnabled] = useState(false);
  const location = useLocation();
  const isIndexPage = location.pathname === '/';
  const navigate = useNavigate();
  const walletStateRef = useRef({
    connected: false,
    address: null,
    type: null
  });

  const handleWalletConnectChange = useCallback((connected: boolean, address?: string | null, type?: WalletType | null) => {
    // Validate the incoming data first
    if (connected && (!address || !type)) {
      console.warn("[Navbar] Invalid wallet connection data:", { connected, address, type });
      return; // Don't update state with invalid data
    }

    const currentState = {
      connected,
      address: address || null,
      type: type || null
    };
    
    // Only update if there's an actual change and the data is valid
    const stateChanged = JSON.stringify(currentState) !== JSON.stringify(walletStateRef.current);
    const isValidUpdate = !connected || (connected && address && type);
    
    if (stateChanged && isValidUpdate) {
      logDebug('NAVBAR', `Valid wallet state change: ${JSON.stringify(currentState)}`);
      console.log("[Navbar] Updating wallet state with:", currentState);
      
      walletStateRef.current = currentState;
      setWalletConnected(connected);
      
      if (connected && address) {
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletType', type || 'unknown');
        localStorage.setItem('walletConnectedAt', Date.now().toString());
        
        setWalletAddress(address);
        setWalletType(type || null);
      } else {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletType');
        localStorage.removeItem('walletConnectedAt');
        
        setWalletAddress(null);
        setWalletType(null);
      }
    } else if (!isValidUpdate) {
      console.warn("[Navbar] Ignoring invalid wallet update:", currentState);
    }
  }, []);

  const handlePresaleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const currentPath = window.location.pathname;
    
    if (currentPath !== '/') {
      navigate('/', { state: { scrollToPresale: true } });
    } else {
      const presaleSection = document.getElementById('presale');
      if (presaleSection) {
        presaleSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMenuOpen, navigate]);

  const toggleMenu = useCallback(() => setIsMenuOpen(!isMenuOpen), [isMenuOpen]);

  const fetchUserProfile = useCallback(async () => {
    if (session && walletAddress) {
      try {
        console.log("[Navbar] Fetching user profile for wallet address:", walletAddress);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', walletAddress)
          .eq('wallet_type', walletType)
          .single();

        if (error) throw error;
        
        console.log("[Navbar] Fetched user profile:", data);
        setUserProfile(data);
      } catch (e) {
        console.error('[Navbar] Error fetching wallet profile:', e);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  }, [session, walletAddress, walletType]);

  useEffect(() => {
    const initializeWalletState = () => {
      try {
        const storedWalletAddress = localStorage.getItem('walletAddress');
        const storedWalletType = localStorage.getItem('walletType') as WalletType | null;
        
        console.log("[Navbar] Initializing wallet state from localStorage:", { 
          address: storedWalletAddress, 
          type: storedWalletType 
        });
        
        if (storedWalletAddress !== walletStateRef.current.address) {
          walletStateRef.current = {
            connected: !!storedWalletAddress,
            address: storedWalletAddress,
            type: storedWalletType
          };
          
          setWalletConnected(!!storedWalletAddress);
          setWalletAddress(storedWalletAddress);
          setWalletType(storedWalletType);
          
          if (storedWalletAddress) {
            window.dispatchEvent(new CustomEvent('globalWalletConnected', {
              detail: {
                connected: true,
                address: storedWalletAddress,
                walletType: storedWalletType,
                network: localStorage.getItem('activeNetwork') || 'testnet'
              }
            }));
          }
        }
        
        logDebug('NAVBAR', `Initial wallet state: ${!!storedWalletAddress ? 'connected' : 'disconnected'}`);
        if (storedWalletAddress) {
          logDebug('NAVBAR', `Wallet address: ${storedWalletAddress}, type: ${storedWalletType}`);
        }
      } catch (e) {
        console.error("[Navbar] Error initializing wallet state:", e);
      }
    };
    
    initializeWalletState();
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile, walletAddress, walletType]);

  useEffect(() => {
    if (session) {
      fetchUserProfile();
    }
  }, [session, fetchUserProfile]);

  useEffect(() => {
    const walletState = {
      connected: walletConnected, 
      address: walletAddress ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}` : null,
      type: walletType
    };
    
    if (JSON.stringify(walletState) !== JSON.stringify(walletStateRef.current)) {
      console.log("[Navbar] Wallet state updated:", walletState);
      walletStateRef.current = walletState;
    }
  }, [walletConnected, walletAddress, walletType]);

  useEffect(() => {
    const fetchTickerState = async () => {
      try {
        console.log("Navbar: Setting crypto ticker state to disabled");
        setIsCryptoTickerEnabled(false);
        
        try {
          await supabase
            .from('site_settings')
            .upsert({ 
              key: 'crypto_ticker_enabled', 
              value: 'false' 
            });
            
          console.log("Navbar: Successfully set crypto ticker to disabled in database");
        } catch (dbErr) {
          console.error("Navbar: Error updating crypto ticker state in database:", dbErr);
        }
      } catch (err) {
        console.error("Navbar: Error handling crypto ticker state:", err);
        setIsCryptoTickerEnabled(false);
      }
    };

    fetchTickerState();
    
    const tickerStateChannel = supabase
      .channel('crypto-ticker-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_settings',
        filter: 'key=eq.crypto_ticker_enabled'
      }, (payload) => {
        if (payload.new) {
          console.log("Navbar: Crypto ticker state changed:", payload.new);
          const enabled = (payload.new as any).value === 'true';
          console.log("Navbar: New crypto ticker state:", enabled);
          setIsCryptoTickerEnabled(enabled);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(tickerStateChannel);
    };
  }, []); 

  return (
    <div className="w-full">
      <nav className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between h-[76px]">
            <Link to="/" className="flex items-center gap-2 pl-4">
              <Rocket 
                className="h-8 w-8 text-purple-500" 
                strokeWidth={1.5}
              />
              <span className="text-2xl font-bold text-white">CLAB</span>
            </Link>

            <DesktopNav 
              session={session} 
              userProfile={userProfile} 
              walletConnected={walletConnected}
              walletAddress={walletAddress}
              walletType={walletType}
              handlePresaleClick={handlePresaleClick}
              onWalletConnectChange={handleWalletConnectChange}
            />

            <button className="md:hidden text-white pr-4" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <MobileMenu 
            isOpen={isMenuOpen}
            session={session}
            userProfile={userProfile}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            walletType={walletType}
            handlePresaleClick={handlePresaleClick}
            toggleMenu={toggleMenu}
            onWalletConnectChange={handleWalletConnectChange}
          />
        </div>
      </nav>
    </div>
  );
};
