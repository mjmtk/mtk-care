'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowRight, ArrowLeft, Building2, School, Users, ArrowUpRight, UserCheck, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/services/api-request';
import type { components } from '@/types/openapi';

interface ReferralSourceStepProps {
  data: any;
  onComplete: (data: any) => void;
  onCancel: () => void;
}

type BatchDropdowns = components['schemas']['ReferralBatchDropdownsSchemaOut'];
type ReferralSource = components['schemas']['ReferralSourceChoice'];
type Program = components['schemas']['ProgramBasicSchemaOut'];

export function ReferralSourceStep({ data, onComplete, onCancel }: ReferralSourceStepProps) {
  const [dropdowns, setDropdowns] = useState<BatchDropdowns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState(data.referral_source || '');
  const [selectedProgram, setSelectedProgram] = useState(data.target_program_id || '__none__');
  const [selectedType, setSelectedType] = useState(data.type || 'incoming');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      referral_source: data.referral_source || '',
      external_reference_number: data.external_reference_number || '',
      external_organisation_name: data.external_organisation_name || '',
      target_program_id: data.target_program_id || '__none__',
      type: data.type || 'incoming',
      priority_id: data.priority_id || undefined,
      referral_date: data.referral_date || new Date().toISOString().split('T')[0]
    }
  });

  // Load dropdown data
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
        
        // Set default priority if not set
        if (!data.priority_id && dropdownData.referral_priorities.length > 0) {
          const mediumPriority = dropdownData.referral_priorities.find(p => 
            p.label.toLowerCase().includes('medium') || p.label.toLowerCase().includes('routine')
          ) || dropdownData.referral_priorities[0];
          setValue('priority_id', mediumPriority.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDropdowns();
  }, [data.priority_id, setValue]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'external_agency': return Building2;
      case 'school': return School;
      case 'self_referral': return UserCheck;
      case 'internal': return ArrowUpRight;
      case 'family': return Users;
      default: return HelpCircle;
    }
  };

  const getSourceDescription = (source: string, isOutgoing: boolean = false) => {
    if (isOutgoing) {
      switch (source) {
        case 'external_agency': return 'Referring to government agency or community organization';
        case 'school': return 'Referring to educational institution or school service';
        case 'self_referral': return 'Client will self-refer to another service';
        case 'internal': return 'Transfer to another program within our organization';
        case 'family': return 'Referral to family-based or whānau support service';
        case 'other': return 'Other destination service not listed above';
        default: return '';
      }
    } else {
      switch (source) {
        case 'external_agency': return 'Referral from government agency or community organization';
        case 'school': return 'Student identified within school environment (e.g., SWiS practitioner)';
        case 'self_referral': return 'Individual seeking services directly';
        case 'internal': return 'Transfer from another program within the organization';
        case 'family': return 'Referral from family member or whānau';
        case 'other': return 'Other referral source not listed above';
        default: return '';
      }
    }
  };

  const onSubmit = (formData: any) => {
    // Validate required fields
    if (!formData.referral_source) {
      return; // Don't submit if no source selected
    }
    
    // Convert __none__ back to undefined for the API
    const cleanedData = {
      ...formData,
      target_program_id: formData.target_program_id === '__none__' ? undefined : formData.target_program_id
    };
    onComplete(cleanedData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !dropdowns) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800 rounded-3xl">
        <CardHeader className="pb-8">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-900 dark:text-white">Referral Source & Basic Details</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
            Identify where this referral is coming from and set basic priority
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-8 pb-8">
          
          {/* Referral Direction Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-900 dark:text-white">Referral Direction *</Label>
            <RadioGroup
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
                setValue('type', value);
                // Clear source when direction changes as wording changes
                setSelectedSource('');
                setValue('referral_source', '');
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <Label
                htmlFor="type-incoming"
                className={`relative flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 border rounded-xl cursor-pointer transition-all duration-200 ease-out
                  hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                  ${selectedType === 'incoming' 
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900' 
                    : 'border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
              >
                <RadioGroupItem value="incoming" id="type-incoming" className="sr-only" />
                <ArrowRight className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-colors ${
                  selectedType === 'incoming' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Incoming Referral</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Someone is referring a client to our services
                  </p>
                </div>
              </Label>

              <Label
                htmlFor="type-outgoing"
                className={`relative flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 border rounded-xl cursor-not-allowed transition-all duration-200 ease-out
                  border-gray-100 dark:border-gray-700 opacity-50
                  }`}
              >
                <RadioGroupItem value="outgoing" id="type-outgoing" className="sr-only" disabled />
                <ArrowLeft className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-500 dark:text-gray-400 text-sm mb-1">Outgoing Referral</div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    Coming soon - We are referring a client to another service
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Referral Source Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedType === 'incoming' 
                ? 'How did this referral come to us? *' 
                : 'Where are we referring this client? *'
              }
            </Label>
            <RadioGroup
              value={selectedSource}
              onValueChange={(value) => {
                setSelectedSource(value);
                setValue('referral_source', value);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {dropdowns?.referral_sources.map((source: ReferralSource) => {
                const Icon = getSourceIcon(source.value);
                const isSelected = selectedSource === source.value;
                return (
                  <Label
                    key={source.value}
                    htmlFor={source.value}
                    className={`relative flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 border rounded-xl cursor-pointer transition-all duration-200 ease-out
                      hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                      ${isSelected 
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900' 
                        : 'border-gray-200 dark:border-gray-700 shadow-sm'
                      }`}
                  >
                    <RadioGroupItem value={source.value} id={source.value} className="sr-only" />
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 transition-colors ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{source.label}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {getSourceDescription(source.value, selectedType === 'outgoing')}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
            {!selectedSource && (
              <p className="text-sm text-red-500 px-1 mt-2">Please select a referral source</p>
            )}
          </div>

          {/* Conditional fields based on source */}
          {(selectedSource === 'external_agency' || selectedSource === 'school') && (
            <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="external_organisation_name" className="text-base font-semibold text-gray-900 dark:text-white">
                    {selectedType === 'outgoing' 
                      ? (selectedSource === 'external_agency' ? 'Destination Agency Name' : 'Destination School Name')
                      : (selectedSource === 'external_agency' ? 'Referring Agency Name' : 'School Name')
                    } *
                  </Label>
                  <Input
                    id="external_organisation_name"
                    {...register('external_organisation_name')}
                    placeholder={selectedType === 'outgoing'
                      ? (selectedSource === 'external_agency' ? 
                          'e.g., DHB Mental Health, Community Health Centre' : 
                          'e.g., Specialist School Program, Educational Support Service')
                      : (selectedSource === 'external_agency' ? 
                          'e.g., Oranga Tamariki, Ministry of Social Development' : 
                          'e.g., Auckland Primary School, Wellington High School')
                    }
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-0"
                  />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedType === 'outgoing'
                      ? (selectedSource === 'external_agency' ? 
                          'Name of the agency or organization we are referring to' :
                          'Name of the school or educational service we are referring to')
                      : (selectedSource === 'external_agency' ? 
                          'Name of the referring agency or organization' :
                          'Name of the school where the student was identified')
                    }
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="external_reference_number" className="text-base font-semibold text-gray-900 dark:text-white">
                    {selectedType === 'outgoing'
                      ? (selectedSource === 'external_agency' ? 'Our Reference Number' : 'Our Reference Number') 
                      : (selectedSource === 'external_agency' ? 'Agency Reference Number' : 'Student ID / Reference')
                    }
                  </Label>
                  <Input
                    id="external_reference_number"
                    {...register('external_reference_number')}
                    placeholder={selectedType === 'outgoing'
                      ? 'e.g., OUT-2025-1234, REF-567' 
                      : (selectedSource === 'external_agency' ? 
                          'e.g., OT-2025-1234, MSD-REF-567' : 
                          'e.g., Student ID 12345, Class 5B-2025')
                    }
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-0"
                  />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedType === 'outgoing'
                      ? 'Our internal reference number for tracking this outgoing referral'
                      : (selectedSource === 'external_agency' ? 
                          'Reference number from the referring agency (if provided)' :
                          'Student identifier or class reference for tracking within school')
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Program Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-900 dark:text-white">Target Program (Optional)</Label>
            <RadioGroup
              value={selectedProgram}
              onValueChange={(value) => {
                setSelectedProgram(value);
                setValue('target_program_id', value);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {/* Default option */}
              <Label
                htmlFor="program-none"
                className={`relative flex flex-col p-4 bg-white dark:bg-gray-800 border rounded-xl cursor-pointer transition-all duration-200 ease-out
                  hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                  ${selectedProgram === '__none__' 
                    ? 'border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900' 
                    : 'border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
              >
                <RadioGroupItem value="__none__" id="program-none" className="sr-only" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500" />
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">To be determined</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Program will be assigned during triage
                  </p>
                </div>
              </Label>

              {/* Program options */}
              {dropdowns?.programs.map((program: Program) => (
                <Label
                  key={program.id}
                  htmlFor={`program-${program.id}`}
                  className={`relative flex flex-col p-4 bg-white dark:bg-gray-800 border rounded-xl cursor-pointer transition-all duration-200 ease-out
                    hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                    ${selectedProgram === program.id 
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900' 
                      : 'border-gray-200 dark:border-gray-700 shadow-sm'
                    }`}
                >
                  <RadioGroupItem value={program.id} id={`program-${program.id}`} className="sr-only" />
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        program.status === 'operational' ? 'bg-green-500' : 
                        program.status === 'inactive' ? 'bg-yellow-500' : 'bg-gray-400 dark:bg-gray-500'
                      }`} />
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{program.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Status: {program.status}
                    </p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed px-1">
              If you know which program this referral should go to, select it. Otherwise, it can be assigned during triage.
            </p>
          </div>

          {/* Urgency Level */}
          <div className="space-y-6">
            <Label className="text-lg font-semibold text-gray-900 dark:text-white">Urgency Level *</Label>
            <RadioGroup
              value={watch('priority_id')?.toString() || ''}
              onValueChange={(value) => setValue('priority_id', parseInt(value))}
              className="grid grid-cols-1 md:grid-cols-4 gap-5"
            >
              {dropdowns?.referral_priorities.map((priority) => {
                const getUrgencyData = (label: string) => {
                  if (label.toLowerCase().includes('crisis') || label.toLowerCase().includes('urgent')) {
                    return { 
                      dotColor: 'bg-red-500', 
                      desc: 'Immediate attention required',
                      priority: 'Critical'
                    };
                  }
                  if (label.toLowerCase().includes('high') || label.toLowerCase().includes('priority')) {
                    return { 
                      dotColor: 'bg-orange-500', 
                      desc: 'Respond within 24 hours',
                      priority: 'High'
                    };
                  }
                  if (label.toLowerCase().includes('medium') || label.toLowerCase().includes('routine')) {
                    return { 
                      dotColor: 'bg-yellow-500', 
                      desc: 'Respond within 3 days',
                      priority: 'Medium'
                    };
                  }
                  return { 
                    dotColor: 'bg-green-500', 
                    desc: 'Respond within 1 week',
                    priority: 'Low'
                  };
                };
                
                const urgencyData = getUrgencyData(priority.label);
                const isSelected = watch('priority_id')?.toString() === priority.id.toString();
                
                return (
                  <Label
                    key={priority.id}
                    htmlFor={`priority-${priority.id}`}
                    className={`relative flex flex-col p-6 bg-white dark:bg-gray-800 border rounded-2xl cursor-pointer transition-all duration-200 ease-out
                      hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-600
                      ${isSelected 
                        ? 'border-blue-500 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900' 
                        : 'border-gray-200 dark:border-gray-700 shadow-sm'
                      }`}
                  >
                    <RadioGroupItem 
                      value={priority.id.toString()} 
                      id={`priority-${priority.id}`} 
                      className="absolute top-4 right-4 border-gray-300 dark:border-gray-600" 
                    />
                    <div className="space-y-4 pr-8">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${urgencyData.dotColor} shadow-sm`} />
                        <span className="font-semibold text-gray-900 dark:text-white text-base">
                          {urgencyData.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {urgencyData.desc}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
            {errors.priority_id && (
              <p className="text-sm text-red-500 px-1 mt-2">Priority level is required</p>
            )}
          </div>

          {/* Referral Date */}
          <div className="space-y-4">
            <Label htmlFor="referral_date" className="text-lg font-semibold text-gray-900 dark:text-white">Referral Date *</Label>
            <Input
              id="referral_date"
              type="date"
              {...register('referral_date', { required: 'Referral date is required' })}
              className={`h-14 text-base border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 focus:ring-0 ${
                errors.referral_date ? 'border-red-500' : ''
              }`}
            />
            {errors.referral_date && (
              <p className="text-sm text-red-500 px-1">{errors.referral_date.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex items-center space-x-2 h-12 px-6 text-base border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Return to Referrals</span>
        </Button>
        <Button 
          type="submit" 
          className="flex items-center space-x-2 h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 hover:shadow-lg rounded-xl transition-all duration-200 ease-out hover:-translate-y-0.5"
        >
          <span>Continue to Client Information</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}