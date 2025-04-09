
import React, { useEffect, useState } from 'react';
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ChevronRight, Wallet, CreditCard, ShieldCheck, Banknote, Globe, Gift } from "lucide-react";
import { Helmet } from "react-helmet";
import { WaitlistModal } from "@/components/defi/WaitlistModal";

const DefiCard = () => {
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <Layout>
      <Helmet>
        <title>CLAB DEFI Crypto Card | Crypto Like A Boss</title>
        <meta name="description" content="Spend your crypto anywhere with the world's first DEFI Crypto Card. Get CLAB token cashback on every purchase." />
      </Helmet>
      
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        {/* Hero Section with Banner Image */}
        <section className="relative w-full overflow-hidden bg-black h-[500px]">
          {/* Full background image */}
          <div className="absolute inset-0 w-full h-full">
            <img src="/lovable-uploads/ccc0c7ff-1d00-4880-a969-bb147bc82631.png" alt="CLAB DEFI Crypto Card Background" className="w-full h-full object-cover" loading="eager" />
          </div>
          
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none"></div>
          
          <div className="container mx-auto px-4 md:px-6 h-full">
            <div className="relative flex items-center h-full">
              <div className="z-10 w-full md:w-2/3 text-white pt-[50px]">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                  The World's First <span className="text-emerald-400">DEFI Crypto Card</span>
                </h1>
                <p className="text-xl text-gray-300 mb-6 max-w-2xl">
                  Spend your crypto anywhere, anytime with the most advanced DEFI card solution.
                </p>
                <Button 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white px-6 py-3 rounded-md font-medium text-lg"
                  onClick={() => setWaitlistModalOpen(true)}
                >
                  GET YOUR CARD NOW
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Top Info Boxes - Moved from bottom */}
        <section className="py-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Global Acceptance with purple highlight */}
              <div className="bg-gradient-to-r from-purple-900/30 to-zinc-800/50 rounded-lg p-6 md:p-8 backdrop-blur-sm border border-purple-500/30">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white flex items-center">
                  <Globe className="h-6 w-6 md:h-8 md:w-8 mr-3 text-purple-400 flex-shrink-0" />
                  <span>Get Your Free CLAB Crypto Card – Limited Offer!</span>
                </h2>
                <p className="text-gray-300 mb-4 font-normal">Unlock exclusive benefits when you invest $1,000 USD or more in CLAB tokens. As part of our Crypto Like a Boss launch offer, you’ll receive a complimentary CLAB Crypto Card—your gateway to seamless crypto transactions.

💳 Spend Crypto Anywhere
🌍 Access Competitive Exchange Rates
💰 Enjoy Lower Fees Than Banks

Take control of your crypto on the go. Claim your free card today! 🚀</p>
                <p className="text-gray-300">💳 Spend Crypto Anywhere
🌍 Access Competitive Exchange Rates
💰 Enjoy Lower Fees Than Banks

Take control of your crypto on the go. Claim your free card today! 🚀</p>
              </div>

              {/* Exclusive Member Benefits */}
              <div className="bg-zinc-800/50 rounded-lg p-6 md:p-8 backdrop-blur-sm border border-zinc-700/50">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white flex items-center">
                  <Gift className="h-6 w-6 md:h-8 md:w-8 mr-3 text-emerald-400 flex-shrink-0" />
                  <span>Travel Insurance</span>
                </h2>
                <p className="text-gray-300 mb-4">The CLAB Visa travel insurance is a benefit that offers you protection and emergency international medical assistance when you travel abroad for up to sixty consecutive days. This way, you can rest assured if any accident, emergency, or unexpected medical event occurs during your trip.</p>
                <p className="text-gray-300">
                  As our ecosystem grows, so do the benefits. Members will enjoy priority access to new CLAB ecosystem features and products before they're available to the general public.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Left side content */}
              <div className="space-y-6 md:space-y-8">
                <div className="bg-zinc-800/50 rounded-lg p-6 md:p-8 backdrop-blur-sm border border-zinc-700/50">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white flex items-center">
                    <CreditCard className="h-6 w-6 md:h-8 md:w-8 mr-3 text-emerald-400 flex-shrink-0" />
                    <span>Spend Like a BOSS</span>
                  </h2>
                  <p className="text-gray-300 mb-4">
                    The CLAB DEFI Crypto Card bridges the gap between your digital assets and everyday expenses. Powered by Visa's global network, our card allows you to spend your cryptocurrency anywhere that accepts traditional payment cards.
                  </p>
                  <p className="text-gray-300">
                    No more converting to fiat before making purchases. Our revolutionary technology handles the conversion in real-time, giving you the freedom to use your crypto directly for daily transactions.
                  </p>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-6 md:p-8 backdrop-blur-sm border border-zinc-700/50">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white flex items-center">
                    <Wallet className="h-6 w-6 md:h-8 md:w-8 mr-3 text-emerald-400 flex-shrink-0" />
                    <span>Seamless Wallet Integration</span>
                  </h2>
                  <p className="text-gray-300 mb-4">Pair your card directly with popular DEFI wallets like Phantom and Metamask. Our secure connection ensures you always maintain control of your assets while enjoying the convenience of card payments.</p>
                  <p className="text-gray-300">The CLAB DEFI Crypto Card pairs with any Web3 certified wallet enabling you to access your crypto with secure global VISA payments.</p>
                </div>
              </div>

              {/* Right side content */}
              <div className="space-y-6 md:space-y-8">
                <div className="bg-zinc-800/50 rounded-lg p-6 md:p-8 backdrop-blur-sm border border-zinc-700/50">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white flex items-center">
                    <Banknote className="h-6 w-6 md:h-8 md:w-8 mr-3 text-emerald-400 flex-shrink-0" />
                    <span>No limits & Cash Back Rewards</span>
                  </h2>
                  <p className="text-gray-300 mb-4">Like we said, spend like a Boss ! Your CLAB Visa doesn't have any daily sending limit and every purchase you make with your CLAB DEFI Card earns you CLAB token rewards.

Accumulate tokens automatically and watch your holdings grow simply by using your card for everyday purchases.</p>
                  <p className="text-gray-300">
                </p>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-6 md:p-8 backdrop-blur-sm border border-zinc-700/50">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white flex items-center">
                    <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 mr-3 text-emerald-400 flex-shrink-0" />
                    <span>Purchase Insurance
                  </span>
                  </h2>
                  <p className="text-gray-300 mb-4">When you pay for your entire purchase with your CLAB Visa card, you get free insurance against theft or damage for the item for 180 days after purchase. </p>
                  <p className="text-gray-300">This Purchase Protection will cover repair costs or reimburse the value of the item, depending on the maximum insured amount.</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 md:mt-16 text-center">
              <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-700/30 rounded-xl p-6 md:p-12 backdrop-blur-sm border border-emerald-600/20">
                <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-white">Ready to Join the Waitlist?</h2>
                <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
                  The CLAB DEFI Crypto Card will be available soon. Join our waitlist to be among the first to experience the future of spending crypto.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white px-6 md:px-8 py-4 md:py-6 h-auto group text-base md:text-lg" onClick={() => setWaitlistModalOpen(true)}>
                  <span>Join the Waitlist</span>
                  <ChevronRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Waitlist Modal */}
      <WaitlistModal open={waitlistModalOpen} onOpenChange={setWaitlistModalOpen} />
    </Layout>;
};

export default DefiCard;
