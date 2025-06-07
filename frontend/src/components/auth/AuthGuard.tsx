'use client';

import { useSession } from 'next-auth/react';
import { useAuthBypass } from '@/components/providers/auth-bypass-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, LogIn, AlertTriangle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verifying your session...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SessionExpiredState() {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSignIn = () => {
    router.push('/api/auth/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
          </div>
          <CardTitle className="text-xl font-semibold">Session Expired</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your session has expired for security reasons. Please sign in again to continue.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button 
              onClick={handleSignIn} 
              className="w-full"
              size="lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In Again
            </Button>
            
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="w-full"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If you continue to experience issues, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UnauthenticatedState() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/api/auth/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <LogIn className="h-6 w-6 text-blue-600 dark:text-blue-500" />
          </div>
          <CardTitle className="text-xl font-semibold">Authentication Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Please sign in to access the MTK Care dashboard and your client management tools.
          </p>
          
          <Button 
            onClick={handleSignIn} 
            className="w-full"
            size="lg"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In to Continue
          </Button>
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              MTK Care - Healthcare Management System
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const { isAuthBypassMode } = useAuthBypass();

  // Handle loading state
  if (status === 'loading') {
    return fallback || <LoadingState />;
  }

  // In auth bypass mode, always allow access
  if (isAuthBypassMode) {
    return <>{children}</>;
  }

  // Handle unauthenticated state
  if (status === 'unauthenticated' || !session) {
    // Determine if this is a session expiry vs never authenticated
    const wasAuthenticated = typeof window !== 'undefined' && 
      (localStorage.getItem('next-auth.session-token') || 
       sessionStorage.getItem('next-auth.session-token') ||
       document.cookie.includes('next-auth.session-token'));

    if (wasAuthenticated) {
      return <SessionExpiredState />;
    } else {
      return <UnauthenticatedState />;
    }
  }

  // Authenticated - render children
  return <>{children}</>;
}