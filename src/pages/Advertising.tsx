
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function Advertising() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 py-24">
          <h1 className="text-4xl font-bold text-center mb-12 text-white">
            Advertise with CLAB
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="space-y-6 text-gray-300">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Reach the Best Crypto Audience
              </h2>
              
              <p>
                Connect with a highly engaged community of cryptocurrency enthusiasts,
                traders, and DeFi experts through CLAB's premium advertising solutions.
              </p>
              
              <ul className="space-y-4 list-disc list-inside">
                <li>Access to a targeted audience of crypto investors and traders</li>
                <li>Premium placement across our educational platform</li>
                <li>Visibility in our quiz platform and learning resources</li>
                <li>Integration with our community features</li>
                <li>Custom campaign tracking and analytics</li>
              </ul>
              
              <p>
                Our platform delivers unparalleled reach within the cryptocurrency
                space, connecting your brand with serious investors and traders who
                are actively engaged in the market.
              </p>
            </div>
            
            <div className="bg-zinc-900/50 p-8 rounded-lg border border-white/10 space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Get Started
              </h2>
              
              <p className="text-gray-300">
                Ready to reach the best audience in crypto? Contact us on X to
                discuss advertising plans tailored to your needs.
              </p>
              
              <div className="mt-8">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={() => window.open("https://x.com/clabcoin", "_blank")}
                >
                  Contact Us on X
                  <ExternalLink className="ml-2" />
                </Button>
              </div>
              
              <div className="mt-6 text-sm text-gray-400">
                <p>
                  Our team will respond within 24 hours to discuss your advertising
                  goals and create a custom plan that meets your needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
