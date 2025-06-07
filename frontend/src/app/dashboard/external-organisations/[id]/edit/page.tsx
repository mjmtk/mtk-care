'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { externalOrganisationsApi } from '@/services/apiService';
import type { components } from '@/types/openapi';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Building,
  Save,
  X,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ExternalOrganisation = components['schemas']['ExternalOrganisationSchemaOut'];
type OrganisationType = components['schemas']['OptionListItemSchemaOut'];

function useEditOrganisation(orgId: string, accessToken: string | null) {
  const [organisation, setOrganisation] = useState<ExternalOrganisation | null>(null);
  const [organisationTypes, setOrganisationTypes] = useState<OrganisationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accessToken || !orgId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [orgData, typesData] = await Promise.all([
          externalOrganisationsApi.getExternalOrganisationById(orgId, accessToken!),
          externalOrganisationsApi.getBatchDropdowns(accessToken!)
        ]);
        setOrganisation(orgData);
        setOrganisationTypes(typesData.external_organisation_types);
      } catch (err) {
        console.error('Failed to fetch organisation data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch organisation'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [orgId, accessToken]);

  return { organisation, organisationTypes, loading, error };
}

export default function EditOrganisationPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const accessToken = useAccessToken();
  const { organisation, organisationTypes, loading, error } = useEditOrganisation(orgId, accessToken);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    phone: '',
    email: '',
    address: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when organisation is loaded
  useEffect(() => {
    if (organisation) {
      setFormData({
        name: organisation.name || '',
        type: String(organisation.type.id),
        phone: organisation.phone || '',
        email: organisation.email || '',
        address: organisation.address || '',
        is_active: organisation.is_active ?? true
      });
    }
  }, [organisation]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !organisation) return;

    // Validate required fields
    if (!formData.name.trim()) {
      setSubmitError('Organisation name is required');
      return;
    }
    if (!formData.type) {
      setSubmitError('Organisation type is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: formData.name.trim(),
      type_id: parseInt(formData.type),
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim() || null,
      address: formData.address?.trim() || null,
      is_active: formData.is_active
    };

    console.log('Updating organisation:', payload);

    try {
      await externalOrganisationsApi.updateExternalOrganisation(orgId, payload, accessToken);
      
      // Navigate back to organisation detail page on success
      router.push(`/dashboard/external-organisations/${orgId}`);
    } catch (err) {
      console.error('Failed to update organisation:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to update organisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !organisation) return;

    try {
      await externalOrganisationsApi.deleteExternalOrganisation(orgId, accessToken);
      router.push('/dashboard/external-organisations');
    } catch (error) {
      console.error('Failed to delete organisation:', error);
      setSubmitError('Failed to delete organisation');
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/external-organisations/${orgId}`);
  };

  const getOrganisationTypeColor = (type: OrganisationType) => {
    const typeSlug = type.slug.toLowerCase();
    if (typeSlug.includes('service-provider')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (typeSlug.includes('funder')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (typeSlug.includes('government')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (typeSlug.includes('peak-body')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // Show loading while session or data is loading
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organisation details...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!session || (!accessToken && !isAuthBypass)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorBoundary>
          <p className="text-red-500">Please sign in to edit organisations</p>
        </ErrorBoundary>
      </div>
    );
  }

  // Handle loading error
  if (error || !organisation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <ErrorDisplay 
            title="Error Loading Organisation"
            message={error?.message || 'Organisation not found'}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ErrorBoundary>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to {organisation.name}</span>
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Organisation
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Update details for {organisation.name}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={`${getOrganisationTypeColor(organisation.type)}`}>
                    {organisation.type.label}
                  </Badge>
                  <Badge variant={organisation.is_active ? "default" : "secondary"}>
                    {organisation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Organisation</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Organisation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {organisation.name}? This action cannot be undone 
                    and will permanently remove the organisation and all associated contacts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete Organisation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Organisation Information</CardTitle>
            <CardDescription>
              Update the details for this organisation. Required fields are marked with *.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Organisation Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Enter organisation name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Organisation Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleInputChange('type', value)}
                    required
                  >
                    <SelectTrigger className="w-full min-w-0 mt-1">
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
                    className="mt-1"
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
                    className="mt-1"
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
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="is_active" className="flex flex-col">
                      <span>Active Organisation</span>
                      <span className="text-xs text-gray-500 font-normal">
                        Active organisations appear in search results and partner lists
                      </span>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Current Statistics */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Current Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Label className="font-medium text-gray-700 dark:text-gray-300">
                      Total Contacts
                    </Label>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {organisation.contacts.length}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Label className="font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </Label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(organisation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Label className="font-medium text-gray-700 dark:text-gray-300">
                      Last Updated
                    </Label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(organisation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            What happens when you save?
          </h4>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Organisation details will be updated across the system</li>
            <li>• Existing contacts and relationships will be preserved</li>
            <li>• Changes will be reflected in search results and partner lists</li>
            <li>• Activity history will record this update for audit purposes</li>
          </ul>
        </div>
      </ErrorBoundary>
    </div>
  );
}