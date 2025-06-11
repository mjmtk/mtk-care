'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send, FileText, Globe, Paperclip, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/services/api-request';
import { ReferralService } from '@/services/referral-service';
import type { components } from '@/types/openapi';

interface ReferralDetailsStepProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  hasUnsavedChanges?: boolean;
}

type BatchDropdowns = components['schemas']['ReferralBatchDropdownsSchemaOut'];
type FormFieldSchema = components['schemas']['FormFieldSchema'];
type ProgramFormSchema = components['schemas']['ProgramFormSchemaOut'];

export function ReferralDetailsStep({ 
  data, 
  onComplete, 
  onPrevious, 
  onSaveDraft, 
  onSubmit, 
  isSaving,
  hasUnsavedChanges = false
}: ReferralDetailsStepProps) {
  const [dropdowns, setDropdowns] = useState<BatchDropdowns | null>(null);
  const [programFields, setProgramFields] = useState<FormFieldSchema[]>([]);
  const [isLoadingProgram, setIsLoadingProgram] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      service_type_id: data.service_type_id || undefined,
      status_id: data.status_id || undefined,
      reason: data.reason || '',
      notes: data.notes || '',
      accepted_date: data.accepted_date || '',
      completed_date: data.completed_date || '',
      follow_up_date: data.follow_up_date || '',
      client_consent_date: data.client_consent_date || '',
      program_data: data.program_data || {}
    }
  });

  const programData = watch('program_data');

  // Load initial dropdown data
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dropdownData = await apiRequest({
          url: 'v1/referrals/batch-dropdowns',
          method: 'GET'
        }) as BatchDropdowns;
        
        setDropdowns(dropdownData);
        
        // Set default values
        if (!data.service_type_id && dropdownData.referral_service_types.length > 0) {
          setValue('service_type_id', dropdownData.referral_service_types[0].id);
        }
        
        if (!data.status_id && dropdownData.referral_statuses.length > 0) {
          const newStatus = dropdownData.referral_statuses.find(s => 
            s.label.toLowerCase().includes('new') || s.label.toLowerCase().includes('pending')
          ) || dropdownData.referral_statuses[0];
          setValue('status_id', newStatus.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDropdowns();
  }, [data.service_type_id, data.status_id, setValue]);

  // Load program-specific fields when target_program_id changes
  useEffect(() => {
    const loadProgramFields = async () => {
      if (!data.target_program_id) {
        setProgramFields([]);
        return;
      }

      try {
        setIsLoadingProgram(true);
        const schema = await apiRequest({
          url: `v1/referrals/programs/${data.target_program_id}/form-schema`,
          method: 'GET'
        }) as ProgramFormSchema;
        
        setProgramFields(schema.fields || []);
      } catch (err) {
        console.error('Failed to load program fields:', err);
        setProgramFields([]);
      } finally {
        setIsLoadingProgram(false);
      }
    };

    loadProgramFields();
  }, [data.target_program_id]);

  const handleProgramFieldChange = (fieldName: string, value: any) => {
    const currentProgramData = { ...programData };
    currentProgramData[fieldName] = value;
    setValue('program_data', currentProgramData);
  };

  const renderProgramField = (field: FormFieldSchema) => {
    const value = programData[field.name] || '';
    
    switch (field.type) {
      case 'string':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => handleProgramFieldChange(field.name, e.target.value)}
              placeholder={field.help_text}
            />
            {field.help_text && (
              <p className="text-sm text-gray-600">{field.help_text}</p>
            )}
          </div>
        );
        
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && '*'}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) => handleProgramFieldChange(field.name, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {field.choices?.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.help_text && (
              <p className="text-sm text-gray-600">{field.help_text}</p>
            )}
          </div>
        );
        
      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) => handleProgramFieldChange(field.name, e.target.value)}
            />
            {field.help_text && (
              <p className="text-sm text-gray-600">{field.help_text}</p>
            )}
          </div>
        );
        
      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleProgramFieldChange(field.name, e.target.value)}
            />
            {field.help_text && (
              <p className="text-sm text-gray-600">{field.help_text}</p>
            )}
          </div>
        );
        
      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label} (Unsupported field type: {field.type})</Label>
          </div>
        );
    }
  };

  const onFormSubmit = async (formData: any) => {
    try {
      // Combine all form data including program-specific data
      const completeData = {
        ...data, // Previous step data
        ...formData,
        program_data: formData.program_data || {}
      };

      // Create the referral
      const createdReferral = await ReferralService.createReferral(completeData);
      onComplete(completeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create referral');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Referral Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Referral Details</span>
          </CardTitle>
          <CardDescription>
            Core information about the referral and service needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_type_id">Service Type *</Label>
              <Select
                value={watch('service_type_id')?.toString() || ''}
                onValueChange={(value) => setValue('service_type_id', parseInt(value))}
              >
                <SelectTrigger className={errors.service_type_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns?.referral_service_types.map((serviceType) => (
                    <SelectItem key={serviceType.id} value={serviceType.id.toString()}>
                      {serviceType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_type_id && (
                <p className="text-sm text-red-500">Service type is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_id">Initial Status *</Label>
              <Select
                value={watch('status_id')?.toString() || ''}
                onValueChange={(value) => setValue('status_id', parseInt(value))}
              >
                <SelectTrigger className={errors.status_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {dropdowns?.referral_statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status_id && (
                <p className="text-sm text-red-500">Status is required</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Presenting Concern / Reason for Referral *</Label>
            <Textarea
              id="reason"
              {...register('reason', { required: 'Reason for referral is required' })}
              placeholder="Describe the presenting concern, symptoms, situation, or reason this person is being referred for services. Include any relevant background information that would help with assessment and service planning..."
              className={`min-h-[120px] ${errors.reason ? 'border-red-500' : ''}`}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Focus on the main concern and any safety considerations or immediate needs.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes / Special Considerations</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional context, special considerations, cultural factors, accessibility needs, or follow-up requirements..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Include any information that would be helpful for intake staff or service providers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Program-Specific Fields */}
      {data.target_program_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-green-600" />
              <span>Program-Specific Information</span>
            </CardTitle>
            <CardDescription>
              Additional fields required for the selected program
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProgram ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : programFields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programFields.map(renderProgramField)}
              </div>
            ) : (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  No additional program-specific fields are required at this time.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span>Timeline (Optional)</span>
          </CardTitle>
          <CardDescription>
            Important dates for tracking referral progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accepted_date">Accepted Date</Label>
              <Input
                id="accepted_date"
                type="date"
                {...register('accepted_date')}
              />
              <p className="text-xs text-muted-foreground">
                Date the referral was accepted for processing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_consent_date">Client Consent Date</Label>
              <Input
                id="client_consent_date"
                type="date"
                {...register('client_consent_date')}
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
                {...register('follow_up_date')}
              />
              <p className="text-xs text-muted-foreground">
                Scheduled follow-up or review date
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Client
        </Button>
        <div className="flex space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSaveDraft}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Draft' : 'Draft Saved'}
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSaving ? 'Submitting...' : 'Submit Referral'}
          </Button>
        </div>
      </div>
    </form>
  );
}