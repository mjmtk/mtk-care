// frontend/src/app/dashboard/error.tsx
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <h2 className="text-2xl font-semibold text-destructive mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-2">
        {error.message || 'An unexpected error occurred on the dashboard.'}
      </p>
      {error.digest && (
        <p className="text-sm text-muted-foreground mb-6">
          Error Digest: {error.digest}
        </p>
      )}
      <Button
        onClick={() => reset()} // Attempt to recover by re-rendering the segment
      >
        Try again
      </Button>
    </div>
  );
}
