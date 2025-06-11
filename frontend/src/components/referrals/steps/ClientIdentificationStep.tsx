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
import { ArrowRight, ArrowLeft, Search, Users, UserPlus, AlertCircle, CheckCircle, X, Globe, Phone, Mail, Heart, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewClientService } from '@/services/new-client-service';
import { apiRequest } from '@/services/api-request';
import type { components } from '@/types/openapi';

interface ClientIdentificationStepProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious: () => void;
  onDataChange?: (data: any) => void;
}

type ClientListSchema = components['schemas']['ClientListSchema'];

interface EmergencyContact {
  relationship_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  priority_order: number;
}

export function ClientIdentificationStep({ data, onComplete, onPrevious, onDataChange }: ClientIdentificationStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClientListSchema[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientListSchema | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
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
      const results = await NewClientService.searchClients(searchTerm);
      setSearchResults(results || []);
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

  const handleSelectClient = (client: ClientListSchema) => {
    setSelectedClient(client);
    setValue('client_type', 'existing');
    setValue('client_id', client.id);
    setValue('first_name', client.first_name);
    setValue('last_name', client.last_name);
    setShowClientForm(false);
    setIsCreatingNew(false);
  };

  const handleCreateNewClient = () => {
    setSelectedClient(null);
    setValue('client_type', 'new');
    setValue('client_id', '');
    setShowClientForm(true);
    setIsCreatingNew(true);
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

  const onSubmit = (formData: any) => {
    const completeData = {
      ...formData,
      emergency_contacts: emergencyContacts,
      cultural_identity: {
        iwi_hapu_id: formData.iwi_hapu_id,
        spiritual_needs_id: formData.spiritual_needs_id,
        primary_language_id: formData.primary_language_id,
        interpreter_needed: formData.interpreter_needed
      }
    };
    onComplete(completeData);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card className="border-0 shadow-lg bg-white rounded-3xl">
        <CardHeader className="pb-8">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-gray-900">Client Information & Cultural Identity</span>
          </CardTitle>
          <CardDescription className="text-gray-600 text-base leading-relaxed">
            Find an existing client or create a new client record with cultural and emergency contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-8 pb-8">
          
          {/* Client Search */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-900">Find Client</Label>
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

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Searching...</p>
              </div>
            )}

            {searchPerformed && !isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectClient(client)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {client.first_name} {client.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {client.email && `${client.email} • `}
                          {client.phone && `${client.phone} • `}
                          Born: {client.date_of_birth}
                        </p>
                      </div>
                      {selectedClient?.id === client.id && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Client or New Client Form */}
          {(selectedClient || showClientForm) && (
            <Card className="bg-gray-50 border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedClient ? 'Selected Client' : 'New Client Details'}
                  </CardTitle>
                  {selectedClient && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCreateNewClient}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Change Selection
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="cultural">Cultural Identity</TabsTrigger>
                    <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">First Name *</Label>
                        <Input
                          {...register('first_name', { required: 'First name is required' })}
                          disabled={!!selectedClient}
                          className="h-12 text-base"
                        />
                        {errors.first_name && (
                          <p className="text-sm text-red-500">{errors.first_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Last Name *</Label>
                        <Input
                          {...register('last_name', { required: 'Last name is required' })}
                          disabled={!!selectedClient}
                          className="h-12 text-base"
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
                          disabled={!!selectedClient}
                          className="h-12 text-base"
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
                          disabled={!!selectedClient}
                        >
                          <SelectTrigger className="h-12">
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
                          disabled={!!selectedClient}
                          className="h-12 text-base"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Phone</Label>
                        <Input
                          {...register('phone')}
                          disabled={!!selectedClient}
                          className="h-12 text-base"
                          placeholder="+64 21 123 4567"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="cultural" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center space-x-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>Iwi/Hapū Affiliation</span>
                        </Label>
                        <Select 
                          value={watch('iwi_hapu_id')?.toString() || ''} 
                          onValueChange={(value) => setValue('iwi_hapu_id', value ? parseInt(value) : undefined)}
                        >
                          <SelectTrigger className="h-12">
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
                        >
                          <SelectTrigger className="h-12">
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
                        >
                          <SelectTrigger className="h-12">
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

                  <TabsContent value="emergency" className="space-y-6 mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900">Emergency Contacts</h4>
                      <Button type="button" onClick={addEmergencyContact} variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {emergencyContacts.map((contact, index) => (
                        <div key={index} className="p-6 bg-white rounded-xl border border-gray-200">
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
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Relationship</Label>
                              <Select 
                                value={contact.relationship_id.toString()} 
                                onValueChange={(value) => updateEmergencyContact(index, 'relationship_id', parseInt(value))}
                              >
                                <SelectTrigger>
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
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">First Name *</Label>
                              <Input
                                value={contact.first_name}
                                onChange={(e) => updateEmergencyContact(index, 'first_name', e.target.value)}
                                placeholder="First name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Last Name *</Label>
                              <Input
                                value={contact.last_name}
                                onChange={(e) => updateEmergencyContact(index, 'last_name', e.target.value)}
                                placeholder="Last name"
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
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {emergencyContacts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Phone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPrevious}
          className="flex items-center space-x-2 h-12 px-6 text-base border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Source</span>
        </Button>
        <Button 
          type="submit" 
          disabled={!selectedClient && !showClientForm}
          className="flex items-center space-x-2 h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 hover:shadow-lg rounded-xl transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue to Consent & Documents</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}