import { useEffect, useState } from 'react';
import { Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader = ({ children }: AppLoaderProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent/10 via-transparent to-transparent rounded-full animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/20 flex items-center justify-center mb-6 animate-bounce">
            <WifiOff className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-display font-bold mb-2">You're Offline</h1>
          <p className="text-muted-foreground mb-6">
            Please check your internet connection and try again.
          </p>
          
          <Button variant="gradient" size="lg" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppLoader;
