'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientSearchDialog } from '@/components/clients/ClientSearchDialog';
import { ClientCreateForm } from '@/components/clients/ClientCreateForm';
import type { components } from '@/types/openapi';

type ClientListSchema = components['schemas']['ClientListSchema'];
type ClientDetailSchema = components['schemas']['ClientDetailSchema'];

export default function NewClientPage() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<{
    searchTerm: string;
    isReferral: boolean;
  } | null>(null);

  const handleClientSelect = (client: ClientListSchema) => {
    // Navigate to the selected client's page
    router.push(`/clients/${client.id}`);
  };

  const handleCreateNew = (searchTerm: string, isReferral: boolean = false) => {
    setCreateFormData({ searchTerm, isReferral });
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (client: ClientDetailSchema) => {
    setShowCreateForm(false);
    setCreateFormData(null);
    // Navigate to the new client's page
    router.push(`/clients/${client.id}`);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
    setCreateFormData(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add New Client
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Search for existing clients first, or create a new client record
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Search First Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Step 1: Search for Existing Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Before creating a new client, search to make sure they don't already exist in the system.
            </p>
            
            <ClientSearchDialog
              trigger={
                <Button size="lg" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search for Client
                </Button>
              }
              onClientSelect={handleClientSelect}
              onCreateNew={handleCreateNew}
            />
          </CardContent>
        </Card>

        {/* Or Create New Card */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or create new client directly
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Step 2: Create New Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              If you're certain the client doesn't exist, you can create a new record directly.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="default"
                size="lg"
                onClick={() => handleCreateNew('', false)}
                className="h-20 flex flex-col gap-2"
              >
                <Plus className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Walk-in Client</div>
                  <div className="text-xs opacity-90">Client came directly to our service</div>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCreateNew('', true)}
                className="h-20 flex flex-col gap-2"
              >
                <Plus className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Referred Client</div>
                  <div className="text-xs opacity-90">Client referred from external organization</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Why search first?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Prevents duplicate client records</li>
                <li>• Maintains data integrity and continuity of care</li>
                <li>• Ensures you have the complete client history</li>
                <li>• Saves time by not re-entering existing information</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form Dialog */}
      {showCreateForm && createFormData && (
        <ClientCreateForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          initialSearchTerm={createFormData.searchTerm}
          isReferral={createFormData.isReferral}
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      )}
    </div>
  );
}