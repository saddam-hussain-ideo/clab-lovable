
import { Info } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { useRef, useEffect, useState } from "react";

interface ProfileHeaderProps {
  points: number;
}

export const ProfileHeader = ({ points }: ProfileHeaderProps) => {
  // Use local state to prevent unnecessary rerenders
  const [displayPoints, setDisplayPoints] = useState(points);
  const previousPointsRef = useRef(points);
  
  // Only update display points when actual points increase
  useEffect(() => {
    // Only update displayed points if points increase or if it's the first time
    if (points > previousPointsRef.current || previousPointsRef.current === 0) {
      setDisplayPoints(points);
      previousPointsRef.current = points;
    }
  }, [points]);

  return (
    <CardHeader>
      <CardTitle>Edit Profile</CardTitle>
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg space-y-2">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">
              Quiz Points: {displayPoints || 0}
            </h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              You can swap your Quiz Points for CLAB Coins at the end of the pre-sale period.
            </p>
          </div>
        </div>
      </div>
    </CardHeader>
  );
};
