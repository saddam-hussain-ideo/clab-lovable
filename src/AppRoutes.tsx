import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import About from './pages/About';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Blog from './pages/Blog';
import Article from './pages/Article';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Tokenomics from './pages/Tokenomics';
import HowToBuy from './pages/HowToBuy';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Roadmap from './pages/Roadmap';
import AuthCallback from './pages/AuthCallback';
import Admin from './pages/Admin';
import QuizPage from './pages/Quiz';
import QuizFullPage from './pages/QuizFullPage';
import Leaderboard from './pages/Leaderboard';
import DefiCard from './pages/DefiCard';
import University from './pages/University';
import FAQ from './pages/FAQ';
import CryptoNews from './pages/CryptoNews';
import { toast } from 'sonner';
import { verifyWalletConnection } from '@/utils/wallet';
import { logDebug, triggerWalletVerification } from '@/utils/debugLogging';

export const AppRoutes = () => {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const location = useLocation();
  // Track if we're actively reconnecting a wallet
  const isReconnecting = useRef(false);
  // Track the last time we checked the wallet connection
  const lastCheckTime = useRef(Date.now());
  // Track verification in progress to avoid duplicate toasts
  const verificationInProgress = useRef(false);

  const checkWalletConnection = useCallback(async () => {
    try {
      // Don't check too frequently (reduced from 5 seconds to 3 seconds)
      const now = Date.now();
      if (now - lastCheckTime.current < 3000) {
        return;
      }
      lastCheckTime.current = now;
      
      const walletAddress = localStorage.getItem('walletAddress');
      const walletConnectedAt = localStorage.getItem('walletConnectedAt');
      const isValid = !!walletAddress && !!walletConnectedAt;
      
      if (isValid && walletConnectedAt) {
        const connectedTime = parseInt(walletConnectedAt, 10);
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        if (now - connectedTime > dayInMs) {
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('walletType');
          localStorage.removeItem('walletConnectedAt');
          setIsWalletConnected(false);
          logDebug("WALLET_CONNECTION", "AppRoutes: Wallet connection expired", {}, true);
          return;
        }
      }
      
      if (isValid) {
        const isConnected = await verifyWalletConnection();
        
        // Only update state if it's changed to avoid unnecessary re-renders
        if (isConnected !== isWalletConnected) {
          setIsWalletConnected(isConnected);
          logDebug("WALLET_CONNECTION", "AppRoutes: Verified wallet connection state changed", { 
            isConnected,
            address: walletAddress,
            previous: isWalletConnected
          }, true);
          
          // Broadcast wallet connection state change globally
          window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
            detail: { 
              isConnected,
              address: walletAddress,
              walletType: localStorage.getItem('walletType'),
              timestamp: Date.now()
            }
          }));
        }
        
        if (!isConnected && walletAddress && !isReconnecting.current && !verificationInProgress.current) {
          logDebug("WALLET_CONNECTION", "AppRoutes: Wallet verification failed but found stored wallet, attempting to recover connection", {
            address: walletAddress,
            type: localStorage.getItem('walletType')
          }, true);
          
          // Set flags to prevent multiple simultaneous reconnection attempts
          isReconnecting.current = true;
          verificationInProgress.current = true;
          
          // Show toast only once during verification
          toast.loading("Verifying wallet connection...", {
            id: "wallet-verification",
            duration: 3000,
          });
          
          // Dispatch a wallet reconnection event
          window.dispatchEvent(new CustomEvent('walletChanged', {
            detail: { 
              action: 'reconnect',
              wallet: walletAddress,
              walletType: localStorage.getItem('walletType')
            }
          }));
          
          // Reset reconnecting flag after a short delay (reduced from 10s to 5s)
          setTimeout(() => {
            isReconnecting.current = false;
            // Check again after attempting reconnection
            checkWalletConnection();
          }, 5000);
          
          // Reset verification flag after a slightly longer delay
          setTimeout(() => {
            verificationInProgress.current = false;
          }, 8000);
        }
      } else {
        if (isWalletConnected) {
          setIsWalletConnected(false);
          // Broadcast wallet disconnection
          window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
            detail: { 
              isConnected: false,
              timestamp: Date.now()
            }
          }));
        }
        logDebug("WALLET_CONNECTION", "AppRoutes: No wallet connection found in storage", {}, true);
      }
    } catch (e) {
      console.error("AppRoutes: Error checking wallet connection:", e);
      setIsWalletConnected(false);
    }
  }, [isWalletConnected]);

  // Listen for wallet connection lost events and attempt to reconnect
  useEffect(() => {
    const handleWalletConnectionLost = (event: CustomEvent) => {
      const { detail } = event;
      
      if (detail?.address && !isReconnecting.current && !verificationInProgress.current) {
        logDebug("WALLET_CONNECTION", "AppRoutes: Received wallet connection lost event", detail, true);
        
        // Set flags to prevent multiple simultaneous reconnection attempts
        isReconnecting.current = true;
        verificationInProgress.current = true;
        
        // Create a toast to inform the user
        toast.error("Wallet connection lost", {
          description: "Please reconnect your wallet",
          action: {
            label: "Reconnect",
            onClick: () => window.dispatchEvent(new CustomEvent('walletReconnectRequested', {
              detail: { 
                action: 'reconnect',
                wallet: detail.address,
                walletType: detail.type
              }
            }))
          }
        });
        
        // Reset reconnecting flag after a short delay
        setTimeout(() => {
          isReconnecting.current = false;
          
          // Check if reconnection was successful
          checkWalletConnection();
        }, 5000);
        
        // Reset verification flag after a slightly longer delay
        setTimeout(() => {
          verificationInProgress.current = false;
        }, 8000);
      }
    };
    
    // Listen for manual verification requests
    const handleVerifyWalletConnection = () => {
      if (!verificationInProgress.current) {
        checkWalletConnection();
      }
    };
    
    window.addEventListener('walletConnectionLost', handleWalletConnectionLost as EventListener);
    window.addEventListener('verifyWalletConnection', handleVerifyWalletConnection as EventListener);
    
    return () => {
      window.removeEventListener('walletConnectionLost', handleWalletConnectionLost as EventListener);
      window.removeEventListener('verifyWalletConnection', handleVerifyWalletConnection as EventListener);
    };
  }, [checkWalletConnection]);

  useEffect(() => {
    logDebug("WALLET_CONNECTION", "AppRoutes: Checking wallet connection due to route change:", 
      { path: location.pathname }, true);
    checkWalletConnection();
    
    // Set up periodic wallet verification
    const verificationInterval = setInterval(() => {
      if (!verificationInProgress.current) {
        checkWalletConnection();
      }
    }, 15000); // Check every 15 seconds
    
    return () => clearInterval(verificationInterval);
  }, [location, checkWalletConnection]);

  useEffect(() => {
    const handleWalletConnection = (event: CustomEvent) => {
      try {
        const detail = event.detail;
        logDebug("WALLET_CONNECTION", "AppRoutes: Wallet event received:", detail, true);
        
        if (detail?.connected === true || (detail?.action === 'connected' && detail?.wallet)) {
          if (detail.address || detail.wallet) {
            const address = detail.address || detail.wallet;
            localStorage.setItem('walletAddress', address);
            if (detail.walletType || detail.type) {
              localStorage.setItem('walletType', detail.walletType || detail.type);
            }
            
            // Set connected timestamp
            localStorage.setItem('walletConnectedAt', Date.now().toString());
            
            // Trigger profile loading for the connected wallet
            import('./services/wallet/walletSessionManager').then(({ walletSessionManager }) => {
              console.log("[AppRoutes] Wallet connected, loading profile data");
              walletSessionManager.loadProfileForCurrentWallet().catch(err => {
                console.error("[AppRoutes] Error loading profile after wallet connection:", err);
              });
            });
            
            // Update UI state
            setIsWalletConnected(true);
            
            // Broadcast wallet connection state change globally
            window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
              detail: { 
                isConnected: true,
                address: address,
                walletType: detail.walletType || detail.type,
                timestamp: Date.now()
              }
            }));
          }
        } else if (detail?.connected === false || detail?.action === 'disconnected') {
          setIsWalletConnected(false);
          
          // Broadcast wallet disconnection
          window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
            detail: { 
              isConnected: false,
              timestamp: Date.now()
            }
          }));
          
          if (location.pathname.includes('/profile')) {
            logDebug("WALLET_CONNECTION", "AppRoutes: Wallet disconnected while on profile page, redirecting to home", 
              {}, true);
            window.location.href = '/';
          }
        } else if (detail?.action === 'reconnect' && detail?.wallet && !isReconnecting.current) {
          // Handle reconnection attempt
          isReconnecting.current = true;
          
          logDebug("WALLET_CONNECTION", "AppRoutes: Attempting to reconnect wallet", {
            address: detail.wallet,
            type: detail.walletType
          }, true);
          
          // Try to reconnect based on wallet type
          const walletType = detail.walletType || localStorage.getItem('walletType');
          
          if (walletType === 'phantom' && window.phantom?.solana) {
            // Try to reconnect Phantom
            window.phantom.solana.connect({ onlyIfTrusted: true })
              .then((connection) => {
                if (connection && connection.publicKey) {
                  const address = connection.publicKey.toString();
                  localStorage.setItem('walletAddress', address);
                  localStorage.setItem('walletType', 'phantom');
                  localStorage.setItem('walletConnectedAt', Date.now().toString());
                  
                  setIsWalletConnected(true);
                  
                  // Dispatch connection event
                  window.dispatchEvent(new CustomEvent('walletChanged', {
                    detail: {
                      action: 'connected',
                      wallet: address,
                      walletType: 'phantom',
                      time: new Date().toISOString()
                    }
                  }));
                  
                  // Also dispatch verified event
                  window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
                    detail: { 
                      isConnected: true,
                      address: address,
                      walletType: 'phantom',
                      timestamp: Date.now()
                    }
                  }));
                  
                  logDebug("WALLET_CONNECTION", "AppRoutes: Successfully reconnected Phantom wallet", {
                    address
                  }, true);
                  
                  toast.success("Wallet reconnected successfully");
                } else {
                  logDebug("WALLET_CONNECTION", "AppRoutes: Failed to reconnect Phantom wallet", {}, true);
                  
                  // Clear any stale wallet data
                  localStorage.removeItem('walletAddress');
                  localStorage.removeItem('walletType');
                  localStorage.removeItem('walletConnectedAt');
                  
                  toast.error("Failed to reconnect wallet. Please try connecting manually.");
                  
                  // Broadcast disconnect
                  window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
                    detail: { 
                      isConnected: false,
                      timestamp: Date.now()
                    }
                  }));
                }
              })
              .catch((error) => {
                logDebug("WALLET_CONNECTION", "AppRoutes: Error reconnecting Phantom wallet", { error }, true);
                toast.error("Error reconnecting wallet");
                
                // Clear any stale wallet data
                localStorage.removeItem('walletAddress');
                localStorage.removeItem('walletType');
                localStorage.removeItem('walletConnectedAt');
                
                // Broadcast disconnect
                window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
                  detail: { 
                    isConnected: false,
                    timestamp: Date.now()
                  }
                }));
              })
              .finally(() => {
                isReconnecting.current = false;
              });
          } else if (walletType === 'solflare' && window.solflare) {
            // Try to reconnect Solflare
            window.solflare.connect()
              .then(() => {
                if (window.solflare.isConnected && window.solflare.publicKey) {
                  const address = window.solflare.publicKey.toString();
                  localStorage.setItem('walletAddress', address);
                  localStorage.setItem('walletType', 'solflare');
                  localStorage.setItem('walletConnectedAt', Date.now().toString());
                  
                  setIsWalletConnected(true);
                  
                  // Dispatch connection event
                  window.dispatchEvent(new CustomEvent('walletChanged', {
                    detail: {
                      action: 'connected',
                      wallet: address,
                      walletType: 'solflare',
                      time: new Date().toISOString()
                    }
                  }));
                  
                  // Also dispatch verified event
                  window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
                    detail: { 
                      isConnected: true,
                      address: address,
                      walletType: 'solflare',
                      timestamp: Date.now()
                    }
                  }));
                  
                  logDebug("WALLET_CONNECTION", "AppRoutes: Successfully reconnected Solflare wallet", {
                    address
                  }, true);
                  
                  toast.success("Wallet reconnected successfully");
                } else {
                  logDebug("WALLET_CONNECTION", "AppRoutes: Failed to reconnect Solflare wallet", {}, true);
                  
                  // Clear any stale wallet data
                  localStorage.removeItem('walletAddress');
                  localStorage.removeItem('walletType');
                  localStorage.removeItem('walletConnectedAt');
                  
                  toast.error("Failed to reconnect wallet. Please try connecting manually.");
                  
                  // Broadcast disconnect
                  window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
                    detail: { 
                      isConnected: false,
                      timestamp: Date.now()
                    }
                  }));
                }
              })
              .catch((error) => {
                logDebug("WALLET_CONNECTION", "AppRoutes: Error reconnecting Solflare wallet", { error }, true);
                toast.error("Error reconnecting wallet");
                
                // Clear any stale wallet data
                localStorage.removeItem('walletAddress');
                localStorage.removeItem('walletType');
                localStorage.removeItem('walletConnectedAt');
                
                // Broadcast disconnect
                window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
                  detail: { 
                    isConnected: false,
                    timestamp: Date.now()
                  }
                }));
              })
              .finally(() => {
                isReconnecting.current = false;
              });
          } else {
            // For other wallet types, just reset the reconnecting flag
            isReconnecting.current = false;
            
            // Clear any stale wallet data
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('walletType');
            localStorage.removeItem('walletConnectedAt');
            
            // Broadcast disconnect
            window.dispatchEvent(new CustomEvent('walletConnectionVerified', {
              detail: { 
                isConnected: false,
                timestamp: Date.now()
              }
            }));
          }
        }
      } catch (e) {
        console.error("AppRoutes: Error handling wallet event:", e);
        isReconnecting.current = false;
      }
    };
    
    window.addEventListener('globalWalletConnected', handleWalletConnection as EventListener);
    window.addEventListener('walletChanged', handleWalletConnection as EventListener);
    
    // Initial check
    checkWalletConnection();
    
    // Trigger a global wallet verification after the component mounts
    setTimeout(() => {
      triggerWalletVerification();
    }, 1000);
    
    return () => {
      window.removeEventListener('globalWalletConnected', handleWalletConnection as EventListener);
      window.removeEventListener('walletChanged', handleWalletConnection as EventListener);
    };
  }, [checkWalletConnection, location.pathname]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isWalletConnected) {
      const walletAddress = localStorage.getItem('walletAddress');
      if (!walletAddress) {
        toast.error("Please connect your wallet to access the Dashboard");
        return <Navigate to="/" replace />;
      }
    }
    
    return <>{children}</>;
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<Article />} />
      <Route path="/article/:slug" element={<Article />} />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/tokenomics" element={<Tokenomics />} />
      <Route path="/how-to-buy" element={<HowToBuy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/defi-card" element={<DefiCard />} />
      <Route path="/university" element={<University />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/quiz-full" element={<QuizFullPage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/crypto-news" element={<CryptoNews />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
