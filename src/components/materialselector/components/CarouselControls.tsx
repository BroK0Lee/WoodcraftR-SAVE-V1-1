import React from "react";
import { Play, Pause } from "lucide-react";

export type CarouselControlsProps = {
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
};

export const CarouselControls: React.FC<CarouselControlsProps> = ({
  isAutoPlay,
  onToggleAutoPlay,
}) => (
  <div className="flex items-center justify-center space-x-8 mt-8">
    <button
      onClick={onToggleAutoPlay}
      className={`p-3 rounded-full backdrop-blur-sm border transition-all duration-300 hover:scale-110 hover:shadow-lg ${
        isAutoPlay
          ? "bg-green-500/20 border-green-400/50 text-green-300"
          : "bg-red-500/20 border-red-400/50 text-red-300"
      }`}
    >
      {isAutoPlay ? (
        <Pause className="w-6 h-6" />
      ) : (
        <Play className="w-6 h-6" />
      )}
    </button>
  </div>
);

export default CarouselControls;
