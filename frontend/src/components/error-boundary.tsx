'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  showDetails?: boolean;
  level?: 'page' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // In production, you could send this to an error reporting service
    // reportError(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error || undefined} reset={this.reset} />;
      }

      // Different fallbacks based on level
      if (this.props.level === 'page') {
        return <PageErrorFallback error={this.state.error} reset={this.reset} showDetails={this.props.showDetails} />;
      } else {
        return <ComponentErrorFallback error={this.state.error} reset={this.reset} showDetails={this.props.showDetails} />;
      }
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  reset: () => void;
  showDetails?: boolean;
}

function PageErrorFallback({ error, reset, showDetails = false }: ErrorFallbackProps) {
  const goHome = () => {
    window.location.href = '/dashboard';
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-gray-900 dark:text-white">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-center">
            We're sorry, but an unexpected error occurred. Please try refreshing the page or return to the dashboard.
          </p>

          {showDetails && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Error:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reloadPage} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            
            <Button variant="outline" onClick={goHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button variant="ghost" onClick={reset} className="w-full">
              Try Again
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            If this problem persists, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComponentErrorFallback({ error, reset, showDetails = false }: ErrorFallbackProps) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Component Error</h3>
      </div>
      
      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
        This section couldn't load properly. {showDetails && error && `Error: ${error.message}`}
      </p>
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={reset}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
        <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}
