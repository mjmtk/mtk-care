'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Globe, Heart, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ClientSearchDialog } from '@/components/clients/ClientSearchDialog';
import { NewClientService } from '@/services/new-client-service';
import type { components } from '@/types/openapi';

type ClientListSchema = components['schemas']['ClientListSchema'];


export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListSchema[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial clients
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await NewClientService.searchClients({
        search,
        limit: 50
      });
      setClients(response.items || []);
    } catch (err: any) {
      setError('Failed to load clients');
      console.error('Error loading clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadClients(searchTerm);
  };

  const handleClientSelect = (client: ClientListSchema) => {
    router.push(`/clients/${client.id}`);
  };

  const handleCreateNew = (searchTerm: string, isReferral?: boolean) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (isReferral) params.append('referral', 'true');
    router.push(`/clients/new${params.toString() ? '?' + params.toString() : ''}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clients
          </h1>
        </div>
        <div className="flex gap-2">
          <ClientSearchDialog
            trigger={
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Find or Add Client
              </Button>
            }
            onClientSelect={handleClientSelect}
            onCreateNew={handleCreateNew}
          />
          <Button asChild variant="outline">
            <Link href="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clients by name, email, phone, or other details..."
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
            {searchTerm && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  loadClients();
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-500 mt-2">Loading clients...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-800">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => loadClients()} 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      {!isLoading && !error && (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {client.first_name} {client.last_name}
                          {client.preferred_name && ` (${client.preferred_name})`}
                        </h3>
                        <Badge variant={getRiskBadgeVariant(client.risk_level)}>
                          {client.risk_level} risk
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div>DOB: {formatDate(client.date_of_birth)}</div>
                        {client.email && <div>Email: {client.email}</div>}
                        {client.phone && <div>Phone: {client.phone}</div>}
                        {client.status && <div>Status: {client.status.label || client.status.name}</div>}
                        
                        {/* Cultural Identity Indicators */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {client.primary_language && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Globe className="h-3 w-3" />
                              {client.primary_language.name || client.primary_language}
                            </Badge>
                          )}
                          {client.interpreter_needed && (
                            <Badge variant="secondary" className="text-xs">
                              Interpreter Required
                            </Badge>
                          )}
                          {(client.iwi_hapu || client.cultural_identity?.iwi_hapu) && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Heart className="h-3 w-3 text-red-500" />
                              {client.iwi_hapu?.label || client.cultural_identity?.iwi_hapu || 'Iwi/Hapū'}
                            </Badge>
                          )}
                          {client.consent_required && (
                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                              <Shield className="h-3 w-3" />
                              Consent Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Summary
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/clients/${client.id}`}>
                        Open Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State (if no clients) */}
      {!isLoading && !error && clients.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No clients match "${searchTerm}". Try a different search or create a new client.`
                : 'Get started by adding your first client to the system.'
              }
            </p>
            <div className="flex gap-2 justify-center">
              {searchTerm && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    loadClients();
                  }}
                >
                  Clear Search
                </Button>
              )}
              <Button asChild>
                <Link href="/clients/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {searchTerm ? 'Create New Client' : 'Add First Client'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}