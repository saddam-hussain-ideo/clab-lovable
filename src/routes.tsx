
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './contexts/AuthContext';

// Lazy load components for better performance
const Home = React.lazy(() => import('./pages/Index'));
const Mint = React.lazy(() => import('./pages/NotFound'));
const Staking = React.lazy(() => import('./pages/NotFound'));
const Quiz = React.lazy(() => import('./pages/Quiz'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const Tokenomics = React.lazy(() => import('./pages/Tokenomics'));
const Admin = React.lazy(() => import('./pages/Admin'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Presale = React.lazy(() => import('./pages/NotFound'));
const Roadmap = React.lazy(() => import('./pages/Roadmap'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminTokenomics = React.lazy(() => import('./pages/admin/Tokenomics'));
const RpcManagementPage = React.lazy(() => import('./components/admin/RpcManagementPage'));

// Create a loading component
const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen bg-black text-white">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin mb-2"></div>
      <p>Loading...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <Router>
      <React.Suspense fallback={<LoadingComponent />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/staking" element={<Staking />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/tokenomics" element={<Tokenomics />} />
          <Route path="/presale" element={<Presale />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Main admin route with proper nesting */}
          <Route path="/admin/*" element={
            isAdmin ? <Admin /> : <Navigate to="/admin-login" replace />
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
};

export default AppRoutes;
