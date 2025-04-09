import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket } from "lucide-react";

export const QuizPresaleBanner = () => {
  return (
    <Card className="mt-16 bg-gradient-to-r from-zinc-900 to-zinc-950 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-primary/20 p-2 rounded-full mr-4">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Join Our Presale</h3>
              <p className="text-zinc-400">Early investors get exclusive access to premium features</p>
            </div>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              // Scroll to presale section with smooth animation
              const presaleSection = document.getElementById('presale');
              if (presaleSection) {
                presaleSection.scrollIntoView({ behavior: 'smooth' });
              } else {
                // Fallback to homepage if presale section not found
                window.location.href = "/";
              }
            }}
          >
            Join the Presale
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
