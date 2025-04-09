import React, { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/supabase';
import AdminDashboard from '../AdminDashboard';
import { UserManager } from '../UserManager';
import { ArticleManager } from '../ArticleManager';
import { QuizManager } from '../QuizManager';
import { SocialMediaManager } from '../SocialMediaManager';
import { TokenManager } from '../TokenManager';
import PageContentManager from '../PageContentManager';
import { PaymentManager } from '../PaymentManager';
import { BannerManager } from '../BannerManager';
import { LogoManager } from '../LogoManager';
import { CryptoTickerManager } from '../CryptoTickerManager';
import { AdvertisementManager } from '../AdvertisementManager';
import AdminTokenPresale from '../AdminTokenPresale';
import { FaqManager } from '../FaqManager';
import { SimpleTokenomicsPage } from '../SimpleTokenomicsPage';
import RpcManagementPage from '../RpcManagementPage';

export function AdminContent() {
  const [activeNetwork, setActiveNetwork] = useState('mainnet');
  const [walletConnected, setWalletConnected] = useState(false);
  const location = useLocation();
  const session = useSession();

  const handleNetworkChange = (network) => {
    setActiveNetwork(network);
  };

  // Initialize wallet state based on session
  useEffect(() => {
    if (session) {
      setWalletConnected(true);
    } else {
      setWalletConnected(false);
    }
  }, [session]);

  // Only log when the path actually changes
  useEffect(() => {
    console.log("AdminContent: Path changed to:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex-grow overflow-auto p-4 pt-8 md:p-6 md:pt-10">
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/users" element={<UserManager />} />
        <Route path="/articles" element={<ArticleManager />} />
        <Route path="/content" element={<PageContentManager />} />
        <Route path="/quiz" element={<QuizManager />} />
        <Route path="/social" element={<SocialMediaManager />} />
        <Route path="/token" element={
          <TokenManager 
            activeNetwork={activeNetwork}
            onNetworkChange={handleNetworkChange}
            walletConnected={walletConnected}
            wallet={null}
          />
        } />
        <Route path="/presale" element={<AdminTokenPresale />} />
        <Route path="/presale/*" element={<AdminTokenPresale />} />
        <Route path="/payments" element={<PaymentManager />} />
        <Route path="/banners" element={<BannerManager />} />
        <Route path="/logos" element={<LogoManager />} />
        <Route path="/tickers" element={<CryptoTickerManager />} />
        <Route path="/advertisements" element={<AdvertisementManager />} />
        <Route path="/faq" element={<FaqManager />} />
        <Route path="/tokenomics" element={<SimpleTokenomicsPage />} />
        <Route path="/rpc" element={<RpcManagementPage />} />
      </Routes>
    </div>
  );
}
