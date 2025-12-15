import { cn } from "@/lib/utils";
import flowerImage from "@/assets/flower-logo.png";

interface FlowerLogoProps {
  className?: string;
  animate?: boolean;
  size?: number;
}

export const FlowerLogo = ({ className, animate = true, size = 200 }: FlowerLogoProps) => {
  return (
    <div 
      className={cn(
        "relative",
        animate && "animate-spin-slow",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img 
        src={flowerImage} 
        alt="TBC Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
