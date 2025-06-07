'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { ReferralService } from '@/services/referral-service';
import type { Referral, ReferralUpdate, ReferralBatchDropdowns } from '@/types/referral';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import { format } from 'date-fns';

export default function EditReferralPage() {
  const params = useParams();
  const router = useRouter();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [dropdowns, setDropdowns] = useState<ReferralBatchDropdowns | null>(null);
  const [formData, setFormData] = useState<ReferralUpdate>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useAuthBypassSession();
  const accessToken = useAccessToken();

  const referralId = params.id as string;

  useEffect(() => {
    if (status === 'loading') return;
    if (!accessToken) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load referral and dropdown data in parallel
        const [referralData, dropdownData] = await Promise.all([
          ReferralService.getReferral(referralId),
          ReferralService.getBatchDropdowns()
        ]);
        
        setReferral(referralData);
        setDropdowns(dropdownData);
        
        // Initialize form with current data
        setFormData({
          type_id: referralData.type.id,
          status_id: referralData.status.id,
          priority_id: referralData.priority.id,
          service_type_id: referralData.service_type.id,
          reason: referralData.reason,
          client_type: referralData.client_type,
          referral_date: referralData.referral_date,
          accepted_date: referralData.accepted_date || undefined,
          completed_date: referralData.completed_date || undefined,
          follow_up_date: referralData.follow_up_date || undefined,
          client_consent_date: referralData.client_consent_date || undefined,
          notes: referralData.notes || undefined,
          external_organisation_id: referralData.external_organisation_id || undefined,
          external_organisation_contact_id: referralData.external_organisation_contact_id || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load referral data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [referralId, status, accessToken]);

  const handleInputChange = (field: keyof ReferralUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referral) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Remove undefined values
      const updateData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined && value !== '')
      ) as ReferralUpdate;
      
      await ReferralService.updateReferral(referral.id, updateData);
      router.push(`/referrals/${referral.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update referral');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/referrals/${referralId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !referral) {
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

  if (!referral || !dropdowns) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Referral not found</h2>
            <p className="text-muted-foreground mt-2">The referral you're trying to edit doesn't exist.</p>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Edit Referral</h1>
                <p className="text-muted-foreground">
                  Update referral information and timeline
                </p>
              </div>
            </div>
          </div>

          {error && (
            <ErrorDisplay error={error} />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core referral details and categorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Referral Type *</Label>
                    <Select
                      value={formData.type_id?.toString()}
                      onValueChange={(value) => handleInputChange('type_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select referral type" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdowns.referral_types.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status_id?.toString()}
                      onValueChange={(value) => handleInputChange('status_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdowns.referral_statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={formData.priority_id?.toString()}
                      onValueChange={(value) => handleInputChange('priority_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdowns.referral_priorities.map((priority) => (
                          <SelectItem key={priority.id} value={priority.id.toString()}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Select
                      value={formData.service_type_id?.toString()}
                      onValueChange={(value) => handleInputChange('service_type_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropdowns.referral_service_types.map((serviceType) => (
                          <SelectItem key={serviceType.id} value={serviceType.id.toString()}>
                            {serviceType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_type">Client Type *</Label>
                    <Select
                      value={formData.client_type}
                      onValueChange={(value) => handleInputChange('client_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Existing Client</SelectItem>
                        <SelectItem value="new">New Client</SelectItem>
                        <SelectItem value="self">Self-Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Referral *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason || ''}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Describe the reason for this referral, presenting concerns, and any relevant background information..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional notes, special considerations, or follow-up requirements..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline & Dates</CardTitle>
                <CardDescription>
                  Track important dates in the referral process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="referral_date">Referral Date *</Label>
                    <Input
                      id="referral_date"
                      type="date"
                      value={formData.referral_date || ''}
                      onChange={(e) => handleInputChange('referral_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accepted_date">Accepted Date</Label>
                    <Input
                      id="accepted_date"
                      type="date"
                      value={formData.accepted_date || ''}
                      onChange={(e) => handleInputChange('accepted_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_consent_date">Client Consent Date</Label>
                    <Input
                      id="client_consent_date"
                      type="date"
                      value={formData.client_consent_date || ''}
                      onChange={(e) => handleInputChange('client_consent_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="follow_up_date">Follow-up Date</Label>
                    <Input
                      id="follow_up_date"
                      type="date"
                      value={formData.follow_up_date || ''}
                      onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="completed_date">Completed Date</Label>
                    <Input
                      id="completed_date"
                      type="date"
                      value={formData.completed_date || ''}
                      onChange={(e) => handleInputChange('completed_date', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
}