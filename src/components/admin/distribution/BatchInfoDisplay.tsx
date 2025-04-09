
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader2, Wallet, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Recipient {
  walletAddress: string;
  tokenAmount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
}

interface BatchInfo {
  batchNumber: number;
  totalBatches: number;
  recipients: Recipient[];
  status: 'processing' | 'success' | 'failed' | 'waiting';
  error?: string;
  txHash?: string;
}

interface BatchInfoDisplayProps {
  batchInfo: BatchInfo;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  network?: string;
}

export const BatchInfoDisplay: React.FC<BatchInfoDisplayProps> = ({ 
  batchInfo, 
  isOpen = false,
  onToggle,
  network = 'testnet'
}) => {
  const [open, setOpen] = React.useState(isOpen);
  
  const handleToggle = (newState: boolean) => {
    setOpen(newState);
    onToggle?.(newState);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'waiting':
        return <Wallet className="h-4 w-4 text-gray-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            Failed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Processing
          </Badge>
        );
      case 'waiting':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Waiting
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Pending
          </Badge>
        );
    }
  };
  
  const truncateAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getExplorerUrl = (txHash: string) => {
    const baseUrl = network === 'mainnet' 
      ? 'https://explorer.solana.com/tx/' 
      : 'https://explorer.solana.com/tx/?cluster=devnet';
    return `${baseUrl}${txHash}`;
  };
  
  return (
    <Card className="mb-2 overflow-hidden">
      <Collapsible open={open} onOpenChange={handleToggle}>
        <div className="p-2 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(batchInfo.status)}
            <span className="font-medium">Batch {batchInfo.batchNumber} of {batchInfo.totalBatches}</span>
            <span className="text-sm text-muted-foreground">
              ({batchInfo.recipients.length} recipients)
            </span>
            {getStatusBadge(batchInfo.status)}
          </div>
          <CollapsibleTrigger className="p-2 hover:bg-muted rounded-full">
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <CardContent className="p-2">
            {batchInfo.error && (
              <Alert variant="destructive" className="mb-2 text-red-800 bg-red-100">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <AlertDescription>
                  <span className="font-semibold">Error:</span> {batchInfo.error}
                </AlertDescription>
              </Alert>
            )}
            
            {batchInfo.status === 'waiting' && (
              <Alert variant="warning" className="mb-2 text-yellow-800 bg-yellow-100">
                <Wallet className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <AlertDescription>
                  Waiting for wallet confirmation. Please approve the transaction in your wallet when prompted.
                </AlertDescription>
              </Alert>
            )}
            
            {batchInfo.txHash && (
              <div className="mb-2 flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                <span className="font-mono">{truncateAddress(batchInfo.txHash)}</span>
                <a 
                  href={getExplorerUrl(batchInfo.txHash)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {batchInfo.recipients.map((recipient, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(recipient.status)}
                    <span className="font-mono text-sm">{truncateAddress(recipient.walletAddress)}</span>
                  </div>
                  <div className="text-sm text-right">
                    {recipient.tokenAmount.toLocaleString(undefined, {
                      maximumFractionDigits: 2
                    })} tokens
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
