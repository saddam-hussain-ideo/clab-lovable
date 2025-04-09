import { Link } from "react-router-dom";
import { SocialMediaLinks } from "./SocialMediaLinks";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
export const Footer = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const checkUserStatus = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      // Check admin status from local storage first (faster)
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(storedIsAdmin);

      // If authenticated, verify admin status from DB
      if (session?.user) {
        try {
          const {
            data: userRoles
          } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
          const hasAdminRole = userRoles && userRoles.some(r => r.role === 'admin');
          setIsAdmin(hasAdminRole);
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };
    checkUserStatus();
  }, []);

  // Handler function to scroll to top when clicking footer links
  const handleLinkClick = () => {
    window.scrollTo(0, 0);
  };
  return <footer className="border-t border-white/10 bg-black/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">CLAB</h3>
            <p className="text-gray-400 text-sm">Master the art of cryptocurrency trading through expert insights and comprehensive market analysis.

Enquires: presale@cryptolikeaboss.com</p>
            <SocialMediaLinks />
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/quiz" className="hover:text-white transition-colors" onClick={handleLinkClick}>Quiz</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors" onClick={handleLinkClick}>Blog</Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-white transition-colors" onClick={handleLinkClick}>Leaderboard</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors" onClick={handleLinkClick}>About CLAB</Link>
              </li>
              <li>
                <Link to="/defi-card" className="hover:text-white transition-colors text-emerald-400" onClick={handleLinkClick}>DEFI Card</Link>
              </li>
              {isAdmin && <li>
                  <Link to="/admin" className="hover:text-white transition-colors text-blue-400" onClick={handleLinkClick}>
                    Admin Dashboard
                  </Link>
                </li>}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/tokenomics" className="hover:text-white transition-colors" onClick={handleLinkClick}>Tokenomics</Link>
              </li>
              <li>
                <Link to="/roadmap" className="hover:text-white transition-colors" onClick={handleLinkClick}>Roadmap</Link>
              </li>
              <li>
                <Link to="/how-to-buy" className="hover:text-white transition-colors" onClick={handleLinkClick}>How to Buy</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors flex items-center gap-1" onClick={handleLinkClick}>
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors" onClick={handleLinkClick}>Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors" onClick={handleLinkClick}>Privacy Policy</Link>
              </li>
              <li className="hidden">
                <Link to="/admin-login" id="admin-access-link">Admin Access</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Disclaimer: By using this website, you agree to our Terms & Conditions and Privacy Policy. Crypto Like A Boss is an educational platform that provides news and general information about cryptocurrency and blockchain technology. The content on this website does not constitute financial or investment advice, nor is it a personal recommendation. Trading and investing in cryptocurrencies is a high-risk activity. You should conduct your own due diligence and consult a qualified professional before making any investment decisions. We accept no liability, direct or indirect, for any damage or loss—alleged or otherwise—arising from the use or reliance on any content published here or on any affiliated platform.
          </p>
          
          <div className="flex flex-col text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Crypto Like A Boss. All rights reserved.</p>
            <p className="mt-2 text-xs">
              Website built by <a href="https://www.jenr8.xyz" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                JENR8
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>;
};
