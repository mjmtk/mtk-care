'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
// import { tokenManager } from '@/services/token-manager'; // Removed - using auth bypass system

export function TokenStatus() {
  const { data: session } = useAuthBypassSession();
  const accessToken = useAccessToken();
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    needsRefresh: boolean;
    isExpired: boolean;
    timeUntilExpiry?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkTokenStatus = async () => {
    try {
      const currentToken = accessToken;
      
      setTokenInfo({
        hasToken: !!currentToken,
        needsRefresh: false, // Simplified - using session-based auth
        isExpired: !currentToken && !!session,
        timeUntilExpiry: currentToken ? getTimeUntilExpiry() : undefined
      });
    } catch (error) {
      console.error('Error checking token status:', error);
    }
  };

  const getTimeUntilExpiry = (): string => {
    // This is a simplified version - in real implementation you'd parse the JWT
    return "~30 minutes"; // Placeholder
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      console.log('Manual token refresh requested');
      // For now, just trigger a page refresh to get new tokens
      window.location.reload();
    } catch (error) {
      console.error('Token refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkTokenStatus();
    // Check token status every 30 seconds
    const interval = setInterval(checkTokenStatus, 30000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return null;
  }

  const getStatusBadge = () => {
    if (!tokenInfo) return null;

    if (tokenInfo.isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Token Expired
        </Badge>
      );
    }

    if (tokenInfo.needsRefresh) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3" />
          Refresh Soon
        </Badge>
      );
    }

    if (tokenInfo.hasToken) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          Token Valid
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        No Token
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Authentication Status
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokenInfo && (
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Has Token:</span>
              <span className={tokenInfo.hasToken ? 'text-green-600' : 'text-red-600'}>
                {tokenInfo.hasToken ? 'Yes' : 'No'}
              </span>
            </div>
            
            {tokenInfo.hasToken && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires In:</span>
                <span className="text-gray-900">
                  {tokenInfo.timeUntilExpiry || 'Unknown'}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Needs Refresh:</span>
              <span className={tokenInfo.needsRefresh ? 'text-yellow-600' : 'text-green-600'}>
                {tokenInfo.needsRefresh ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshToken}
          disabled={isRefreshing}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
        </Button>
        
        <div className="text-xs text-gray-500">
          If you're experiencing "Unauthorized" errors, try refreshing your token or logging out and back in.
        </div>
      </CardContent>
    </Card>
  );
}