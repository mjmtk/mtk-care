// src/components/error-display.tsx
'use client';

import React from 'react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  showRefreshButton?: boolean;
}

export function ErrorDisplay({
  title = "Error",
  message,
  showRefreshButton = true,
}: ErrorDisplayProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
      <h2 className="text-lg font-medium text-red-800 dark:text-red-200">{title}</h2>
      <p className="mt-2 text-red-700 dark:text-red-300">{message}</p>
      {showRefreshButton && (
        <div className="mt-4">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>
  );
}
