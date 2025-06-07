'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { ReferralService } from '@/services/referral-service';
import type { Referral } from '@/types/referral';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Building,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
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

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'PPP'); // Jan 1, 2025
  } catch {
    return 'Invalid date';
  }
};

// Helper function to get status badge variant
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('completed')) return 'default';
  if (lowerStatus.includes('in progress') || lowerStatus.includes('active')) return 'secondary';
  if (lowerStatus.includes('cancelled') || lowerStatus.includes('rejected')) return 'destructive';
  return 'outline';
};

// Helper function to get priority badge variant
const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
  const lowerPriority = priority.toLowerCase();
  if (lowerPriority.includes('high') || lowerPriority.includes('urgent')) return 'destructive';
  if (lowerPriority.includes('medium')) return 'secondary';
  return 'outline';
};

export default function ReferralDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session, status } = useAuthBypassSession();
  const accessToken = useAccessToken();

  const referralId = params.id as string;

  useEffect(() => {
    if (status === 'loading') return;
    if (!accessToken) return;

    const loadReferral = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await ReferralService.getReferral(referralId);
        setReferral(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load referral');
      } finally {
        setIsLoading(false);
      }
    };

    loadReferral();
  }, [referralId, status, accessToken]);

  const handleDelete = async () => {
    if (!referral) return;
    
    try {
      setIsDeleting(true);
      await ReferralService.deleteReferral(referral.id);
      router.push('/referrals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete referral');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/referrals/${referralId}/edit`);
  };

  const handleStatusUpdate = async (newStatusId: number) => {
    if (!referral) return;
    
    try {
      const updatedReferral = await ReferralService.updateReferralStatus(referral.id, { status_id: newStatusId });
      setReferral(updatedReferral);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <ErrorDisplay error={error} />
          <Button onClick={() => router.push('/referrals')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Referrals
          </Button>
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Referral not found</h2>
            <p className="text-muted-foreground mt-2">The referral you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => router.push('/referrals')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referrals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with navigation and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/referrals')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Referral Details</h1>
                <p className="text-muted-foreground">
                  Created {formatDate(referral.created_at)} by {referral.created_by.first_name} {referral.created_by.last_name}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleEdit} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Referral</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this referral? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Status and Priority Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <div className="mt-2">
                  <Badge variant={getStatusVariant(referral.status.label)}>
                    {referral.status.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Priority</span>
                </div>
                <div className="mt-2">
                  <Badge variant={getPriorityVariant(referral.priority.label)}>
                    {referral.priority.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Type</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm">{referral.type.label}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Client Type</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm capitalize">{referral.client_type}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Referral Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Reason for Referral</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {referral.reason}
                </p>
              </div>
              
              {referral.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {referral.notes}
                  </p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Service Information</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Service Type:</strong> {referral.service_type.label}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dates Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Referral Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(referral.referral_date)}</p>
                  </div>
                </div>
                
                {referral.accepted_date && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Accepted Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(referral.accepted_date)}</p>
                    </div>
                  </div>
                )}
                
                {referral.client_consent_date && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Client Consent Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(referral.client_consent_date)}</p>
                    </div>
                  </div>
                )}
                
                {referral.follow_up_date && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Follow-up Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(referral.follow_up_date)}</p>
                    </div>
                  </div>
                )}
                
                {referral.completed_date && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Completed Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(referral.completed_date)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* External Organisation Card */}
          {referral.external_organisation_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Referring Organisation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organisation ID: {referral.external_organisation_id}
                </p>
                {referral.external_organisation_contact_id && (
                  <p className="text-sm text-muted-foreground">
                    Contact ID: {referral.external_organisation_contact_id}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Audit Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {formatDate(referral.created_at)} by {referral.created_by.first_name} {referral.created_by.last_name}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {formatDate(referral.updated_at)} by {referral.updated_by.first_name} {referral.updated_by.last_name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}