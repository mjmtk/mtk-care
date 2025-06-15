'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, Search, Users, UserPlus, AlertCircle, CheckCircle, X, Globe, Phone, Mail, Heart, Star, Edit2, Save, XCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewClientService } from '@/services/new-client-service';
import { EmergencyContactsService, type EmergencyContact } from '@/services/emergency-contacts-service';
import { apiRequest } from '@/services/api-request';
import type { components } from '@/types/openapi';

interface ClientIdentificationStepProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious: () => void;
  onDataChange?: (data: any) => void;
}

type ClientListSchema = components['schemas']['ClientListSchema'];

// Use the EmergencyContact interface from the service

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export function ClientIdentificationStep({ data, onComplete, onPrevious, onDataChange }: ClientIdentificationStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClientListSchema[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientListSchema | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalClientData, setOriginalClientData] = useState<any>(null);
  
  // Dropdown data
  const [genderOptions, setGenderOptions] = useState<any[]>([]);
  const [iwiHapuOptions, setIwiHapuOptions] = useState<any[]>([]);
  const [spiritualNeedsOptions, setSpiritualNeedsOptions] = useState<any[]>([]);
  const [languageOptions, setLanguageOptions] = useState<any[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<any[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  
  // Emergency contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    data.emergency_contacts || []
  );

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
      // Basic client fields
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      date_of_birth: data.date_of_birth || '',
      email: data.email || '',
      phone: data.phone || '',
      gender_id: data.gender_id || undefined,
      // Cultural identity
      iwi_hapu_id: data.iwi_hapu_id || undefined,
      spiritual_needs_id: data.spiritual_needs_id || undefined,
      primary_language_id: data.primary_language_id || undefined,
      interpreter_needed: data.interpreter_needed || false
    }
  });

  // Initialize component state based on existing data
  useEffect(() => {
    // If we have existing client data, set the appropriate state
    if (data.client_id && data.client_type === 'existing') {
      // For existing clients, create a selectedClient object
      setSelectedClient({
        id: data.client_id,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        date_of_birth: data.date_of_birth || ''
      });
      setShowClientForm(false);
      setIsCreatingNew(false);
    } else if (data.client_type === 'new' && data.first_name && data.last_name) {
      // For new clients with data, show the client form
      setShowClientForm(true);
      setIsCreatingNew(true);
      setSelectedClient(null);
    }
  }, [data]);

  // Sync form values when data prop changes (for referral edit page)
  useEffect(() => {
    console.log('=== Form sync useEffect triggered ===');
    console.log('Incoming data prop:', data);
    console.log('Selected client exists:', !!selectedClient);
    
    // Don't override client data when we have a selected client
    if (selectedClient) {
      console.log('Skipping form sync - client already selected');
      return;
    }
    
    // Update form values when new data comes in (e.g. when editing existing referral)
    if (data.iwi_hapu_id !== undefined) {
      console.log('Setting iwi_hapu_id from data:', data.iwi_hapu_id);
      setValue('iwi_hapu_id', data.iwi_hapu_id);
    }
    if (data.spiritual_needs_id !== undefined) {
      console.log('Setting spiritual_needs_id from data:', data.spiritual_needs_id);
      setValue('spiritual_needs_id', data.spiritual_needs_id);
    }
    if (data.primary_language_id !== undefined) {
      console.log('Setting primary_language_id from data:', data.primary_language_id);
      setValue('primary_language_id', data.primary_language_id);
    }
    if (data.gender_id !== undefined) {
      console.log('Setting gender_id from data:', data.gender_id);
      setValue('gender_id', data.gender_id);
    }
    if (data.interpreter_needed !== undefined) {
      setValue('interpreter_needed', data.interpreter_needed);
    }
    
    // Sync emergency contacts
    if (data.emergency_contacts) {
      setEmergencyContacts(data.emergency_contacts);
    }
  }, [data.iwi_hapu_id, data.spiritual_needs_id, data.primary_language_id, data.gender_id, data.interpreter_needed, data.emergency_contacts, setValue, selectedClient]);

  // Load dropdown options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        
        // Load all required option lists
        const [genderData, iwiHapuData, spiritualData, languageData, relationshipData] = await Promise.all([
          apiRequest({ url: 'v1/optionlists/gender-identity/', method: 'GET' }),
          apiRequest({ url: 'v1/optionlists/iwi-hapu/', method: 'GET' }),
          apiRequest({ url: 'v1/optionlists/spiritual-needs/', method: 'GET' }),
          apiRequest({ url: 'v1/reference/languages/', method: 'GET' }),
          apiRequest({ url: 'v1/optionlists/emergency-contact-relationships/', method: 'GET' })
        ]);

        setGenderOptions(genderData || []);
        setIwiHapuOptions(iwiHapuData || []);
        setSpiritualNeedsOptions(spiritualData || []);
        setLanguageOptions(languageData || []);
        setRelationshipOptions(relationshipData || []);
        
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  // Search for existing clients
  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const searchParams = { search: searchTerm.trim() };
      const response = await NewClientService.searchClients(searchParams);
      setSearchResults(response?.items || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setSearchPerformed(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectClient = async (client: ClientListSchema) => {
    setSelectedClient(client);
    setValue('client_type', 'existing');
    setValue('client_id', client.id);
    setValue('first_name', client.first_name);
    setValue('last_name', client.last_name);
    setValue('email', client.email || '');
    setValue('phone', client.phone || '');
    setValue('date_of_birth', client.date_of_birth || '');
    setShowClientForm(false);
    setIsCreatingNew(false);
    
    // Load full client details including cultural identity
    try {
      console.log('=== Loading full client details ===');
      const fullClient = await NewClientService.getClient(client.id);
      console.log('Full client response:', fullClient);
      console.log('Available keys:', Object.keys(fullClient || {}));
      console.log('Cultural field IDs:', {
        gender_id: fullClient?.gender_id,
        iwi_hapu_id: fullClient?.iwi_hapu_id,
        spiritual_needs_id: fullClient?.spiritual_needs_id,
        primary_language_id: fullClient?.primary_language_id
      });
      
      if (fullClient) {
        // Update form with full client details
        setValue('gender_id', fullClient.gender_id || undefined);
        setValue('iwi_hapu_id', fullClient.iwi_hapu_id || undefined);
        setValue('spiritual_needs_id', fullClient.spiritual_needs_id || undefined);
        setValue('primary_language_id', fullClient.primary_language_id || undefined);
        setValue('interpreter_needed', fullClient.interpreter_needed || false);
        
        console.log('Form values set:', {
          gender_id: fullClient.gender_id,
          iwi_hapu_id: fullClient.iwi_hapu_id,
          spiritual_needs_id: fullClient.spiritual_needs_id,
          primary_language_id: fullClient.primary_language_id
        });
        
        // Update state for data change
        onDataChange?.({
          gender_id: fullClient.gender_id,
          iwi_hapu_id: fullClient.iwi_hapu_id,
          spiritual_needs_id: fullClient.spiritual_needs_id,
          primary_language_id: fullClient.primary_language_id,
          interpreter_needed: fullClient.interpreter_needed
        });
      }
    } catch (error) {
      console.error('Failed to load full client details:', error);
    }
    
    // Load emergency contacts for the selected client
    try {
      const contacts = await EmergencyContactsService.getClientEmergencyContacts(client.id);
      // Transform contacts to ensure we have relationship_id
      const transformedContacts = contacts.map(contact => ({
        ...contact,
        relationship_id: contact.relationship?.id || 0
      }));
      setEmergencyContacts(transformedContacts);
      onDataChange?.({ emergency_contacts: transformedContacts });
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      // Don't fail the selection, just log the error
    }
  };

  const handleCreateNewClient = () => {
    setSelectedClient(null);
    setValue('client_type', 'new');
    setValue('client_id', '');
    setShowClientForm(true);
    setIsCreatingNew(true);
    
    // Parse search term to pre-populate name fields
    if (searchTerm.trim()) {
      const parts = searchTerm.trim().split(' ');
      if (parts.length >= 2) {
        // If multiple words, use first as first name and rest as last name
        setValue('first_name', parts[0]);
        setValue('last_name', parts.slice(1).join(' '));
      } else if (parts.length === 1) {
        // If single word, put it in first name
        setValue('first_name', parts[0]);
      }
    }
  };

  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      relationship_id: 0,
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      is_primary: emergencyContacts.length === 0, // First contact is primary by default
      priority_order: emergencyContacts.length + 1
    };
    const updatedContacts = [...emergencyContacts, newContact];
    setEmergencyContacts(updatedContacts);
    onDataChange?.({ emergency_contacts: updatedContacts });
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: any) => {
    const updatedContacts = [...emergencyContacts];
    (updatedContacts[index] as any)[field] = value;
    setEmergencyContacts(updatedContacts);
    onDataChange?.({ emergency_contacts: updatedContacts });
  };

  const removeEmergencyContact = (index: number) => {
    const updatedContacts = emergencyContacts.filter((_, i) => i !== index);
    // Reassign priority orders
    updatedContacts.forEach((contact, i) => {
      contact.priority_order = i + 1;
    });
    setEmergencyContacts(updatedContacts);
    onDataChange?.({ emergency_contacts: updatedContacts });
  };

  const setPrimaryContact = (index: number) => {
    const updatedContacts = emergencyContacts.map((contact, i) => ({
      ...contact,
      is_primary: i === index
    }));
    setEmergencyContacts(updatedContacts);
    onDataChange?.({ emergency_contacts: updatedContacts });
  };

  const onSubmit = async (formData: any) => {
    console.log('=== ClientIdentificationStep onSubmit called ===');
    console.log('Form data received:', formData);
    console.log('Selected client:', selectedClient);
    
    try {
      // If we have a client (existing or newly created), save all updates
      const clientId = formData.client_id || selectedClient?.id;
      console.log('Client ID to use:', clientId);
      
      if (clientId) {
        console.log('Client ID exists, proceeding to save data...');
        
        // Don't update existing client info when just continuing
        // Updates are handled by the explicit Save Changes button
        if (!selectedClient) {
          // Only save emergency contacts and cultural identity for new clients
          if (emergencyContacts.length > 0) {
            console.log('Saving emergency contacts for new client:', clientId);
            await EmergencyContactsService.replaceAllEmergencyContacts(clientId, emergencyContacts);
          }
          
          // Save cultural identity for new client
          const culturalData = {
            cultural_identity: formData.cultural_identity || {},
            primary_language_id: formData.primary_language_id || null,
            interpreter_needed: formData.interpreter_needed || false,
            iwi_hapu_id: formData.iwi_hapu_id || null,
            spiritual_needs_id: formData.spiritual_needs_id || null
          };
          
          console.log('Cultural data to save:', culturalData);
          
          console.log('Saving cultural identity for new client:', clientId);
          try {
            const result = await EmergencyContactsService.updateClientCulturalIdentity(clientId, culturalData);
            console.log('Cultural identity saved successfully');
          } catch (error) {
            console.error('Failed to save cultural identity:', error);
          }
        }
      } else {
        console.log('No client ID found, skipping updates');
      }
      
      console.log('Client data processing complete, calling onComplete...');
      
      // Complete the step with referral-specific data only
      const completeData = {
        ...formData,
        // Don't include emergency_contacts or cultural data in referral data
        // as they're now saved directly to the client
      };
      
      console.log('Calling onComplete with data:', completeData);
      onComplete(completeData);
    } catch (error) {
      console.error('Error saving client data:', error);
      // Still complete the step but show a warning
      alert('Warning: There was an issue saving emergency contacts or cultural identity. Please check the client record.');
      console.log('Completing step with original form data due to error');
      onComplete(formData);
    }
  };

  if (isLoadingOptions) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
        {/* Content Area - Max 80% height with scroll */}
        <div className="flex-1 max-h-[80vh] overflow-y-auto">
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-3xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-white">Client Information & Cultural Identity</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
                Find an existing client or create a new client record
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
          
          {/* Client Search - Hide when creating new client */}
          {!isCreatingNew && !selectedClient && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900 dark:text-white">Find Client</Label>
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-0"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleCreateNewClient}
                  className="h-12 px-6 text-base bg-green-600 hover:bg-green-700 rounded-xl"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Client
                </Button>
              </div>
            </div>
          )}

          {/* Search Results - Only show when not creating new client and no client selected */}
          {!isCreatingNew && !selectedClient && (
            <>
              {isSearching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Searching...</p>
                </div>
              )}

              {searchPerformed && !isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No clients found matching "{searchTerm}"</p>
                  <p className="text-sm">Click "New Client" to create a new client record</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((client) => (
                    <div
                      key={client.id}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ease-out hover:shadow-md ${
                        selectedClient?.id === client.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-background hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectClient(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {client.first_name} {client.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {client.email && `${client.email} • `}
                            {client.phone && `${client.phone} • `}
                            Born: {client.date_of_birth}
                          </p>
                        </div>
                        {selectedClient?.id === client.id && (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Selected Client or New Client Form */}
          {(selectedClient || showClientForm) && (
            <Card className="bg-background border border-border">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {selectedClient ? (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-foreground text-lg">{watch('first_name')} {watch('last_name')}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground ml-7">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {watch('date_of_birth') ? (
                                <>
                                  {new Date(watch('date_of_birth')).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {calculateAge(watch('date_of_birth')) && (
                                    <span className="text-muted-foreground/70"> (Age {calculateAge(watch('date_of_birth'))})</span>
                                  )}
                                </>
                              ) : (
                                'DOB not set'
                              )}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{watch('gender_id') ? genderOptions.find(g => g.id === watch('gender_id'))?.label || 'Gender not set' : 'Gender not set'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        <span>Creating New Client</span>
                      </div>
                    )}
                  </CardTitle>
                  <div className="flex items-start space-x-2 mt-1">
                    {selectedClient && (
                      <>
                        {!isEditMode && (
                          <Button
                            type="button"
                            onClick={() => {
                              setIsEditMode(true);
                              // Store original data for cancel functionality
                              setOriginalClientData({
                                first_name: watch('first_name'),
                                last_name: watch('last_name'),
                                date_of_birth: watch('date_of_birth'),
                                email: watch('email'),
                                phone: watch('phone'),
                                gender_id: watch('gender_id'),
                                iwi_hapu_id: watch('iwi_hapu_id'),
                                spiritual_needs_id: watch('spiritual_needs_id'),
                                primary_language_id: watch('primary_language_id'),
                                interpreter_needed: watch('interpreter_needed'),
                                emergency_contacts: [...emergencyContacts]
                              });
                            }}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit Details
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(null);
                            setIsCreatingNew(false);
                            setShowClientForm(false);
                            setValue('client_type', 'new');
                            setValue('client_id', '');
                            setIsEditMode(false);
                          }}
                          className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Search Again
                        </Button>
                      </>
                    )}
                    {!selectedClient && showClientForm && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsCreatingNew(false);
                          setShowClientForm(false);
                          setSearchTerm('');
                          setSearchResults([]);
                          setSearchPerformed(false);
                          setIsEditMode(false);
                        }}
                        className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Search Existing
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedClient && isEditMode && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <Edit2 className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800">Editing client information</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={async () => {
                          // Save changes
                          try {
                            const updateData = {
                              first_name: watch('first_name'),
                              last_name: watch('last_name'),
                              date_of_birth: watch('date_of_birth'),
                              email: watch('email') || '',
                              phone: watch('phone') || '',
                              gender_id: watch('gender_id') || null
                            };
                            
                            await NewClientService.updateClient(selectedClient.id, updateData);
                            
                            // Update cultural identity
                            const culturalData = {
                              primary_language_id: watch('primary_language_id') || null,
                              interpreter_needed: watch('interpreter_needed') || false,
                              iwi_hapu_id: watch('iwi_hapu_id') || null,
                              spiritual_needs_id: watch('spiritual_needs_id') || null
                            };
                            
                            await EmergencyContactsService.updateClientCulturalIdentity(selectedClient.id, culturalData);
                            
                            // Update emergency contacts
                            if (emergencyContacts.length > 0) {
                              await EmergencyContactsService.replaceAllEmergencyContacts(selectedClient.id, emergencyContacts);
                            }
                            
                            setIsEditMode(false);
                            alert('Client details updated successfully');
                          } catch (error) {
                            console.error('Failed to update client:', error);
                            alert('Failed to update client details');
                          }
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          // Cancel and restore original data
                          if (originalClientData) {
                            setValue('first_name', originalClientData.first_name);
                            setValue('last_name', originalClientData.last_name);
                            setValue('date_of_birth', originalClientData.date_of_birth);
                            setValue('email', originalClientData.email);
                            setValue('phone', originalClientData.phone);
                            setValue('gender_id', originalClientData.gender_id);
                            setValue('iwi_hapu_id', originalClientData.iwi_hapu_id);
                            setValue('spiritual_needs_id', originalClientData.spiritual_needs_id);
                            setValue('primary_language_id', originalClientData.primary_language_id);
                            setValue('interpreter_needed', originalClientData.interpreter_needed);
                            setEmergencyContacts(originalClientData.emergency_contacts || []);
                          }
                          setIsEditMode(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-400 text-gray-600 hover:bg-gray-100"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-background border border-border">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:bg-muted data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-muted/80">Basic Info</TabsTrigger>
                    <TabsTrigger value="cultural" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:bg-muted data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-muted/80">Cultural Identity</TabsTrigger>
                    <TabsTrigger value="emergency" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:bg-muted data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-muted/80">Emergency Contacts</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">First Name *</Label>
                        <Input
                          {...register('first_name', { required: 'First name is required' })}
                          disabled={selectedClient && !isEditMode}
                          className={`h-10 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                        />
                        {errors.first_name && (
                          <p className="text-sm text-red-500">{errors.first_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Last Name *</Label>
                        <Input
                          {...register('last_name', { required: 'Last name is required' })}
                          disabled={selectedClient && !isEditMode}
                          className={`h-10 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                        />
                        {errors.last_name && (
                          <p className="text-sm text-red-500">{errors.last_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Date of Birth *</Label>
                        <Input
                          type="date"
                          {...register('date_of_birth', { required: 'Date of birth is required' })}
                          disabled={selectedClient && !isEditMode}
                          className={`h-10 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                        />
                        {errors.date_of_birth && (
                          <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Gender Identity</Label>
                        <Select 
                          value={watch('gender_id')?.toString() || ''} 
                          onValueChange={(value) => setValue('gender_id', value ? parseInt(value) : undefined)}
                          disabled={selectedClient && !isEditMode}
                        >
                          <SelectTrigger className={`h-10 ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}>
                            <SelectValue placeholder="Select gender identity..." />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Email</Label>
                        <Input
                          type="email"
                          {...register('email')}
                          disabled={selectedClient && !isEditMode}
                          className={`h-10 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Phone</Label>
                        <Input
                          {...register('phone')}
                          disabled={selectedClient && !isEditMode}
                          className={`h-10 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                          placeholder="+64 21 123 4567"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="cultural" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center space-x-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>Iwi/Hapū Affiliation</span>
                        </Label>
                        <Select 
                          value={watch('iwi_hapu_id')?.toString() || ''} 
                          onValueChange={(value) => setValue('iwi_hapu_id', value ? parseInt(value) : undefined)}
                          disabled={selectedClient && !isEditMode}
                        >
                          <SelectTrigger className={`h-10 ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}>
                            <SelectValue placeholder="Select iwi/hapū..." />
                          </SelectTrigger>
                          <SelectContent>
                            {iwiHapuOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>Spiritual Needs</span>
                        </Label>
                        <Select 
                          value={watch('spiritual_needs_id')?.toString() || ''} 
                          onValueChange={(value) => setValue('spiritual_needs_id', value ? parseInt(value) : undefined)}
                          disabled={selectedClient && !isEditMode}
                        >
                          <SelectTrigger className={`h-10 ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}>
                            <SelectValue placeholder="Select spiritual practices..." />
                          </SelectTrigger>
                          <SelectContent>
                            {spiritualNeedsOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <span>Primary Language</span>
                        </Label>
                        <Select 
                          value={watch('primary_language_id')?.toString() || ''} 
                          onValueChange={(value) => setValue('primary_language_id', value ? parseInt(value) : undefined)}
                          disabled={selectedClient && !isEditMode}
                        >
                          <SelectTrigger className={`h-10 ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}>
                            <SelectValue placeholder="Select primary language..." />
                          </SelectTrigger>
                          <SelectContent>
                            {languageOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id.toString()}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="interpreter_needed"
                            checked={watch('interpreter_needed')}
                            onCheckedChange={(checked) => setValue('interpreter_needed', !!checked)}
                            disabled={selectedClient && !isEditMode}
                          />
                          <Label htmlFor="interpreter_needed" className="text-base font-semibold">
                            Interpreter Required
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600">
                          Check if interpreter services are needed for communication
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="emergency" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-foreground">Emergency Contacts</h4>
                      <Button 
                        type="button" 
                        onClick={addEmergencyContact} 
                        variant="outline"
                        disabled={selectedClient && !isEditMode}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {emergencyContacts.map((contact, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${selectedClient && !isEditMode ? 'bg-muted/50 border-border' : 'bg-background border-border'}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Badge variant={contact.is_primary ? "default" : "secondary"}>
                                {contact.is_primary ? 'Primary' : `Priority ${contact.priority_order}`}
                              </Badge>
                              {!contact.is_primary && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPrimaryContact(index)}
                                  className="text-xs"
                                  disabled={selectedClient && !isEditMode}
                                >
                                  Make Primary
                                </Button>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEmergencyContact(index)}
                              className="text-gray-400 hover:text-red-600"
                              disabled={selectedClient && !isEditMode}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Relationship</Label>
                              <Select 
                                value={contact.relationship_id?.toString() || ''} 
                                onValueChange={(value) => updateEmergencyContact(index, 'relationship_id', parseInt(value))}
                                disabled={selectedClient && !isEditMode}
                              >
                                <SelectTrigger className={`h-9 ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}>
                                  <SelectValue placeholder="Select relationship..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {relationshipOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>Phone *</span>
                              </Label>
                              <Input
                                value={contact.phone}
                                onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                                placeholder="+64 21 123 4567"
                                disabled={selectedClient && !isEditMode}
                                className={`h-9 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">First Name *</Label>
                              <Input
                                value={contact.first_name}
                                onChange={(e) => updateEmergencyContact(index, 'first_name', e.target.value)}
                                placeholder="First name"
                                disabled={selectedClient && !isEditMode}
                                className={`h-9 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Last Name *</Label>
                              <Input
                                value={contact.last_name}
                                onChange={(e) => updateEmergencyContact(index, 'last_name', e.target.value)}
                                placeholder="Last name"
                                disabled={selectedClient && !isEditMode}
                                className={`h-9 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                              />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                              <Label className="text-sm font-medium flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>Email (Optional)</span>
                              </Label>
                              <Input
                                type="email"
                                value={contact.email || ''}
                                onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                                placeholder="email@example.com"
                                disabled={selectedClient && !isEditMode}
                                className={`h-9 text-sm ${selectedClient && !isEditMode ? 'bg-muted' : 'bg-background'}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {emergencyContacts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Phone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p>No emergency contacts added yet</p>
                          <p className="text-sm">Click "Add Contact" to add emergency contact information</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Always visible at bottom */}
        <div className="flex-shrink-0 pt-4 pb-4 bg-background border-t border-border">
          <div className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onPrevious}
              className="flex items-center space-x-2 h-11 px-5 text-sm border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Referral Source</span>
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedClient && !showClientForm}
              className="flex items-center space-x-2 h-11 px-6 text-sm bg-blue-600 hover:bg-blue-700 hover:shadow-lg rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{selectedClient ? 'Update & Continue' : 'Create & Continue'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}