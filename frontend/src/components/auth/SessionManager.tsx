'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SessionManagerProps {
  warningThresholdMinutes?: number;
}

export function SessionManager({ warningThresholdMinutes = 5 }: SessionManagerProps) {
  const { data: session, status } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.expires) {
      return;
    }

    const checkSessionExpiry = () => {
      const expiryTime = new Date(session.expires!).getTime();
      const now = Date.now();
      const remaining = expiryTime - now;
      const remainingMinutes = Math.floor(remaining / (1000 * 60));

      setTimeRemaining(remainingMinutes);

      if (remaining <= 0) {
        // Session has expired
        setShowWarning(false);
        router.refresh(); // This will trigger the AuthGuard to show the expired session UI
      } else if (remainingMinutes <= warningThresholdMinutes && remainingMinutes > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkSessionExpiry();

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000);

    return () => clearInterval(interval);
  }, [session, status, warningThresholdMinutes, router]);

  const handleExtendSession = () => {
    // Trigger a session refresh by making a request to the session endpoint
    fetch('/api/auth/session', { method: 'GET' })
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        // If refresh fails, redirect to sign in
        router.push('/api/auth/signin');
      });
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning || status !== 'authenticated') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium mb-1">Session Expiring Soon</p>
              <p className="text-sm">
                Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}. 
                {' '}Would you like to extend it?
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:text-yellow-200 dark:hover:text-yellow-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleExtendSession}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Extend Session
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}