import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
export const DefiBanner = () => {
  return <section className="relative w-full overflow-hidden bg-black h-[500px]">
      {/* Full background image */}
      <div className="absolute inset-0 w-full h-full">
        <img alt="CLAB DEFI Crypto Card Background" className="w-full h-full object-cover" src="/lovable-uploads/43b68837-747c-4cfe-bd16-86217f14ec34.jpg" />
      </div>
      
      {/* Background gradient overlay with reduced opacity for better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-6 h-full">
        <div className="relative flex items-center h-full">
          {/* Text content on the left */}
          <div className="z-10 w-full md:w-1/2 text-white">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              Spend like a <span className="text-emerald-400">BOSS</span> with the world's first DEFI Crypto Card
            </h2>
            <p className="text-gray-300 mb-6 max-w-md">
              Access your crypto assets anytime, anywhere with our secure and seamless DEFI card solution.
            </p>
            <Link to="/defi-card">
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white px-6 py-6 h-auto group">
                <span>Learn More</span>
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>;
};