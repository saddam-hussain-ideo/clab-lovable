
import React, { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TokenomicsContent } from '@/lib/types/cms';
import { Loader2 } from 'lucide-react';

interface TokenMetricsProps {
  content?: TokenomicsContent;
  isLoading?: boolean;
}

export const TokenMetrics = ({ content, isLoading }: TokenMetricsProps) => {
  // Debug output to console
  useEffect(() => {
    console.log("TokenMetrics component received content:", content);
    if (content) {
      console.log("TokenMetrics content details:", {
        totalSupply: content.totalSupply,
        tokenType: content.tokenType,
        sectionsCount: content.sections?.length
      });
    }
  }, [content]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-black/40 backdrop-blur-lg border-white/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-6 flex justify-center items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                </div>
                <div className="h-8 mt-1 flex justify-center items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Log the raw content to ensure it's passed correctly
  console.log("TokenMetrics render - Raw content received:", content);

  // Fallback values in case content is undefined or specific properties are missing
  const totalSupply = content?.totalSupply || "69B CLAB";
  const tokenType = content?.tokenType || "SPL Token";

  console.log("TokenMetrics rendering with values:", { totalSupply, tokenType });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <Card className="bg-black/40 backdrop-blur-lg border-white/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-sm text-white/60 uppercase tracking-wide">Total Supply</h3>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{totalSupply}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/40 backdrop-blur-lg border-white/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-sm text-white/60 uppercase tracking-wide">Token Type</h3>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{tokenType}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
