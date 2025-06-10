'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, Building2, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { NewClientService } from '@/services/new-client-service';
import { OptionListService } from '@/services/option-list-service';
import { ReferenceService } from '@/services/reference-service';
import type { components } from '@/types/openapi';

type ClientCreateSchema = components['schemas']['ClientCreateSchema'];
type ClientDetailSchema = components['schemas']['ClientDetailSchema'];

// Validation schema - matches minimal required fields from backend
const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  status_id: z.string().min(1, 'Status is required'),
  preferred_name: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  primary_language_id: z.string().optional(),
  interpreter_needed: z.boolean().optional(),
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
  consent_required: z.boolean().optional(),
  incomplete_documentation: z.boolean().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearchTerm?: string;
  isReferral?: boolean;
  onSuccess: (client: ClientDetailSchema) => void;
  onCancel?: () => void;
}

import { OptionListItem } from '@/types/option-list';
import { ReferenceItem } from '@/services/reference-service';

export function ClientCreateForm({
  open,
  onOpenChange,
  initialSearchTerm = '',
  isReferral = false,
  onSuccess,
  onCancel
}: ClientCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<OptionListItem[]>([]);
  const [languages, setLanguages] = useState<ReferenceItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      risk_level: 'low',
      consent_required: true,
      incomplete_documentation: false,
      interpreter_needed: false,
    },
  });

  // Load option lists on mount
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [statusesData, languagesData] = await Promise.all([
          OptionListService.fetchOptionList('client-statuses'),
          ReferenceService.fetchLanguages(),
        ]);
        
        setStatuses(statusesData || []);
        setLanguages(languagesData || []);
        
        // Set default status to "active" if available
        const activeStatus = statusesData?.find(s => s.slug === 'active' || s.label.toLowerCase() === 'active');
        if (activeStatus) {
          setValue('status_id', String(activeStatus.id));
        }
        
        // Set default language to English if available
        const englishLanguage = languagesData?.find(l => l.name.toLowerCase() === 'english');
        if (englishLanguage) {
          setValue('primary_language_id', String(englishLanguage.id));
        }
      } catch (error) {
        console.error('Failed to load option lists:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    if (open) {
      loadOptions();
      
      // Pre-populate name fields if we have a search term
      if (initialSearchTerm) {
        const nameParts = initialSearchTerm.trim().split(' ');
        if (nameParts.length >= 2) {
          setValue('first_name', nameParts[0]);
          setValue('last_name', nameParts.slice(1).join(' '));
        } else if (nameParts.length === 1) {
          setValue('first_name', nameParts[0]);
        }
      }
    }
  }, [open, initialSearchTerm, setValue]);

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert form data to API format
      const clientData: ClientCreateSchema = {
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        status_id: data.status_id,
        preferred_name: data.preferred_name || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        primary_language_id: data.primary_language_id || undefined,
        interpreter_needed: data.interpreter_needed || false,
        risk_level: data.risk_level || 'low',
        consent_required: data.consent_required ?? true,
        incomplete_documentation: data.incomplete_documentation || false,
        notes: data.notes || undefined,
      };

      // Add referral-specific context to notes if this is a referral
      if (isReferral && clientData.notes) {
        clientData.notes = `[REFERRAL] ${clientData.notes}`;
      } else if (isReferral) {
        clientData.notes = '[REFERRAL] Client created from external referral';
      }

      const newClient = await NewClientService.createClient(clientData);
      onSuccess(newClient);
      reset();
    } catch (error: any) {
      console.error('Failed to create client:', error);
      setSubmitError(error.message || 'Failed to create client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSubmitError(null);
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isReferral ? (
              <Building2 className="h-5 w-5 text-blue-600" />
            ) : (
              <UserPlus className="h-5 w-5 text-green-600" />
            )}
            <DialogTitle>
              Create New {isReferral ? 'Referred' : 'Walk-in'} Client
            </DialogTitle>
          </div>
          <DialogDescription>
            {isReferral 
              ? 'Creating a client record for someone referred from an external organization.'
              : 'Creating a client record for a walk-in client.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Type Badge */}
          <div className="flex justify-center">
            <Badge variant={isReferral ? "default" : "secondary"} className="px-3 py-1">
              {isReferral ? 'External Referral' : 'Walk-in Client'}
            </Badge>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input
                    id="preferred_name"
                    {...register('preferred_name')}
                    placeholder="Optional preferred name"
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register('date_of_birth')}
                  />
                  {errors.date_of_birth && (
                    <p className="text-sm text-red-600 mt-1">{errors.date_of_birth.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="client@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+64 21 123 4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder="Full address including street, city, and postcode"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status and Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status_id">Status *</Label>
                  <Select
                    value={watch('status_id')}
                    onValueChange={(value) => setValue('status_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOptions ? (
                        <SelectItem value="loading" disabled>Loading statuses...</SelectItem>
                      ) : statuses.length === 0 ? (
                        <SelectItem value="none" disabled>No statuses available</SelectItem>
                      ) : (
                        statuses.map((status) => (
                          <SelectItem key={status.id} value={String(status.id)}>
                            {status.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.status_id && (
                    <p className="text-sm text-red-600 mt-1">{errors.status_id.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="primary_language_id">Primary Language</Label>
                  <Select
                    value={watch('primary_language_id')}
                    onValueChange={(value) => setValue('primary_language_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOptions ? (
                        <SelectItem value="loading" disabled>Loading languages...</SelectItem>
                      ) : languages.length === 0 ? (
                        <SelectItem value="none" disabled>No languages available</SelectItem>
                      ) : (
                        languages.map((language) => (
                          <SelectItem key={language.id} value={String(language.id)}>
                            {language.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="risk_level">Risk Level</Label>
                  <Select
                    value={watch('risk_level')}
                    onValueChange={(value) => setValue('risk_level', value as 'low' | 'medium' | 'high')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="interpreter_needed" className="text-base">
                    Interpreter needed
                  </Label>
                  <Switch
                    id="interpreter_needed"
                    checked={watch('interpreter_needed')}
                    onCheckedChange={(checked) => setValue('interpreter_needed', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="consent_required" className="text-base">
                    Consent required
                  </Label>
                  <Switch
                    id="consent_required"
                    checked={watch('consent_required')}
                    onCheckedChange={(checked) => setValue('consent_required', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="incomplete_documentation" className="text-base">
                    Incomplete documentation
                  </Label>
                  <Switch
                    id="incomplete_documentation"
                    checked={watch('incomplete_documentation')}
                    onCheckedChange={(checked) => setValue('incomplete_documentation', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional information about the client..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Error Display */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{submitError}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingOptions}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}