'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { externalOrganisationsApi, externalOrganisationContactsApi } from '@/services/apiService';
import type { components } from '@/types/openapi';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  User,
  Building,
  Save,
  X
} from 'lucide-react';

type ExternalOrganisation = components['schemas']['ExternalOrganisationSchemaOut'];

function useOrganisation(orgId: string, accessToken: string | null) {
  const [organisation, setOrganisation] = useState<ExternalOrganisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accessToken || !orgId) {
      setLoading(false);
      return;
    }

    async function fetchOrganisation() {
      try {
        setLoading(true);
        setError(null);
        const data = await externalOrganisationsApi.getExternalOrganisationById(orgId, accessToken!);
        setOrganisation(data);
      } catch (err) {
        console.error('Failed to fetch organisation:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch organisation'));
      } finally {
        setLoading(false);
      }
    }

    fetchOrganisation();
  }, [orgId, accessToken]);

  return { organisation, loading, error };
}

export default function NewContactPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const accessToken = useAccessToken();
  const { organisation, loading, error } = useOrganisation(orgId, accessToken);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    email: '',
    phone: '',
    notes: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !organisation) return;

    // Validate required fields
    if (!formData.first_name.trim()) {
      setSubmitError('First name is required');
      return;
    }
    if (!formData.last_name.trim()) {
      setSubmitError('Last name is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      organisation_id: organisation.id,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      job_title: formData.job_title?.trim() || null,
      notes: formData.notes?.trim() || null,
      is_active: formData.is_active
    };

    console.log('Creating contact:', payload);

    try {
      await externalOrganisationContactsApi.createContact(payload, accessToken);
      
      // Navigate back to organisation detail page on success
      router.push(`/dashboard/external-organisations/${orgId}?tab=contacts`);
    } catch (err) {
      console.error('Failed to create contact:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/external-organisations/${orgId}?tab=contacts`);
  };

  // Show loading while session or data is loading
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!session || (!accessToken && !isAuthBypass)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorBoundary>
          <p className="text-red-500">Please sign in to add contacts</p>
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

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Contact
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {organisation.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Add a new contact for {organisation.name}. Required fields are marked with *.
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
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                    placeholder="Enter first name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                    placeholder="Enter last name"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="e.g., Program Manager, Director"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Contact Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@organisation.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Primary email address for this contact
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Primary phone number for this contact
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about this contact..."
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Any additional information about this contact's role, preferences, or context.
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="is_active" className="flex flex-col">
                  <span>Active Contact</span>
                  <span className="text-xs text-gray-500 font-normal">
                    Active contacts appear in search results and quick actions
                  </span>
                </Label>
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
                  <span>{isSubmitting ? 'Creating...' : 'Create Contact'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            What happens next?
          </h4>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• The contact will be added to {organisation.name}</li>
            <li>• You can add additional phone numbers and email addresses later</li>
            <li>• Quick actions (email/call) will be available if contact details are provided</li>
            <li>• The contact will appear in the organisation's contact list immediately</li>
          </ul>
        </div>
      </ErrorBoundary>
    </div>
  );
}