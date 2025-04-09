
import { useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";

export const AudioPlayer = ({ title, artist }: { title: string; artist: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="glass-card rounded-lg p-4 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-gray-500">{artist}</p>
        </div>
        <Volume2 className="w-5 h-5 text-gray-500" />
      </div>

      <div className="space-y-4">
        <Slider
          value={[progress]}
          max={100}
          step={1}
          className="w-full"
          onValueChange={(value) => setProgress(value[0])}
        />

        <div className="flex items-center justify-center space-x-4">
          <Button variant="ghost" size="icon">
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button
            onClick={togglePlay}
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            className="w-24"
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>
    </div>
  );
};
