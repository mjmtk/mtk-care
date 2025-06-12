'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { usePageContext } from '@/contexts/PageContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Users, Calendar, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SaveStatus } from '@/components/ui/save-status';
import { ReferralService } from '@/services/referral-service';
import { NewClientService } from '@/services/new-client-service';
import { EmergencyContactsService } from '@/services/emergency-contacts-service';

// Import the step components
import { ReferralSourceStep } from '@/components/referrals/steps/ReferralSourceStep';
import { ClientIdentificationStep } from '@/components/referrals/steps/ClientIdentificationStep';
import { ConsentDocumentationStep } from '@/components/referrals/steps/ConsentDocumentationStep';
import { ReferralDetailsStep } from '@/components/referrals/steps/ReferralDetailsStep';

// Types from OpenAPI
import type { components } from '@/types/openapi';

type ReferralFormData = {
  // Step 1: Referral Source & Basic Details
  referral_source: string;
  external_reference_number?: string;
  external_organisation_name?: string;
  target_program_id?: string;
  type: string;
  priority_id?: number;
  referral_date: string;
  
  // Step 2: Client Information (Enhanced)
  client_type: string;
  client_id?: string;
  // Basic client fields
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  gender_id?: number;
  // Cultural identity
  cultural_identity?: Record<string, any>;
  iwi_hapu_id?: number;
  spiritual_needs_id?: number;
  primary_language_id?: number;
  interpreter_needed?: boolean;
  // Emergency contacts
  emergency_contacts?: Array<{
    relationship_id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    is_primary: boolean;
    priority_order: number;
  }>;
  
  // Step 3: Consent & Documentation
  consent_records?: Array<{
    consent_type_id: number;
    status: string;
    consent_date?: string;
    notes?: string;
  }>;
  documents?: Array<{
    file_name: string;
    document_type_id: number;
    folder_category: string;
    description?: string;
  }>;
  
  // Step 4: Referral Details
  service_type_id?: number;
  status_id?: number;
  reason: string;
  notes?: string;
  accepted_date?: string;
  completed_date?: string;
  follow_up_date?: string;
  client_consent_date?: string;
  external_organisation_id?: string;
  external_organisation_contact_id?: string;
  program_data: Record<string, any>;
};

type StepStatus = 'pending' | 'current' | 'completed';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
}

