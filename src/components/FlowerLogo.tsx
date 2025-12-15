import { cn } from "@/lib/utils";

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
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full"
        style={{ transformOrigin: 'center center' }}
      >
        {/* Petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((rotation, index) => {
          const colors = [
            "#22d3ee", // cyan-400
            "#0891b2", // cyan-600
            "#06b6d4", // cyan-500
            "#67e8f9", // cyan-300
            "#0e7490", // cyan-700
            "#22d3ee", // cyan-400
            "#06b6d4", // cyan-500
            "#0891b2", // cyan-600
          ];
          return (
            <ellipse
              key={index}
              cx="100"
              cy="45"
              rx="25"
              ry="45"
              fill={colors[index]}
              opacity={0.85}
              transform={`rotate(${rotation} 100 100)`}
            />
          );
        })}
        {/* Center circle */}
        <circle cx="100" cy="100" r="25" fill="#0e7490" />
        <circle cx="100" cy="100" r="18" fill="#22d3ee" />
        <circle cx="100" cy="100" r="10" fill="#ffffff" opacity="0.6" />
      </svg>
    </div>
  );
};
