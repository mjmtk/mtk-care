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
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  User,
  Building,
  Save,
  X,
  Trash2
} from 'lucide-react';
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
type Contact = components['schemas']['apps__external_organisation_management__schemas__ExternalOrganisationContactSchemaOut__2'];

function useContactDetails(orgId: string, contactId: string, accessToken: string | null) {
  const [organisation, setOrganisation] = useState<ExternalOrganisation | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accessToken || !orgId || !contactId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [orgData, contactData] = await Promise.all([
          externalOrganisationsApi.getExternalOrganisationById(orgId, accessToken!),
          externalOrganisationContactsApi.getContactById(contactId, accessToken!)
        ]);
        setOrganisation(orgData);
        setContact(contactData);
      } catch (err) {
        console.error('Failed to fetch contact details:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch contact'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [orgId, contactId, accessToken]);

  return { organisation, contact, loading, error };
}

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const contactId = params.contactId as string;
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const accessToken = useAccessToken();
  const { organisation, contact, loading, error } = useContactDetails(orgId, contactId, accessToken);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    notes: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when contact is loaded
  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        job_title: contact.job_title || '',
        notes: contact.notes || '',
        is_active: contact.is_active ?? true
      });
    }
  }, [contact]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !organisation || !contact) return;

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

    console.log('Updating contact:', payload);

    try {
      await externalOrganisationContactsApi.updateContact(contactId, payload, accessToken);
      
      // Navigate back to organisation detail page on success
      router.push(`/dashboard/external-organisations/${orgId}?tab=contacts`);
    } catch (err) {
      console.error('Failed to update contact:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !contact) return;

    try {
      await externalOrganisationContactsApi.deleteContact(contactId, accessToken);
      router.push(`/dashboard/external-organisations/${orgId}?tab=contacts`);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      setSubmitError('Failed to delete contact');
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
          <p className="mt-2 text-gray-600">Loading contact details...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!session || (!accessToken && !isAuthBypass)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorBoundary>
          <p className="text-red-500">Please sign in to edit contacts</p>
        </ErrorBoundary>
      </div>
    );
  }

  // Handle loading error
  if (error || !organisation || !contact) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <ErrorDisplay 
            title="Error Loading Contact"
            message={error?.message || 'Contact not found'}
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
                <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Contact
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {organisation.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={contact.is_active ? "default" : "secondary"}>
                    {contact.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {contact.job_title && (
                    <Badge variant="outline">
                      {contact.job_title}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Contact</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {contact.first_name} {contact.last_name}? 
                    This action cannot be undone and will remove all associated contact information.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete Contact
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Update contact details for {contact.first_name} {contact.last_name}. Required fields are marked with *.
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

              {/* Current Contact Details (Read-only display) */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Current Contact Details
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  {contact.emails && contact.emails.length > 0 ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Addresses ({contact.emails.length})
                      </Label>
                      <div className="mt-1 space-y-1">
                        {contact.emails.map((email, index) => (
                          <div key={index} className="text-sm text-gray-900 dark:text-white flex items-center">
                            <span>{email.email}</span>
                            {email.is_primary && <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Addresses
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">No email addresses on file</p>
                    </div>
                  )}

                  {contact.phones && contact.phones.length > 0 ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Numbers ({contact.phones.length})
                      </Label>
                      <div className="mt-1 space-y-1">
                        {contact.phones.map((phone, index) => (
                          <div key={index} className="text-sm text-gray-900 dark:text-white flex items-center">
                            <span>{phone.number}</span>
                            {phone.is_primary && <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Numbers
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">No phone numbers on file</p>
                    </div>
                  )}

                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    📝 Additional email addresses and phone numbers can be managed separately
                  </p>
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
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            Managing Contact Details
          </h4>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Changes to basic information (name, title, notes) are saved immediately</li>
            <li>• Email addresses and phone numbers are managed separately for better organization</li>
            <li>• Deactivating a contact hides them from quick actions but preserves their data</li>
            <li>• Deleting a contact permanently removes all associated information</li>
          </ul>
        </div>
      </ErrorBoundary>
    </div>
  );
}