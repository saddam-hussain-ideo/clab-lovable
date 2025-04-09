import React from 'react';
import { useReownWallet } from '@/hooks/useReownWallet';

export function PhantomNetworkSelector() {
  const { 
    showNetworkSelector, 
    setShowNetworkSelector, 
    connectToPhantomSolana,
    connectToPhantomEthereum,
    isConnecting
  } = useReownWallet();

  if (!showNetworkSelector) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-center mb-2">Select Network for Phantom</h2>
        <p className="text-gray-400 text-center mb-6">
          Choose which network you want to connect with your Phantom wallet
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-700 hover:border-purple-500 hover:bg-purple-900/20"
            onClick={connectToPhantomSolana}
            disabled={isConnecting !== null}
          >
            <img 
              src="/lovable-uploads/4e5b5f8b-196f-43dc-89f5-1a2e9701d523.png" 
              alt="Solana" 
              className="h-12 w-12 mb-2" 
            />
            <span>Solana</span>
          </button>
          
          <button
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-blue-900/20"
            onClick={connectToPhantomEthereum}
            disabled={isConnecting !== null}
          >
            <img 
              src="/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png" 
              alt="Ethereum" 
              className="h-12 w-12 mb-2" 
            />
            <span>Ethereum</span>
          </button>
        </div>
        
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 border border-gray-700 rounded-md hover:bg-gray-800"
            onClick={() => setShowNetworkSelector(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
