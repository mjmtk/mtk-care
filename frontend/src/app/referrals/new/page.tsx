'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { ReferralService } from '@/services/referral-service';
import type { ReferralCreate, ReferralBatchDropdowns } from '@/types/referral';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, AlertCircle, Users, FileText, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewReferralPage() {
  const router = useRouter();
  const [dropdowns, setDropdowns] = useState<ReferralBatchDropdowns | null>(null);
  const [formData, setFormData] = useState<ReferralCreate>({
    type_id: 0,
    status_id: 0,
    priority_id: 0,
    service_type_id: 0,
    reason: '',
    client_type: 'new',
    referral_date: new Date().toISOString().split('T')[0], // Today's date
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { data: session, status } = useAuthBypassSession();
  const accessToken = useAccessToken();

  useEffect(() => {
    if (status === 'loading') return;
    if (!accessToken) return;

    const loadDropdowns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dropdownData = await ReferralService.getBatchDropdowns();
        setDropdowns(dropdownData);
        
        // Set default values to first available options
        if (dropdownData.referral_types.length > 0) {
          setFormData(prev => ({ ...prev, type_id: dropdownData.referral_types[0].id }));
        }
        if (dropdownData.referral_statuses.length > 0) {
          // Find "New" or first status
          const newStatus = dropdownData.referral_statuses.find(s => 
            s.label.toLowerCase().includes('new') || s.label.toLowerCase().includes('pending')
          ) || dropdownData.referral_statuses[0];
          setFormData(prev => ({ ...prev, status_id: newStatus.id }));
        }
        if (dropdownData.referral_priorities.length > 0) {
          // Find "Medium" or first priority
          const mediumPriority = dropdownData.referral_priorities.find(p => 
            p.label.toLowerCase().includes('medium')
          ) || dropdownData.referral_priorities[0];
          setFormData(prev => ({ ...prev, priority_id: mediumPriority.id }));
        }
        if (dropdownData.referral_service_types.length > 0) {
          setFormData(prev => ({ ...prev, service_type_id: dropdownData.referral_service_types[0].id }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDropdowns();
  }, [status, accessToken]);

  const handleInputChange = (field: keyof ReferralCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.type_id) errors.type_id = 'Referral type is required';
    if (!formData.status_id) errors.status_id = 'Status is required';
    if (!formData.priority_id) errors.priority_id = 'Priority is required';
    if (!formData.service_type_id) errors.service_type_id = 'Service type is required';
    if (!formData.reason.trim()) errors.reason = 'Reason for referral is required';
    if (!formData.client_type) errors.client_type = 'Client type is required';
    if (!formData.referral_date) errors.referral_date = 'Referral date is required';
    
    // Validate dates
    if (formData.referral_date && new Date(formData.referral_date) > new Date()) {
      errors.referral_date = 'Referral date cannot be in the future';
    }
    
    if (formData.accepted_date && formData.referral_date && 
        new Date(formData.accepted_date) < new Date(formData.referral_date)) {
      errors.accepted_date = 'Accepted date cannot be before referral date';
    }
    
    if (formData.completed_date) {
      if (formData.referral_date && new Date(formData.completed_date) < new Date(formData.referral_date)) {
        errors.completed_date = 'Completed date cannot be before referral date';
      }
      if (formData.accepted_date && new Date(formData.completed_date) < new Date(formData.accepted_date)) {
        errors.completed_date = 'Completed date cannot be before accepted date';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const createdReferral = await ReferralService.createReferral(formData);
      router.push(`/referrals/${createdReferral.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create referral');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/referrals');
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

  if (error && !dropdowns) {
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

  if (!dropdowns) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Unable to load form</h2>
            <p className="text-muted-foreground mt-2">Required data could not be loaded.</p>
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
                <h1 className="text-3xl font-bold">New Referral</h1>
                <p className="text-muted-foreground">
                  Create a new referral for healthcare services
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-blue-600">
              Draft
            </Badge>
          </div>

          {/* Healthcare Workflow Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Healthcare Intake Process:</strong> This form captures initial referral information from external agencies or self-referrals. 
              Client details can be added later during the intake process. Focus on capturing the presenting concern and service needs.
            </AlertDescription>
          </Alert>

          {error && (
            <ErrorDisplay error={error} />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Client Information</span>
                </CardTitle>
                <CardDescription>
                  Basic client categorization - detailed intake will be completed later
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_type">Client Type *</Label>
                  <Select
                    value={formData.client_type}
                    onValueChange={(value) => handleInputChange('client_type', value)}
                  >
                    <SelectTrigger className={validationErrors.client_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex flex-col">
                          <span>New Client</span>
                          <span className="text-xs text-muted-foreground">First time accessing services</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="existing">
                        <div className="flex flex-col">
                          <span>Existing Client</span>
                          <span className="text-xs text-muted-foreground">Previously received services</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="self">
                        <div className="flex flex-col">
                          <span>Self-Referral</span>
                          <span className="text-xs text-muted-foreground">Individual seeking services directly</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.client_type && (
                    <p className="text-sm text-red-500">{validationErrors.client_type}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Referral Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Referral Details</span>
                </CardTitle>
                <CardDescription>
                  Core information about the referral and service needs
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
                      <SelectTrigger className={validationErrors.type_id ? 'border-red-500' : ''}>
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
                    {validationErrors.type_id && (
                      <p className="text-sm text-red-500">{validationErrors.type_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={formData.priority_id?.toString()}
                      onValueChange={(value) => handleInputChange('priority_id', parseInt(value))}
                    >
                      <SelectTrigger className={validationErrors.priority_id ? 'border-red-500' : ''}>
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
                    {validationErrors.priority_id && (
                      <p className="text-sm text-red-500">{validationErrors.priority_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Select
                      value={formData.service_type_id?.toString()}
                      onValueChange={(value) => handleInputChange('service_type_id', parseInt(value))}
                    >
                      <SelectTrigger className={validationErrors.service_type_id ? 'border-red-500' : ''}>
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
                    {validationErrors.service_type_id && (
                      <p className="text-sm text-red-500">{validationErrors.service_type_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status *</Label>
                    <Select
                      value={formData.status_id?.toString()}
                      onValueChange={(value) => handleInputChange('status_id', parseInt(value))}
                    >
                      <SelectTrigger className={validationErrors.status_id ? 'border-red-500' : ''}>
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
                    {validationErrors.status_id && (
                      <p className="text-sm text-red-500">{validationErrors.status_id}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Presenting Concern / Reason for Referral *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Describe the presenting concern, symptoms, situation, or reason this person is being referred for services. Include any relevant background information that would help with assessment and service planning..."
                    className={`min-h-[120px] ${validationErrors.reason ? 'border-red-500' : ''}`}
                    required
                  />
                  {validationErrors.reason && (
                    <p className="text-sm text-red-500">{validationErrors.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Focus on the main concern and any safety considerations or immediate needs.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes / Special Considerations</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional context, special considerations, cultural factors, accessibility needs, or follow-up requirements..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include any information that would be helpful for intake staff or service providers.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Timeline</span>
                </CardTitle>
                <CardDescription>
                  Important dates for tracking referral progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="referral_date">Referral Date *</Label>
                    <Input
                      id="referral_date"
                      type="date"
                      value={formData.referral_date}
                      onChange={(e) => handleInputChange('referral_date', e.target.value)}
                      className={validationErrors.referral_date ? 'border-red-500' : ''}
                      required
                    />
                    {validationErrors.referral_date && (
                      <p className="text-sm text-red-500">{validationErrors.referral_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accepted_date">Accepted Date</Label>
                    <Input
                      id="accepted_date"
                      type="date"
                      value={formData.accepted_date || ''}
                      onChange={(e) => handleInputChange('accepted_date', e.target.value)}
                      className={validationErrors.accepted_date ? 'border-red-500' : ''}
                    />
                    {validationErrors.accepted_date && (
                      <p className="text-sm text-red-500">{validationErrors.accepted_date}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Date the referral was accepted for processing
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_consent_date">Client Consent Date</Label>
                    <Input
                      id="client_consent_date"
                      type="date"
                      value={formData.client_consent_date || ''}
                      onChange={(e) => handleInputChange('client_consent_date', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Date client provided consent for services
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="follow_up_date">Follow-up Date</Label>
                    <Input
                      id="follow_up_date"
                      type="date"
                      value={formData.follow_up_date || ''}
                      onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Scheduled follow-up or review date
                    </p>
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
                {isSaving ? 'Creating...' : 'Create Referral'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
}