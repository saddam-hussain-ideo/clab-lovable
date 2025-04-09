
import React, { useState, useEffect } from 'react';
import { getLogHistory, logDebug } from '@/utils/debugLogging';
import { Button } from '@/components/ui/button';
import { Code, Bug, RefreshCw, X } from 'lucide-react';

/**
 * Debug panel to show wallet connection logs
 * Only visible in development or when FORCE_DEBUG is true
 */
export const WalletDebugPanel: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<{category: string; message: string}[]>([]);
  const [walletState, setWalletState] = useState<any>(null);
  const [metamaskState, setMetamaskState] = useState<any>(null);
  
  // Get current environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check wallet state
  const checkWalletState = async () => {
    try {
      // Get state from phantom provider if available
      const phantomState = {
        available: false,
        isConnected: false,
        hasPublicKey: false,
        publicKey: null,
        localStorage: {
          walletAddress: localStorage.getItem('walletAddress'),
          walletType: localStorage.getItem('walletType'),
          walletConnectedAt: localStorage.getItem('walletConnectedAt'),
        }
      };
      
      // Check phantom availability
      if (typeof window !== 'undefined' && window.phantom?.solana) {
        phantomState.available = true;
        
        const provider = window.phantom.solana;
        phantomState.isConnected = !!provider.isConnected;
        phantomState.hasPublicKey = !!provider.publicKey;
        
        if (provider.publicKey) {
          phantomState.publicKey = provider.publicKey.toString();
        }
      }
      
      setWalletState(phantomState);
      logDebug('WALLET_DEBUG', `Current Phantom wallet state: ${JSON.stringify(phantomState)}`);
      
      // Check MetaMask state
      const mmState = {
        available: false,
        provider: null,
        accounts: [],
        hasAccounts: false,
        localStorage: {
          walletAddress: localStorage.getItem('walletAddress'),
          walletType: localStorage.getItem('walletType'),
          walletConnectedAt: localStorage.getItem('walletConnectedAt'),
        }
      };
      
      // Check MetaMask availability
      if (typeof window !== 'undefined' && window.ethereum) {
        mmState.available = true;
        mmState.provider = 'ethereum';
        
        // IMPORTANT: Only check accounts if showDebug is true (user explicitly clicked debug)
        // This avoids triggering auto-connection
        if (showDebug) {
          try {
            // Use eth_accounts (read-only method) to check current state
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            mmState.accounts = accounts || [];
            mmState.hasAccounts = Array.isArray(accounts) && accounts.length > 0;
          } catch (err) {
            console.error("Error checking metamask accounts:", err);
          }
        }
        
        // Check for multiple providers
        if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
          mmState.provider = `multiple (${window.ethereum.providers.length})`;
        }
      }
      
      setMetamaskState(mmState);
      logDebug('WALLET_DEBUG', `Current MetaMask state: ${JSON.stringify(mmState)}`);
    } catch (error) {
      console.error('Error getting wallet state:', error);
    }
  };
  
  // Update logs every second if panel is open
  useEffect(() => {
    if (!showDebug) return;
    
    // Check wallet state initially
    checkWalletState();
    
    const intervalId = setInterval(() => {
      setLogs(getLogHistory().filter(log => 
        log.category === 'WALLET' || 
        log.category === 'WALLET_HOOK' || 
        log.category === 'WALLET_BUTTON' ||
        log.category === 'WALLET_DEBUG' ||
        log.category === 'WALLET_REGISTRY'
      ));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [showDebug]);
  
  // Clear logs handler
  const clearLogs = () => {
    const filteredCategories = ['WALLET', 'WALLET_HOOK', 'WALLET_BUTTON', 'WALLET_DEBUG', 'WALLET_REGISTRY'];
    const remainingLogs = getLogHistory().filter(log => !filteredCategories.includes(log.category));
    logDebug('WALLET_DEBUG', 'Cleared wallet-related logs');
    setLogs([]);
  };
  
  // Only show in development or if FORCE_DEBUG is true
  if (!isDevelopment && !showDebug) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        className="bg-background/80 backdrop-blur-sm border-purple-500/30 shadow-md"
        onClick={() => setShowDebug(!showDebug)}
      >
        <Code className="h-5 w-5 text-purple-600" />
      </Button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 w-[560px] max-h-[500px] bg-background/95 backdrop-blur-md p-4 rounded-xl border border-purple-500/30 shadow-lg overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-sm">Wallet Debug Logs</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={checkWalletState}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={clearLogs}
              >
                <X className="h-3 w-3 mr-1" />
                Clear Logs
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowDebug(false)}
              >
                Close
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {walletState && (
              <div className="text-xs bg-background p-2 rounded border border-border/50">
                <h4 className="font-medium mb-1 flex items-center">
                  <Bug className="h-3 w-3 mr-1" />
                  Phantom State
                </h4>
                <div className="font-mono">
                  <div>Available: <span className={walletState.available ? "text-green-500" : "text-red-500"}>{String(walletState.available)}</span></div>
                  <div>isConnected: <span className={walletState.isConnected ? "text-green-500" : "text-red-500"}>{String(walletState.isConnected)}</span></div>
                  <div>Has PublicKey: <span className={walletState.hasPublicKey ? "text-green-500" : "text-red-500"}>{String(walletState.hasPublicKey)}</span></div>
                  <div>PublicKey: <span className="text-muted-foreground">{walletState.publicKey || "null"}</span></div>
                </div>
              </div>
            )}
            
            {metamaskState && (
              <div className="text-xs bg-background p-2 rounded border border-border/50">
                <h4 className="font-medium mb-1 flex items-center">
                  <Bug className="h-3 w-3 mr-1" />
                  MetaMask State
                </h4>
                <div className="font-mono">
                  <div>Available: <span className={metamaskState.available ? "text-green-500" : "text-red-500"}>{String(metamaskState.available)}</span></div>
                  <div>Provider: <span className="text-muted-foreground">{metamaskState.provider || "null"}</span></div>
                  <div>Has Accounts: <span className={metamaskState.hasAccounts ? "text-green-500" : "text-red-500"}>{String(metamaskState.hasAccounts)}</span></div>
                  {metamaskState.accounts && metamaskState.accounts.length > 0 && (
                    <div>Account: <span className="text-muted-foreground">{metamaskState.accounts[0]}</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-3 text-xs bg-background p-2 rounded border border-border/50">
            <h4 className="font-medium mb-1 flex items-center">
              <Bug className="h-3 w-3 mr-1" />
              Local Storage
            </h4>
            <div className="font-mono">
              <div>walletAddress: <span className="text-muted-foreground">{localStorage.getItem('walletAddress') || "null"}</span></div>
              <div>walletType: <span className="text-muted-foreground">{localStorage.getItem('walletType') || "null"}</span></div>
              <div>walletConnectedAt: <span className="text-muted-foreground">{localStorage.getItem('walletConnectedAt') || "null"}</span></div>
            </div>
          </div>
          
          <div className="text-xs font-mono overflow-y-auto max-h-[270px] bg-muted/30 p-2 rounded">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="mb-1 leading-tight whitespace-pre-wrap">
                  {log.message}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No wallet logs available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
