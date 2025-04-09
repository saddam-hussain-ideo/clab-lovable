
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Clock, Send } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

interface PresaleCountdownProps {
  targetDate: string;
}

export const PresaleCountdown = ({ targetDate }: PresaleCountdownProps) => {
  const [days, setDays] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [launchDateText, setLaunchDateText] = useState<string>("");
  
  useEffect(() => {
    // Parse the target date
    const targetDateObj = parseISO(targetDate);
    
    if (!isValid(targetDateObj)) {
      console.error("Invalid target date format");
      return;
    }
    
    // Format the date for display
    try {
      setLaunchDateText(format(targetDateObj, 'MMMM d, yyyy'));
    } catch (error) {
      setLaunchDateText("Coming Soon");
    }
    
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        // Time is up!
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        return;
      }
      
      // Calculate time units
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setDays(days);
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    };
    
    // Initial calculation
    calculateTimeLeft();
    
    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate]);

  // Helper for consistent time box styling
  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-[#1b2439] w-16 h-16 rounded-lg flex items-center justify-center mb-2 border border-emerald-500/20">
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <div className="space-y-6">
        {/* Launch date display */}
        <div className="flex items-center justify-center space-x-2 bg-black/20 rounded-lg p-3 border border-white/10">
          <Calendar className="h-5 w-5 text-emerald-400" />
          <p className="text-white text-center">
            Launching on <span className="font-bold text-emerald-400">{launchDateText}</span>
          </p>
        </div>
        
        {/* Countdown timer */}
        <div className="flex justify-center space-x-3 md:space-x-4 py-2">
          <TimeBox value={days} label="DAYS" />
          <TimeBox value={hours} label="HOURS" />
          <TimeBox value={minutes} label="MINS" />
          <TimeBox value={seconds} label="SECS" />
        </div>
        
        {/* Telegram CTA */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center mb-2">
              <Bell className="h-4 w-4 text-emerald-400 mr-2" />
              <h4 className="text-white font-semibold">Get the latest updates in our community</h4>
            </div>
            
            <a 
              href="https://t.me/CLABcommunity" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                Join our Telegram Channel
              </Button>
            </a>
          </div>
        </div>
        
        {/* Social sharing or additional info */}
        <div className="text-center text-sm text-gray-400">
          <p>Follow us on social media for presale updates and bonuses</p>
        </div>
      </div>
    </Card>
  );
};
