'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { externalOrganisationsApi } from '@/services/apiService';
import type { components } from '@/types/openapi';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ExternalOrganisation = components['schemas']['ExternalOrganisationSchemaOut'];
type OrganisationType = components['schemas']['ExtOrgDropdownItemOut'];

function useExternalOrganisations(accessToken: string | null) {
  const [organisations, setOrganisations] = useState<ExternalOrganisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganisations = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await externalOrganisationsApi.listExternalOrganisations(accessToken!);
      setOrganisations(data);
    } catch (err) {
      console.error('Failed to fetch external organisations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch organisations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisations();
  }, [accessToken]);

  return { organisations, loading, error, refetch: fetchOrganisations };
}

function useOrganisationTypes(accessToken: string | null) {
  const [organisationTypes, setOrganisationTypes] = useState<OrganisationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    async function fetchOrganisationTypes() {
      try {
        setLoading(true);
        setError(null);
        const data = await externalOrganisationsApi.getBatchDropdowns(accessToken!);
        setOrganisationTypes(data.external_organisation_types);
      } catch (err) {
        console.error('Failed to fetch organisation types:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch organisation types'));
      } finally {
        setLoading(false);
      }
    }

    fetchOrganisationTypes();
  }, [accessToken]);

  return { organisationTypes, loading, error };
}

function AddOrganisationDialog({ 
  open, 
  onOpenChange, 
  organisationTypes, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  organisationTypes: OrganisationType[];
  onSuccess: () => void;
}) {
  const accessToken = useAccessToken();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    phone: '',
    email: '',
    address: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Organisation name is required');
      return;
    }
    if (!formData.type) {
      setError('Organisation type is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      type_id: parseInt(formData.type),
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim() || null,
      address: formData.address?.trim() || null,
      is_active: formData.is_active
    };

    console.log('Submitting payload:', payload); // Debug log

    try {
      await externalOrganisationsApi.createExternalOrganisation(payload, accessToken);

      // Reset form
      setFormData({
        name: '',
        type: '',
        phone: '',
        email: '',
        address: '',
        is_active: true
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to create organisation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Organisation</DialogTitle>
          <DialogDescription>
            Create a new external organisation to manage partnerships and collaborations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Organisation Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="Enter organisation name"
              />
            </div>

            <div>
              <Label htmlFor="type">Organisation Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleInputChange('type', value)}
                required
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue placeholder="Select organisation type" />
                </SelectTrigger>
                <SelectContent className="min-w-[300px]">
                  {organisationTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)} className="cursor-pointer">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@organisation.com"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Active organisation</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Organisation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrganisationCard({ organisation }: { organisation: ExternalOrganisation }) {
  const getOrganisationTypeColor = (type: OrganisationType) => {
    const typeSlug = type.slug.toLowerCase();
    if (typeSlug.includes('service-provider')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (typeSlug.includes('funder')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (typeSlug.includes('government')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (typeSlug.includes('peak-body')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {organisation.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`text-xs ${getOrganisationTypeColor(organisation.type)}`}>
                  {organisation.type.label}
                </Badge>
                <Badge variant={organisation.is_active ? "default" : "secondary"} className="text-xs">
                  {organisation.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/external-organisations/${organisation.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/external-organisations/${organisation.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Contact Information */}
          <div className="space-y-2">
            {organisation.email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{organisation.email}</span>
              </div>
            )}
            {organisation.phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{organisation.phone}</span>
              </div>
            )}
            {organisation.address && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{organisation.address}</span>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{organisation.contacts.length} contacts</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Updated {new Date(organisation.updated_at).toLocaleDateString()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2 pt-2">
            {organisation.email && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => window.open(`mailto:${organisation.email}`)}
              >
                <Mail className="mr-1 h-3 w-3" />
                Email
              </Button>
            )}
            {organisation.phone && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => window.open(`tel:${organisation.phone}`)}
              >
                <Phone className="mr-1 h-3 w-3" />
                Call
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SearchAndFilters({ 
  searchTerm, 
  onSearchChange, 
  selectedType, 
  onTypeChange, 
  selectedStatus, 
  onStatusChange, 
  organisationTypes, 
  onAddClick, 
  onClearFilters 
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  organisationTypes: OrganisationType[];
  onAddClick: () => void;
  onClearFilters: () => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search organisations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {(selectedType || selectedStatus) && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {(selectedType ? 1 : 0) + (selectedStatus ? 1 : 0)}
              </Badge>
            )}
          </Button>
          <Button onClick={onAddClick} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Organisation</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2">
                  Organisation Type
                </Label>
                <Select value={selectedType} onValueChange={onTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {organisationTypes.map((type) => (
                      <SelectItem key={type.id} value={type.slug}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2">
                  Status
                </Label>
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={onClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ExternalOrganisationsPage() {
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const accessToken = useAccessToken();
  const { organisations, loading, error, refetch } = useExternalOrganisations(accessToken);
  const { organisationTypes } = useOrganisationTypes(accessToken);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filter organisations based on search and filters
  const filteredOrganisations = useMemo(() => {
    return organisations.filter(org => {
      const matchesSearch = !searchTerm || 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.phone?.includes(searchTerm);
      
      const matchesType = !selectedType || org.type.slug === selectedType;
      
      const matchesStatus = !selectedStatus || 
        (selectedStatus === 'true' && org.is_active) ||
        (selectedStatus === 'false' && !org.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [organisations, searchTerm, selectedType, selectedStatus]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
  };

  const handleAddSuccess = () => {
    refetch();
  };

  // Show loading while session or data is loading
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organisations...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!session || (!accessToken && !isAuthBypass)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorBoundary>
          <p className="text-red-500">Please sign in to access external organisations</p>
        </ErrorBoundary>
      </div>
    );
  }

  // Handle loading error
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <ErrorDisplay 
            title="Error Loading External Organisations"
            message={error.message}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            External Organisations
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your partner organisations, funders, and service providers.
          </p>
        </div>

        {/* Search and Filters */}
        <SearchAndFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          organisationTypes={organisationTypes}
          onAddClick={() => setShowAddDialog(true)}
          onClearFilters={handleClearFilters}
        />

        {/* Add Organisation Dialog */}
        <AddOrganisationDialog 
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          organisationTypes={organisationTypes}
          onSuccess={handleAddSuccess}
        />

        {/* Organisation Cards Grid */}
        <div className="mt-8">
          {filteredOrganisations.length === 0 ? (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {organisations.length === 0 ? 'No organisations found' : 'No organisations match your filters'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {organisations.length === 0 
                  ? 'Get started by adding your first external organisation.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              <div className="mt-6">
                {organisations.length === 0 ? (
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="inline-flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Organisation</span>
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={handleClearFilters}
                    className="inline-flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganisations.map((organisation) => (
                <OrganisationCard 
                  key={organisation.id} 
                  organisation={organisation} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {organisations.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {organisations.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Organisations
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {organisations.filter(org => org.is_active).length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {organisations.reduce((total, org) => total + org.contacts.length, 0)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Contacts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(organisations.map(org => org.type.slug)).size}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organisation Types
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}