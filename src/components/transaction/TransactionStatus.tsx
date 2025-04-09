
import React, { useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTransactionMonitor } from '@/hooks/useTransactionMonitor';
import { Button } from '@/components/ui/button';

interface TransactionStatusProps {
  txHash: string | null;
  network?: 'mainnet' | 'testnet';
  onClose?: () => void;
}

export function TransactionStatus({ 
  txHash, 
  network = 'mainnet',
  onClose
}: TransactionStatusProps) {
  const { status, confirmations, error, isLoading } = useTransactionMonitor(
    txHash,
    network
  );

  // When component mounts, scroll to it to ensure user sees the transaction status
  useEffect(() => {
    if (txHash) {
      // Use setTimeout to ensure the component is rendered before scrolling
      setTimeout(() => {
        const element = document.getElementById(`tx-status-${txHash}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [txHash]);

  if (!txHash) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Transaction pending...';
      case 'confirmed':
        return `Transaction confirmed with ${confirmations} confirmations`;
      case 'failed':
        return 'Transaction failed';
      default:
        return 'Transaction status unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'confirmed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const shortenTxHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  const openExplorer = () => {
    const baseUrl = network === 'mainnet' 
      ? 'https://etherscan.io/tx/' 
      : 'https://sepolia.etherscan.io/tx/';
    window.open(`${baseUrl}${txHash}`, '_blank');
  };

  return (
    <div id={`tx-status-${txHash}`} className="p-4 border rounded-lg bg-card shadow-sm mt-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-medium flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      
      <div className="mt-2 text-sm text-muted-foreground">
        <p className="flex items-center">
          Transaction: 
          <span className="ml-1 font-mono">{shortenTxHash(txHash)}</span>
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs px-1 h-6 text-blue-500"
            onClick={openExplorer}
          >
            View on Etherscan
          </Button>
        </p>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
      
      {isLoading && (
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking transaction status...
        </div>
      )}
    </div>
  );
}
