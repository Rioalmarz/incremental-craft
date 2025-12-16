import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  max?: number;
  label: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
  showPercentage?: boolean;
  animate?: boolean;
}

const GaugeChart = ({
  value,
  max = 100,
  label,
  size = "md",
  color = "primary",
  showPercentage = true,
  animate = true,
}: GaugeChartProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  const percentage = Math.min((value / max) * 100, 100);
  
  useEffect(() => {
    if (!animate) {
      setAnimatedValue(percentage);
      return;
    }
    
    const duration = 1500;
    const startTime = Date.now();
    
    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(percentage * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };
    
    requestAnimationFrame(animateValue);
  }, [percentage, animate]);
  
  const sizes = {
    sm: { container: "w-24 h-24", text: "text-lg", label: "text-xs" },
    md: { container: "w-32 h-32", text: "text-2xl", label: "text-sm" },
    lg: { container: "w-40 h-40", text: "text-3xl", label: "text-base" },
  };
  
  const colors = {
    primary: {
      stroke: "stroke-primary",
      text: "text-primary",
      glow: "drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]",
    },
    success: {
      stroke: "stroke-success",
      text: "text-success",
      glow: "drop-shadow-[0_0_10px_hsl(var(--success)/0.5)]",
    },
    warning: {
      stroke: "stroke-warning",
      text: "text-warning",
      glow: "drop-shadow-[0_0_10px_hsl(var(--warning)/0.5)]",
    },
    danger: {
      stroke: "stroke-destructive",
      text: "text-destructive",
      glow: "drop-shadow-[0_0_10px_hsl(var(--destructive)/0.5)]",
    },
  };
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference * 0.75; // 270 degrees
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizes[size].container)}>
        <svg
          className="transform -rotate-[135deg]"
          viewBox="0 0 100 100"
        >
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/20"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          {/* Value arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(colors[color].stroke, colors[color].glow)}
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: animate ? "none" : "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", sizes[size].text, colors[color].text)}>
            {Math.round(animatedValue)}{showPercentage && "%"}
          </span>
        </div>
      </div>
      <span className={cn("text-muted-foreground font-medium text-center", sizes[size].label)}>
        {label}
      </span>
    </div>
  );
};

export default GaugeChart;
