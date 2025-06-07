'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { externalOrganisationsApi, externalOrganisationContactsApi } from '@/services/apiService';
import type { components } from '@/types/openapi';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Users,
  Plus,
  ArrowLeft,
  Edit,
  User,
  Briefcase,
  MoreVertical,
  Trash2,
  MessageSquare,
  FileText,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ExternalOrganisation = components['schemas']['ExternalOrganisationSchemaOut'];
type Contact = components['schemas']['apps__external_organisation_management__schemas__ExternalOrganisationContactSchemaOut__2'];

function useOrganisationDetails(orgId: string, accessToken: string | null) {
  const [organisation, setOrganisation] = useState<ExternalOrganisation | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrganisation = async () => {
    if (!accessToken || !orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [orgData, contactsData] = await Promise.all([
        externalOrganisationsApi.getExternalOrganisationById(orgId, accessToken),
        externalOrganisationContactsApi.listContacts(accessToken, { organisation_id: orgId })
      ]);
      setOrganisation(orgData);
      setContacts(contactsData);
    } catch (err) {
      console.error('Failed to fetch organisation details:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch organisation'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisation();
  }, [orgId, accessToken]);

  return { organisation, contacts, loading, error, refetch: fetchOrganisation };
}

function OrganisationHeader({ organisation }: { organisation: ExternalOrganisation }) {
  const router = useRouter();
  
  const getOrganisationTypeColor = (type: components['schemas']['OptionListItemSchemaOut']) => {
    const typeSlug = type.slug.toLowerCase();
    if (typeSlug.includes('service-provider')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (typeSlug.includes('funder')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (typeSlug.includes('government')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (typeSlug.includes('peak-body')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/external-organisations')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Organisations</span>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Building className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {organisation.name}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={`${getOrganisationTypeColor(organisation.type)}`}>
                  {organisation.type.label}
                </Badge>
                <Badge variant={organisation.is_active ? "default" : "secondary"}>
                  {organisation.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-3 space-y-1">
                {organisation.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span>{organisation.email}</span>
                  </div>
                )}
                {organisation.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{organisation.phone}</span>
                  </div>
                )}
                {organisation.address && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{organisation.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button 
            onClick={() => router.push(`/dashboard/external-organisations/${organisation.id}/edit`)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Organisation</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ contact, orgId, onDelete }: { 
  contact: Contact; 
  orgId: string;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const accessToken = useAccessToken();

  const handleDelete = async () => {
    if (!accessToken) return;
    
    try {
      await externalOrganisationContactsApi.deleteContact(contact.id, accessToken);
      onDelete();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {contact.first_name} {contact.last_name}
                </h3>
                {contact.job_title && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Briefcase className="h-3 w-3 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contact.job_title}
                    </p>
                  </div>
                )}
                
                <div className="mt-3 space-y-2">
                  {contact.emails && contact.emails.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{contact.emails[0].email}</span>
                    </div>
                  )}
                  {contact.phones && contact.phones.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{contact.phones[0].number}</span>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <div className="mt-3 flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {contact.notes}
                    </p>
                  </div>
                )}
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
                <DropdownMenuItem 
                  onClick={() => router.push(`/dashboard/external-organisations/${orgId}/contacts/${contact.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contact
                </DropdownMenuItem>
                {contact.emails && contact.emails.length > 0 && (
                  <DropdownMenuItem 
                    onClick={() => window.open(`mailto:${contact.emails[0].email}`)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                )}
                {contact.phones && contact.phones.length > 0 && (
                  <DropdownMenuItem 
                    onClick={() => window.open(`tel:${contact.phones[0].number}`)}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {contact.is_active && (
            <div className="mt-4 flex space-x-2">
              {contact.emails && contact.emails.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(`mailto:${contact.emails[0].email}`)}
                >
                  <Mail className="mr-1 h-3 w-3" />
                  Email
                </Button>
              )}
              {contact.phones && contact.phones.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(`tel:${contact.phones[0].number}`)}
                >
                  <Phone className="mr-1 h-3 w-3" />
                  Call
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.first_name} {contact.last_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ContactsTab({ contacts, orgId, onRefresh }: { 
  contacts: Contact[]; 
  orgId: string;
  onRefresh: () => void;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contacts ({contacts.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage contacts for this organisation
          </p>
        </div>
        <Button 
          onClick={() => router.push(`/dashboard/external-organisations/${orgId}/contacts/new`)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Contact</span>
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No contacts yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add contacts to keep track of your key relationships.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => router.push(`/dashboard/external-organisations/${orgId}/contacts/new`)}
              className="inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Contact</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <ContactCard 
              key={contact.id} 
              contact={contact} 
              orgId={orgId}
              onDelete={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganisationDetailPage() {
  const params = useParams();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const orgId = params.id as string;
  const defaultTab = searchParams?.get('tab') || 'overview';
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const accessToken = useAccessToken();
  const { organisation, contacts, loading, error, refetch } = useOrganisationDetails(orgId, accessToken);

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
          <p className="text-red-500">Please sign in to view organisation details</p>
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
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary>
        <OrganisationHeader organisation={organisation} />

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organisation Information</CardTitle>
                <CardDescription>
                  Basic details about this organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Organisation Type
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {organisation.type.label}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge variant={organisation.is_active ? "default" : "secondary"}>
                        {organisation.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {organisation.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {organisation.email}
                      </p>
                    </div>
                  )}
                  {organisation.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Phone
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {organisation.phone}
                      </p>
                    </div>
                  )}
                  {organisation.address && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Address
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                        {organisation.address}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-500 dark:text-gray-400">
                        Total Contacts
                      </label>
                      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        {contacts.length}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500 dark:text-gray-400">
                        Created
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {new Date(organisation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-500 dark:text-gray-400">
                        Last Updated
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {new Date(organisation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsTab contacts={contacts} orgId={orgId} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                Document management coming soon
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                Activity history coming soon
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </div>
  );
}