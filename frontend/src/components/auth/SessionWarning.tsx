/**
 * Session warning component for healthcare applications
 * Shows countdown and allows session extension
 */
'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SessionWarningProps {
  /** Whether the warning dialog is open */
  isOpen: boolean;
  /** Minutes remaining before session expires */
  minutesRemaining: number;
  /** Callback when user chooses to extend session */
  onExtendSession: () => void;
  /** Callback when user chooses to logout */
  onLogout: () => void;
  /** Callback when session expires (countdown reaches 0) */
  onExpired: () => void;
}

export function SessionWarning({
  isOpen,
  minutesRemaining,
  onExtendSession,
  onLogout,
  onExpired
}: SessionWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState(minutesRemaining * 60); // Convert to seconds
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    setTimeRemaining(minutesRemaining * 60);
  }, [minutesRemaining]);

  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeRemaining, onExpired]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await onExtendSession();
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = (seconds: number): string => {
    if (seconds <= 60) return 'text-red-600'; // Last minute - red
    if (seconds <= 180) return 'text-orange-600'; // Last 3 minutes - orange
    return 'text-yellow-600'; // Default warning - yellow
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your session will expire due to security requirements for healthcare data protection.
            </p>
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <Clock className={`h-8 w-8 mx-auto mb-2 ${getUrgencyColor(timeRemaining)}`} />
                <div className={`text-2xl font-mono font-bold ${getUrgencyColor(timeRemaining)}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {timeRemaining <= 60 ? 'seconds remaining' : 'remaining'}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Click "Continue Session" to refresh your authentication and continue working,
              or "Logout" to securely end your session.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            Logout Securely
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleExtendSession}
            disabled={isExtending || timeRemaining <= 0}
            className="w-full sm:w-auto"
          >
            {isExtending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Continue Session'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SessionWarning;