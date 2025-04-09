
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BlogHeaderBanner = () => {
  return (
    <div className="w-full bg-gradient-to-r from-purple-900/90 via-blue-900/80 to-emerald-900/90 py-8 border-y border-zinc-800 relative overflow-hidden shadow-lg">
      {/* Animated sparkle effects */}
      <div className="absolute -top-2 right-1/4 animate-pulse">
        <Sparkles className="h-3 w-3 text-yellow-300 opacity-70" />
      </div>
      <div className="absolute top-1/2 right-1/3 animate-pulse delay-300">
        <Sparkles className="h-4 w-4 text-purple-300 opacity-80" />
      </div>
      <div className="absolute bottom-2 right-1/2 animate-pulse delay-700">
        <Sparkles className="h-3 w-3 text-emerald-300 opacity-70" />
      </div>
      
      {/* Glow effects */}
      <div className="absolute -left-20 -top-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <img 
                src="/lovable-uploads/94e50721-6d36-44b1-8a30-350fe371ebf7.png" 
                alt="CLAB Logo" 
                className="w-12 h-12"
              />
              <h3 className="text-2xl md:text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white">
                CLAB Presale - Limited Time Offer!
              </h3>
            </div>
            <p className="text-gray-200 max-w-md leading-relaxed">
              Secure your CLAB tokens at the best price before they're gone. Early investors get exclusive benefits!
            </p>
          </div>
          <Link to="/#presale">
            <Button 
              size="lg" 
              className="relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white px-8 py-6 h-auto shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 animate-pulse"
            >
              <span className="relative z-10 flex items-center transition-transform duration-300 group-hover:translate-x-1">
                Buy CLAB Now <ArrowRight className="ml-2 h-5 w-5 animate-bounce-slow" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
