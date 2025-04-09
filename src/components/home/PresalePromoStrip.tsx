import { Button } from "@/components/ui/button";
import { Diamond, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";

export const PresalePromoStrip = () => {
  const location = useLocation();
  const isTokenomicsPage = location.pathname === "/tokenomics";

  const handlePresaleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If already on tokenomics page, scroll to the presale section
    if (isTokenomicsPage) {
      const presaleElement = document.querySelector('.token-presale-widget');
      if (presaleElement) {
        presaleElement.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    
    // Otherwise navigate to the main presale section on homepage
    const presaleSection = document.getElementById('presale');
    if (presaleSection) {
      presaleSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 bg-black relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-900/30 to-pink-900/30 opacity-50"></div>
      
      {/* Animated particles */}
      <div className="absolute top-0 left-1/4 w-4 h-4 bg-pink-500/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 right-1/3 w-6 h-6 bg-fuchsia-500/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
      
      <div className="container relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-3">
            <Diamond className="w-15 h-15 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">Don't Miss The CLAB Presale!</h3>
              <p className="text-gray-300">Limited tokens available at special launch price</p>
            </div>
          </div>
          <Button 
            onClick={handlePresaleClick}
            className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white px-6 py-6 h-auto group"
          >
            <span>Join Presale Now</span>
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
