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
        const canEditReferral = !['completed', 'enrolled', 'cancelled'].includes(referralData.status.slug.toLowerCase());
        setCanEdit(canEditReferral);
        
        if (!canEditReferral) {
          setError(`This referral cannot be edited because it has status: ${referralData.status.label}`);
          return;
        }
        
        // Convert referral data to form data format
        const loadedFormData: ReferralFormData = {
          referral_source: referralData.referral_source || 'external_agency',
          external_reference_number: referralData.external_reference_number || '',
          external_organisation_name: referralData.program_data?.external_organisation_name || '',
          target_program_id: referralData.target_program?.id || '__none__',
          type: referralData.type,
          priority_id: referralData.priority.id,
          referral_date: referralData.referral_date,
          client_type: referralData.client_type,
          client_id: referralData.client_id || undefined,
          service_type_id: referralData.service_type.id,
          status_id: referralData.status.id,
          reason: referralData.reason,
          notes: referralData.notes || '',
          accepted_date: referralData.accepted_date || '',
          completed_date: referralData.completed_date || '',
          follow_up_date: referralData.follow_up_date || '',
          client_consent_date: referralData.client_consent_date || '',
          external_organisation_id: referralData.external_organisation_id || '',
          external_organisation_contact_id: referralData.external_organisation_contact_id || '',
          program_data: referralData.program_data || {}
        };
        
        // If referral has an existing client, fetch the client data to populate the form
        if (referralData.client_id && referralData.client_type === 'existing') {
          try {
            const clientData = await NewClientService.getClient(referralData.client_id);
            console.log('Loaded client data:', clientData);
            
            // Populate form with client data
            loadedFormData.first_name = clientData.first_name;
            loadedFormData.last_name = clientData.last_name;
            loadedFormData.date_of_birth = clientData.date_of_birth;
            loadedFormData.email = clientData.email || '';
            loadedFormData.phone = clientData.phone || '';
            loadedFormData.gender_id = clientData.gender?.id;
            loadedFormData.primary_language_id = clientData.primary_language?.id;
            loadedFormData.interpreter_needed = clientData.interpreter_needed;
            loadedFormData.cultural_identity = clientData.cultural_identity;
            loadedFormData.iwi_hapu_id = clientData.iwi_hapu?.id;
            loadedFormData.spiritual_needs_id = clientData.spiritual_needs?.id;
            
            // Load emergency contacts if available
            if (clientData.emergency_contacts) {
              loadedFormData.emergency_contacts = clientData.emergency_contacts.map((contact: any) => ({
                relationship_id: contact.relationship.id,
                first_name: contact.first_name,
                last_name: contact.last_name,
                phone: contact.phone,
                email: contact.email || '',
                is_primary: contact.is_primary,
                priority_order: contact.priority_order
              }));
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

  // Save changes function
  const saveChanges = useCallback(async (data: ReferralFormData) => {
    try {
      // Update existing referral
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
        status_id: data.status_id || null,
        program_data: {
          ...data.program_data,
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
      await saveChanges(formData);
      
      // Then redirect back to referral detail
      router.push(`/dashboard/referrals/${referralId}`);
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save referral');
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