export default function EditReferralPage() {
  const params = useParams();
  const router = useRouter();
  const { setPageInfo, clearPageInfo } = usePageContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [referralId] = useState<string>(params.id as string);
  const [dropdowns, setDropdowns] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(true);
  
  const [formData, setFormData] = useState<ReferralFormData>({
    referral_source: '',
    type: 'incoming',
    client_type: 'new',
    referral_date: new Date().toISOString().split('T')[0],
    reason: '',
    program_data: {},
    target_program_id: undefined
  });

  const baseSteps: Step[] = useMemo(() => [
    {
      id: 1,
      title: 'Referral Source',
      description: 'Basic details and source',
      icon: FileText,
      status: 'current'
    },
    {
      id: 2,
      title: 'Client Information',
      description: 'Client details & cultural identity',
      icon: Users,
      status: 'pending'
    },
    {
      id: 3,
      title: 'Consent & Documents',
      description: 'Consent forms & documentation',
      icon: Shield,
      status: 'pending'
    },
    {
      id: 4,
      title: 'Referral Details',
      description: 'Complete referral information',
      icon: Calendar,
      status: 'pending'
    }
  ], []);

  const { data: session, status } = useAuthBypassSession();
  const accessToken = useAccessToken();

  // Load referral data and dropdown data on mount
  useEffect(() => {
    if (status === 'loading') return;
    if (!accessToken) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load both referral and dropdown data
        const [referralData, dropdownData] = await Promise.all([
          ReferralService.getReferral(referralId),
          ReferralService.getBatchDropdowns()
        ]);
        
        setDropdowns(dropdownData);
        
        // Check if referral can be edited
        const canEditReferral = referralData.status ? 
          !['completed', 'enrolled', 'cancelled'].includes(referralData.status.slug.toLowerCase()) : 
          true; // Allow editing if status is null
        setCanEdit(canEditReferral);
        
        if (!canEditReferral) {
          setError(`This referral cannot be edited because it has status: ${referralData.status?.label || 'Unknown'}`);
          return;
        }
        
        // Convert referral data to form data format
        const loadedFormData: ReferralFormData = {
          referral_source: referralData.referral_source || 'external_agency',
          external_reference_number: referralData.external_reference_number || undefined,
          external_organisation_name: referralData.program_data?.external_organisation_name || undefined,
          target_program_id: referralData.target_program?.id || '__none__',
          type: referralData.type,
          priority_id: referralData.priority?.id || 0,
          referral_date: referralData.referral_date,
          client_type: referralData.client_type,
          client_id: referralData.client_id || undefined,
          service_type_id: referralData.service_type?.id || 0,
          status_id: referralData.status?.id || 0,
          reason: referralData.reason,
          notes: referralData.notes || undefined,
          accepted_date: referralData.accepted_date || undefined,
          completed_date: referralData.completed_date || undefined,
          follow_up_date: referralData.follow_up_date || undefined,
          client_consent_date: referralData.client_consent_date || undefined,
          external_organisation_id: referralData.external_organisation_id || undefined,
          external_organisation_contact_id: referralData.external_organisation_contact_id || undefined,
          program_data: referralData.program_data || {}
        };
        
        // If referral has a client, fetch the client data to populate the form
        if (referralData.client_id) {
          try {
            const [clientData, emergencyContacts] = await Promise.all([
              NewClientService.getClient(referralData.client_id),
              EmergencyContactsService.getClientEmergencyContacts(referralData.client_id)
            ]);
            console.log('Loaded client data:', clientData);
            console.log('Client iwi_hapu:', clientData.iwi_hapu);
            console.log('Client spiritual_needs:', clientData.spiritual_needs);
            console.log('Client iwi_hapu_id:', clientData.iwi_hapu_id);
            console.log('Client spiritual_needs_id:', clientData.spiritual_needs_id);
            console.log('Loaded emergency contacts:', emergencyContacts);
            
            // Ensure client_type is set to 'existing' when we have a client
            loadedFormData.client_type = 'existing';
            
            // Populate form with client data
            loadedFormData.first_name = clientData.first_name;
            loadedFormData.last_name = clientData.last_name;
            loadedFormData.date_of_birth = clientData.date_of_birth;
            loadedFormData.email = clientData.email || '';
            loadedFormData.phone = clientData.phone || '';
            loadedFormData.gender_id = clientData.gender?.id || undefined;
            loadedFormData.primary_language_id = clientData.primary_language?.id || undefined;
            loadedFormData.interpreter_needed = clientData.interpreter_needed || false;
            loadedFormData.cultural_identity = clientData.cultural_identity || {};
            loadedFormData.iwi_hapu_id = clientData.iwi_hapu?.id || undefined;
            loadedFormData.spiritual_needs_id = clientData.spiritual_needs?.id || undefined;
            
            // Load emergency contacts from dedicated API
            if (emergencyContacts && emergencyContacts.length > 0) {
              loadedFormData.emergency_contacts = emergencyContacts.map((contact: any) => ({
                relationship_id: contact.relationship?.id || 0,
                first_name: contact.first_name || '',
                last_name: contact.last_name || '',
                phone: contact.phone || '',
                email: contact.email || '',
                is_primary: contact.is_primary || false,
                priority_order: contact.priority_order || 1
              }));
            } else {
              loadedFormData.emergency_contacts = [];
            }
          } catch (err) {
            console.error('Failed to load client data:', err);
            // Don't fail the entire load if client fetch fails
          }
        }
        
        setFormData(loadedFormData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load referral data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [referralId, status, accessToken]);

  // Set page info on mount
  useEffect(() => {
    return () => clearPageInfo(); // Clear on unmount
  }, [clearPageInfo]);

  // Memoize the updated steps to prevent infinite re-renders
  const steps = useMemo(() => {
    return baseSteps.map(step => ({
      ...step,
      status: step.id < currentStep ? 'completed' : 
              step.id === currentStep ? 'current' : 'pending'
    }));
  }, [baseSteps, currentStep]);

  // Update page context based on current step
  useEffect(() => {
    setPageInfo({
      title: 'Edit Referral',
      subtitle: 'Update referral information and timeline',
      saveStatus,
      lastSaved,
      steps,
      currentStep
    });
  }, [currentStep, saveStatus, lastSaved, steps, setPageInfo]);

  const handleDataChange = (newData: Partial<ReferralFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
    setHasUnsavedChanges(true);
    setSaveStatus('idle'); // Show unsaved changes indicator
  };

  const handleStepComplete = async (stepData: Partial<ReferralFormData>) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);
    setHasUnsavedChanges(true);
    setSaveStatus('saving');
    
    try {
      // If we're completing step 2 and creating a new client, create the client first
      if (currentStep === 2 && updatedFormData.client_type === 'new' && 
          updatedFormData.first_name && updatedFormData.last_name) {
        
        const clientData = {
          first_name: updatedFormData.first_name,
          last_name: updatedFormData.last_name,
          date_of_birth: updatedFormData.date_of_birth || '',
          email: updatedFormData.email || '',
          phone: updatedFormData.phone || '',
          risk_level: 'low',
          primary_language_id: null,
          cultural_identity: {},
          consent_required: false,
          interpreter_needed: false,
          status_id: null,
          extended_data: {}
        };

        console.log('Creating new client...', clientData);
        const newClient = await NewClientService.createClient(clientData);
        console.log('Client created:', newClient);
        
        // Update form data with the new client ID
        updatedFormData.client_id = newClient.id;
        updatedFormData.client_type = 'existing';
        setFormData(updatedFormData);
      }

      // Save the referral changes
      await saveChanges(updatedFormData);
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
      }
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save step data');
      console.error('Step completion error:', err);
    }
  };

  // Helper function to clean data for API submission
  const cleanDataForAPI = (data: ReferralFormData) => {
    // Convert empty strings to null for optional UUID and date fields
    const cleanValue = (value: any) => {
      if (value === '' || value === undefined || value === null) return null;
      return value;
    };
    
    // Special cleaning for date fields - ensure they're either valid dates or null
    const cleanDateValue = (value: any) => {
      if (!value || value === '' || value === undefined) return null;
      // Check if it's a valid date string (YYYY-MM-DD format)
      if (typeof value === 'string' && value.length < 10) return null;
      return value;
    };

    console.log('=== CLEANING DATA FOR API ===');
    console.log('Before cleaning - completed_date:', data.completed_date);
    console.log('Before cleaning - client_consent_date:', data.client_consent_date);
    
    const cleaned = {
      ...data,
      completed_date: cleanDateValue(data.completed_date),
      accepted_date: cleanDateValue(data.accepted_date),
      follow_up_date: cleanDateValue(data.follow_up_date),
      client_consent_date: cleanDateValue(data.client_consent_date),
      referral_date: cleanDateValue(data.referral_date) || new Date().toISOString().split('T')[0], // Default to today if empty
      external_organisation_id: cleanValue(data.external_organisation_id),
      external_organisation_contact_id: cleanValue(data.external_organisation_contact_id),
      external_reference_number: cleanValue(data.external_reference_number),
      notes: cleanValue(data.notes),
      // Clean target_program_id
      target_program_id: data.target_program_id === '__none__' || data.target_program_id === '' ? null : data.target_program_id
    };
    
    console.log('After cleaning - completed_date:', cleaned.completed_date);
    console.log('After cleaning - client_consent_date:', cleaned.client_consent_date);
    
    return cleaned;
  };

  // Save changes function
  const saveChanges = useCallback(async (data: ReferralFormData) => {
    try {
      const cleanedData = cleanDataForAPI(data);
      
      // Update existing referral
      const updateData = {
        client_id: cleanedData.client_id || null,
        referral_source: cleanedData.referral_source,
        external_reference_number: cleanedData.external_reference_number,
        target_program_id: cleanedData.target_program_id,
        type: cleanedData.type,
        priority_id: cleanedData.priority_id || null,
        referral_date: cleanedData.referral_date,
        reason: cleanedData.reason || '',
        notes: cleanedData.notes,
        service_type_id: cleanedData.service_type_id || null,
        status_id: cleanedData.status_id || null,
        program_data: {
          ...cleanedData.program_data,
          external_organisation_name: cleanedData.external_organisation_name || null
        },
        accepted_date: cleanedData.accepted_date,
        completed_date: cleanedData.completed_date,
        follow_up_date: cleanedData.follow_up_date,
        client_consent_date: cleanedData.client_consent_date,
        external_organisation_id: cleanedData.external_organisation_id,
        external_organisation_contact_id: cleanedData.external_organisation_contact_id,
        client_type: cleanedData.client_type || 'new',
        
        // Only include consent records (emergency contacts and cultural fields handled separately)
        consent_records: cleanedData.consent_records || []
      };

      console.log('Updating referral...', updateData);
      const updatedReferral = await ReferralService.updateReferral(referralId, updateData);
      console.log('Referral updated:', updatedReferral);
    } catch (err) {
      console.error('Save changes error:', err);
      throw err;
    }
  }, [referralId]);

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/referrals/${referralId}`);
  };

  const handleSaveDraft = async () => {
    if (!hasUnsavedChanges && !isSaving) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await saveChanges(formData);
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setIsDraft(true);
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReferral = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      // First save the current state
      console.log('=== SUBMIT REFERRAL ===');
      console.log('Current form data:', formData);
      console.log('completed_date:', formData.completed_date, 'Type:', typeof formData.completed_date);
      console.log('client_consent_date:', formData.client_consent_date, 'Type:', typeof formData.client_consent_date);
      
      await saveChanges(formData);
      
      // Then redirect back to referral detail
      router.push(`/dashboard/referrals/${referralId}`);
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save referral');
      console.error('Submit error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ReferralSourceStep
            data={formData}
            onComplete={handleStepComplete}
            onCancel={handleCancel}
          />
        );
      case 2:
        return (
          <ClientIdentificationStep
            data={formData}
            onComplete={handleStepComplete}
            onPrevious={handlePreviousStep}
            onDataChange={handleDataChange}
          />
        );
      case 3:
        return (
          <ConsentDocumentationStep
            data={formData}
            onComplete={handleStepComplete}
            onPrevious={handlePreviousStep}
            onDataChange={handleDataChange}
          />
        );
      case 4:
        return (
          <ReferralDetailsStep
            data={formData}
            onComplete={handleStepComplete}
            onPrevious={handlePreviousStep}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmitReferral}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !canEdit) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  {error}
                </AlertDescription>
              </Alert>
              <Button onClick={handleCancel} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Referral</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <ErrorDisplay message={error} />
        )}

        {/* Current Step Content */}
        <div className="min-h-[400px]">
          {renderCurrentStep()}
        </div>
      </div>
    </ErrorBoundary>
  );
}