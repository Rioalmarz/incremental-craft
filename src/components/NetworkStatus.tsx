// Network Status Component
import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useMockData } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (useMockData) {
      setIsOnline(true);
      return;
    }

    const checkConnection = async () => {
      setChecking(true);
      try {
        await api.get('/health');
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      } finally {
        setChecking(false);
      }
    };

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Also check on window focus
    const handleFocus = () => checkConnection();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (useMockData) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
        "bg-warning/20 text-warning border border-warning/30",
        className
      )}>
        <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
        <span>وضع التطوير</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
      isOnline
        ? "bg-primary/20 text-primary border border-primary/30"
        : "bg-destructive/20 text-destructive border border-destructive/30",
      checking && "opacity-70",
      className
    )}>
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>متصل بالخادم</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>غير متصل</span>
        </>
      )}
    </div>
  );
}
