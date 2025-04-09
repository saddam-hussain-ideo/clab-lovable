
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface SolanaPayQRCodeProps {
  recipientAddress: string;
  amount: number;
  reference?: string;
  tokenAmount?: number;
  currency?: string;
}

export const SolanaPayQRCode: React.FC<SolanaPayQRCodeProps> = ({
  recipientAddress,
  amount,
  reference,
  tokenAmount,
  currency = 'SOL'
}) => {
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    if (!recipientAddress) return;

    try {
      // Build the Solana Pay URL
      const params = new URLSearchParams();
      
      if (amount) {
        params.append('amount', amount.toString());
      }
      
      if (reference) {
        params.append('reference', reference);
      }
      
      if (currency !== 'SOL') {
        params.append('spl-token', currency);
      }
      
      if (tokenAmount) {
        params.append('label', `Purchase ${tokenAmount} CLAB tokens`);
      }
      
      const solanaPayUrl = `solana:${recipientAddress}?${params.toString()}`;
      setQrData(solanaPayUrl);
      
    } catch (error) {
      console.error('Error generating Solana Pay URL:', error);
    }
  }, [recipientAddress, amount, reference, tokenAmount, currency]);

  return (
    <div className="bg-white p-4 rounded-lg">
      {qrData ? (
        <QRCodeSVG 
          value={qrData} 
          size={200} 
          level="H"
          includeMargin={true}
        />
      ) : (
        <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100">
          Loading QR code...
        </div>
      )}
    </div>
  );
};
