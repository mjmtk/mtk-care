'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';
import { usePageContext } from '@/contexts/PageContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorDisplay } from '@/components/error-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Save, FileText, Users, Calendar, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SaveStatus } from '@/components/ui/save-status';
import { ReferralService } from '@/services/referral-service';
import { NewClientService } from '@/services/new-client-service';

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

export default function NewReferralPage() {
  const router = useRouter();
  const { setPageInfo, clearPageInfo } = usePageContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftReferralId, setDraftReferralId] = useState<string | null>(null);
  const [dropdowns, setDropdowns] = useState<any>(null);
  
  const [formData, setFormData] = useState<ReferralFormData>({
    referral_source: '', // No default - user must select
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

  // Load dropdown data on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const dropdownData = await ReferralService.getBatchDropdowns();
        setDropdowns(dropdownData);
      } catch (err) {
        console.error('Failed to load dropdowns:', err);
      }
    };
    
    loadDropdowns();
  }, []);

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
      title: 'New Referral',
      subtitle: 'Create a new referral for community services',
      saveStatus,
      lastSaved,
      steps,
      currentStep
    });
  }, [currentStep, saveStatus, lastSaved, steps, setPageInfo]);

  // Auto-save functionality - will be updated after saveDraft is defined
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return;
    
    // Temporarily disabled to avoid circular dependency
    console.log('Auto-save disabled temporarily', formData);
  }, [formData, hasUnsavedChanges]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasUnsavedChanges && (formData.reason || formData.external_reference_number)) {
        autoSave();
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, hasUnsavedChanges, autoSave]);

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

      // Save or update the referral draft
      await saveDraft(updatedFormData);
      
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

  // Save draft function
  const saveDraft = useCallback(async (data: ReferralFormData) => {
    try {
      if (draftReferralId) {
        // Update existing draft - use optional fields
        const updateData = {
          client_id: data.client_id || null,
          referral_source: data.referral_source,
          external_reference_number: data.external_reference_number || null,
          target_program_id: data.target_program_id === '__none__' ? null : data.target_program_id,
          type: data.type,
          priority_id: data.priority_id || null,
          referral_date: data.referral_date,
          reason: data.reason || '',
          notes: data.notes || null,
          service_type_id: data.service_type_id || null,
          program_data: data.program_data || {},
          accepted_date: data.accepted_date || null,
          completed_date: data.completed_date || null,
          follow_up_date: data.follow_up_date || null,
          client_consent_date: data.client_consent_date || null,
          external_organisation_id: data.external_organisation_id || null,
          external_organisation_contact_id: data.external_organisation_contact_id || null
        };

        console.log('Updating draft referral...', updateData);
        const updatedReferral = await ReferralService.updateReferral(draftReferralId, updateData);
        console.log('Draft updated:', updatedReferral);
      } else {
        // Create new draft - need required fields with defaults
        // Log the available dropdowns to debug
        console.log('Available dropdowns:', dropdowns);
        
        // Get default values from dropdowns - use actual IDs from the data
        const defaultPriority = data.priority_id || 
          dropdowns?.referral_priorities?.find((p: any) => 
            p.label.toLowerCase().includes('medium') || p.label.toLowerCase().includes('routine')
          )?.id || dropdowns?.referral_priorities?.[0]?.id;
        
        const defaultStatus = dropdowns?.referral_statuses?.find((s: any) => 
          s.label.toLowerCase().includes('draft')
        )?.id || dropdowns?.referral_statuses?.[0]?.id;
        
        // Use TBD service type as default for drafts if no service type selected
        const defaultServiceType = data.service_type_id || 
          dropdowns?.referral_service_types?.find((st: any) => 
            st.label.toLowerCase().includes('to be determined') ||
            st.slug === 'to-be-determined'
          )?.id;

        // Only proceed if we have valid IDs
        if (!defaultPriority || !defaultStatus || !defaultServiceType) {
          console.error('Missing required dropdown data:', {
            priorities: dropdowns?.referral_priorities,
            statuses: dropdowns?.referral_statuses,
            serviceTypes: dropdowns?.referral_service_types,
            data: data
          });
          throw new Error('Unable to create referral: missing required dropdown data. Please reload the page.');
        }

        const createData = {
          client_id: data.client_id || null,
          referral_source: data.referral_source,
          external_reference_number: data.external_reference_number || null,
          target_program_id: data.target_program_id === '__none__' ? null : data.target_program_id,
          type: data.type,
          priority_id: defaultPriority,
          referral_date: data.referral_date,
          reason: data.reason || 'Draft referral - details to be completed',
          notes: data.notes || null,
          status_id: defaultStatus,
          service_type_id: defaultServiceType,
          program_data: {
            ...data.program_data,
            // Store the organisation name in program_data if provided
            external_organisation_name: data.external_organisation_name || null
          },
          accepted_date: data.accepted_date || null,
          completed_date: data.completed_date || null,
          follow_up_date: data.follow_up_date || null,
          client_consent_date: data.client_consent_date || null,
          external_organisation_id: data.external_organisation_id || null,
          external_organisation_contact_id: data.external_organisation_contact_id || null,
          client_type: data.client_type || 'new'
        };

        console.log('Creating new draft referral with data:', createData);
        const newReferral = await ReferralService.createReferral(createData);
        console.log('Draft created:', newReferral);
        setDraftReferralId(newReferral.id);
      }
    } catch (err) {
      console.error('Save draft error:', err);
      throw err;
    }
  }, [draftReferralId, dropdowns]);

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/referrals');
  };

  const handleSaveDraft = async () => {
    if (!hasUnsavedChanges && !isSaving) return; // Don't save if no changes
    
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await saveDraft(formData);
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setIsDraft(true);
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReferral = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      // First save the current state
      await saveDraft(formData);
      
      // Then update status to submitted (this would need a status update API call)
      console.log('Submitting referral...', formData);
      
      // For now, just redirect after saving
      router.push('/dashboard/referrals');
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to submit referral');
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