
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const JoinPresaleDriver = () => {
  const scrollToPresale = () => {
    // Find the presale section on the homepage
    const presaleSection = document.getElementById('presale-section');
    
    if (presaleSection) {
      presaleSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on homepage, navigate to homepage and scroll to presale
      window.location.href = '/#presale-section';
    }
  };

  return (
    <Card className="bg-black/40 backdrop-blur-lg border border-fuchsia-500/30 h-full">
      <CardHeader className="pb-2 pt-6">
        <CardTitle className="text-xl font-bold text-white text-center">
          Join the CLAB Presale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex flex-col items-center">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full p-4 w-20 h-20 flex items-center justify-center">
          <Rocket className="h-10 w-10 text-white" />
        </div>
        
        <div className="text-center space-y-3">
          <p className="text-white/90">
            Get CLAB tokens at the best price during our presale event.
          </p>
          <p className="text-white/70 text-sm">
            Limited allocation available. Don't miss this opportunity to be an early supporter.
          </p>
        </div>
        
        <Button 
          onClick={scrollToPresale}
          size="lg" 
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
        >
          <Rocket className="h-4 w-4 mr-2" />
          Join Presale Now
        </Button>
        
        <div className="text-xs text-white/60 text-center">
          <p>Secure your tokens before the public launch and benefit from the best possible price.</p>
        </div>
      </CardContent>
    </Card>
  );
};
