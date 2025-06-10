'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ClientHeader } from '@/components/clients/ClientHeader';
import { ClientTabsSection } from '@/components/clients/ClientTabsSection';
import { Client } from '@/types/client';
import { unifiedClientService } from '@/services/unified-client-service';

interface ClientDashboardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ClientDashboardPage({ params }: ClientDashboardPageProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setClientId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const loadClient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const clientData = await unifiedClientService.getClient(clientId);
      setClient(clientData);
    } catch (err) {
      console.error('Error loading client:', err);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId, loadClient]);

  const handleGenealogyClick = () => {
    console.log('Genealogy clicked for client:', clientId);
    // TODO: Implement genealogy functionality
  };

  const handleOutcomeMeasuresClick = () => {
    console.log('Outcome measures clicked for client:', clientId);
    // TODO: Implement outcome measures functionality
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {/* Loading skeleton for header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Loading skeleton for tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="border-b px-4">
            <div className="flex gap-8 py-3">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!client) {
    notFound();
  }

  return (
    <div className="p-4 space-y-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Client Timeline & History
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage client progress notes, assessments, and care timeline
          </p>
        </div>
      </div>

      {/* Client Header */}
      <ClientHeader
        client={client}
        onGenealogyClick={handleGenealogyClick}
        onOutcomeMeasuresClick={handleOutcomeMeasuresClick}
        canEditClient={true}
        hasRiskIndicators={client.riskLevel === 'high'}
      />

      {/* Client Tabs Section */}
      <ClientTabsSection
        clientId={clientId}
        canEditClient={true}
        activeEpisodeId={undefined}
      />
    </div>
  );
}