'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Search, Users, UserPlus, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewClientService } from '@/services/new-client-service';
import type { components } from '@/types/openapi';

interface ClientIdentificationStepProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious: () => void;
  onDataChange?: (data: any) => void;
}

type ClientListSchema = components['schemas']['ClientListSchema'];

export function ClientIdentificationStep({ data, onComplete, onPrevious, onDataChange }: ClientIdentificationStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClientListSchema[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientListSchema | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      client_type: data.client_type || 'new',
      client_id: data.client_id || '',
      // New client fields
      first_name: '',
      last_name: '',
      date_of_birth: '',
      email: '',
      phone: ''
    }
  });

  const clientType = watch('client_type');

  // Search for existing clients
  const searchClients = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const response = await NewClientService.searchClients({
        search: term,
        limit: 10
      });
      setSearchResults(response.items || []);
    } catch (error) {
      console.error('Client search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchClients(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleClientSelect = (client: ClientListSchema) => {
    setSelectedClient(client);
    setValue('client_type', 'existing');
    setValue('client_id', client.id);
    setIsCreatingNew(false);
    setShowClientForm(true);
    
    // Pre-populate form with existing client data (read-only)
    setValue('first_name', client.first_name);
    setValue('last_name', client.last_name);
    setValue('date_of_birth', client.date_of_birth);
    setValue('email', client.email || '');
    setValue('phone', client.phone || '');
    
    // Trigger unsaved state
    if (onDataChange) {
      onDataChange({
        client_type: 'existing',
        client_id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        date_of_birth: client.date_of_birth,
        email: client.email || '',
        phone: client.phone || ''
      });
    }
  };

  const handleCreateNewClient = () => {
    setSelectedClient(null);
    setValue('client_type', 'new');
    setValue('client_id', '');
    setIsCreatingNew(true);
    setShowClientForm(true);
    
    // Clear form fields for new client
    setValue('first_name', '');
    setValue('last_name', '');
    setValue('date_of_birth', '');
    setValue('email', '');
    setValue('phone', '');
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    setIsCreatingNew(false);
    setShowClientForm(false);
    setValue('client_type', 'new');
    setValue('client_id', '');
    setValue('first_name', '');
    setValue('last_name', '');
    setValue('date_of_birth', '');
    setValue('email', '');
    setValue('phone', '');
  };

  const onSubmit = (formData: any) => {
    // Include selected client information if available
    const stepData = {
      client_type: formData.client_type,
      client_id: formData.client_id,
      // If creating new client, include the form data
      ...(isCreatingNew ? {
        new_client_data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          email: formData.email,
          phone: formData.phone
        }
      } : {})
    };
    
    onComplete(stepData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Who is this referral for?</span>
          </CardTitle>
          <CardDescription>
            Search for existing clients first to prevent duplicates, or create a new client record
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Single Search Box */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Find or create client</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Type client name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-600">
                Start typing to search existing clients, or add a new one
              </p>
            </div>

            {/* Search Loading */}
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              </div>
            )}

            {/* Search Results and Add New Button (shown after 2+ characters) */}
            {searchTerm.length >= 2 && !isSearching && (
              <div className="space-y-4">
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-600">
                      Found {searchResults.length} existing client{searchResults.length > 1 ? 's' : ''}
                    </Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                      {searchResults.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedClient?.id === client.id 
                              ? 'bg-green-50 border-green-200' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {client.first_name} {client.last_name}
                                {client.preferred_name && ` (${client.preferred_name})`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {client.email} • DOB: {new Date(client.date_of_birth).toLocaleDateString()}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={client.risk_level === 'high' ? 'destructive' : 
                                  client.risk_level === 'medium' ? 'default' : 'secondary'}>
                                  {client.risk_level} risk
                                </Badge>
                                {client.consent_required && (
                                  <Badge variant="outline">Consent Required</Badge>
                                )}
                                {(client as any).active_referral_count > 0 && (
                                  <Badge variant="destructive" className="animate-pulse">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {(client as any).active_referral_count} Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {selectedClient?.id === client.id && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Client Button */}
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateNewClient}
                    className="w-full justify-start"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add new client "{searchTerm}"
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Client Form (shown when client selected or creating new) */}
          {showClientForm && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">
                  {isCreatingNew ? 'New Client Information' : 'Client Details'}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...register('first_name', { 
                      required: showClientForm ? 'First name is required' : false 
                    })}
                    readOnly={!isCreatingNew}
                    className={`${errors.first_name ? 'border-red-500' : ''} ${
                      !isCreatingNew ? 'bg-gray-100' : ''
                    }`}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    {...register('last_name', { 
                      required: showClientForm ? 'Last name is required' : false 
                    })}
                    readOnly={!isCreatingNew}
                    className={`${errors.last_name ? 'border-red-500' : ''} ${
                      !isCreatingNew ? 'bg-gray-100' : ''
                    }`}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500">{errors.last_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register('date_of_birth', { 
                      required: showClientForm ? 'Date of birth is required' : false 
                    })}
                    readOnly={!isCreatingNew}
                    className={`${errors.date_of_birth ? 'border-red-500' : ''} ${
                      !isCreatingNew ? 'bg-gray-100' : ''
                    }`}
                  />
                  {errors.date_of_birth && (
                    <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    readOnly={!isCreatingNew}
                    placeholder={isCreatingNew ? "optional" : ""}
                    className={!isCreatingNew ? 'bg-gray-100' : ''}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    readOnly={!isCreatingNew}
                    placeholder={isCreatingNew ? "optional" : ""}
                    className={!isCreatingNew ? 'bg-gray-100' : ''}
                  />
                </div>
              </div>
              
              {selectedClient && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Using existing client record. Details are read-only and can be updated in the client management section.
                  </AlertDescription>
                </Alert>
              )}
              
              {isCreatingNew && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Creating new client record. Full client details can be completed during the intake process.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Source
        </Button>
        <Button 
          type="submit" 
          className="flex items-center space-x-2"
          disabled={!showClientForm}
        >
          <span>Continue to Details</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}