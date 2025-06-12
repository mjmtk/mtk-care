'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Shield, FileText, Upload, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/services/api-request';
import type { components } from '@/types/openapi';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ConsentDocumentationStepProps {
  data: any;
  onComplete: (data: any) => void;
  onPrevious: () => void;
  onDataChange: (data: any) => void;
}

type ConsentType = {
  id: number;
  label: string;
  slug: string;
  description: string;
};

type DocumentType = {
  id: number;
  label: string;
  slug: string;
  description: string;
};

interface ConsentRecord {
  consent_type_id: number;
  status: 'pending' | 'obtained' | 'declined' | 'withdrawn';
  consent_date?: string;
  notes?: string;
}

interface DocumentRecord {
  file_name: string;
  document_type_id: number;
  folder_category: string;
  description?: string;
  file?: File;
  uploaded_file_url?: string;
}

export function ConsentDocumentationStep({ data, onComplete, onPrevious, onDataChange }: ConsentDocumentationStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consentTypes, setConsentTypes] = useState<ConsentType[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  
  // Initialize state from props only once
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>(() => data.consent_records || []);
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => data.documents || []);

  // Memoize available consent types to prevent re-computation on every render
  const availableConsentTypes = useMemo(() => {
    const usedTypeIds = consentRecords.map(cr => cr.consent_type_id);
    return consentTypes.filter(ct => !usedTypeIds.includes(ct.id));
  }, [consentTypes, consentRecords]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      consent_records: data.consent_records || [],
      documents: data.documents || []
    }
  });

  // Load consent types and document types
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load consent types
        const consentTypesData = await apiRequest({
          url: 'v1/optionlists/consent-types/',
          method: 'GET'
        });
        
        // Load document types
        const documentTypesData = await apiRequest({
          url: 'v1/optionlists/document-types/',
          method: 'GET'
        });

        setConsentTypes(consentTypesData || []);
        setDocumentTypes(documentTypesData || []);

        // Initialize consent records with required consent types only if none exist
        setConsentRecords(prevRecords => {
          if (prevRecords.length === 0) {
            const requiredConsents = [
              { consent_type_id: consentTypesData.find((ct: any) => ct.slug === 'service-delivery')?.id, status: 'pending' },
              { consent_type_id: consentTypesData.find((ct: any) => ct.slug === 'information-sharing')?.id, status: 'pending' }
            ].filter(consent => consent.consent_type_id);
            
            return requiredConsents as ConsentRecord[];
          }
          return prevRecords;
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Only run once on mount

  const handleConsentStatusChange = useCallback((index: number, status: string) => {
    const updatedConsents = [...consentRecords];
    updatedConsents[index].status = status as any;
    
    // If obtaining consent, set today's date
    if (status === 'obtained') {
      updatedConsents[index].consent_date = new Date().toISOString().split('T')[0];
    } else if (status === 'pending') {
      updatedConsents[index].consent_date = undefined;
    }
    
    setConsentRecords(updatedConsents);
    onDataChange({ consent_records: updatedConsents });
  }, [consentRecords, onDataChange]);

  // Debounced version for notes to avoid excessive API calls
  const debouncedNotesChange = useCallback(
    debounce((updatedConsents: ConsentRecord[]) => {
      onDataChange({ consent_records: updatedConsents });
    }, 300),
    [onDataChange]
  );

  const handleConsentNotesChange = (index: number, notes: string) => {
    const updatedConsents = [...consentRecords];
    updatedConsents[index].notes = notes;
    setConsentRecords(updatedConsents);
    debouncedNotesChange(updatedConsents);
  };

  const addConsentType = useCallback((consentTypeId: number) => {
    const newConsent: ConsentRecord = {
      consent_type_id: consentTypeId,
      status: 'pending'
    };
    const updatedConsents = [...consentRecords, newConsent];
    setConsentRecords(updatedConsents);
    onDataChange({ consent_records: updatedConsents });
  }, [consentRecords, onDataChange]);

  const removeConsentRecord = useCallback((index: number) => {
    const updatedConsents = consentRecords.filter((_, i) => i !== index);
    setConsentRecords(updatedConsents);
    onDataChange({ consent_records: updatedConsents });
  }, [consentRecords, onDataChange]);

  const addDocument = useCallback(() => {
    const newDoc: DocumentRecord = {
      file_name: '',
      document_type_id: 0,
      folder_category: 'consent-forms',
      description: '',
      file: undefined,
      uploaded_file_url: undefined
    };
    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    onDataChange({ documents: updatedDocs });
  }, [documents, onDataChange]);

  const handleFileUpload = useCallback(async (index: number, file: File) => {
    try {
      const updatedDocs = [...documents];
      updatedDocs[index].file = file;
      updatedDocs[index].file_name = file.name;
      setDocuments(updatedDocs);
      onDataChange({ documents: updatedDocs });
      
      // TODO: Implement proper file upload handling
      // For now, just store the file reference locally without uploading
      console.log('File selected for upload (upload disabled):', file.name);
      
    } catch (error) {
      console.error('Failed to handle file:', error);
      // Remove the file if handling failed
      const updatedDocs = [...documents];
      updatedDocs[index].file = undefined;
      updatedDocs[index].file_name = '';
      setDocuments(updatedDocs);
    }
  }, [documents, onDataChange]);

  const updateDocument = useCallback((index: number, field: keyof DocumentRecord, value: any) => {
    const updatedDocs = [...documents];
    (updatedDocs[index] as any)[field] = value;
    setDocuments(updatedDocs);
    onDataChange({ documents: updatedDocs });
  }, [documents, onDataChange]);

  const removeDocument = useCallback((index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    onDataChange({ documents: updatedDocs });
  }, [documents, onDataChange]);

  const getConsentStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'obtained': return <Check className="h-4 w-4 text-green-600" />;
      case 'declined': return <X className="h-4 w-4 text-red-600" />;
      case 'withdrawn': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  const getConsentStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'obtained': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }, []);

  const onSubmit = useCallback((formData: any) => {
    const completeData = {
      consent_records: consentRecords,
      documents: documents
    };
    onComplete(completeData);
  }, [consentRecords, documents, onComplete]);

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
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
      <Card className="border-0 shadow-lg bg-white rounded-3xl">
        <CardHeader className="pb-8">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-gray-900">Consent Forms & Documentation</span>
          </CardTitle>
          <CardDescription className="text-gray-600 text-base leading-relaxed">
            Manage consent forms and upload supporting documentation for this referral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-8 pb-8">
          
          {/* Consent Management Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Consent Forms</h3>
              <Select onValueChange={(value) => addConsentType(parseInt(value))}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Add consent type..." />
                </SelectTrigger>
                <SelectContent>
                  {availableConsentTypes.map((consentType) => (
                    <SelectItem key={consentType.id} value={consentType.id.toString()}>
                      {consentType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {consentRecords.map((consent, index) => {
                const consentType = consentTypes.find(ct => ct.id === consent.consent_type_id);
                if (!consentType) return null;

                return (
                  <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{consentType.label}</h4>
                        <p className="text-sm text-gray-600">{consentType.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConsentRecord(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <Select 
                          value={consent.status} 
                          onValueChange={(value) => handleConsentStatusChange(index, value)}
                        >
                          <SelectTrigger>
                            <div className="flex items-center space-x-2">
                              {getConsentStatusIcon(consent.status)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="obtained">Obtained</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {consent.status === 'obtained' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Consent Date</Label>
                          <Input
                            type="date"
                            value={consent.consent_date || ''}
                            onChange={(e) => {
                              const updatedConsents = [...consentRecords];
                              updatedConsents[index].consent_date = e.target.value;
                              setConsentRecords(updatedConsents);
                              // Use immediate update for date changes (not frequent like typing)
                              onDataChange({ consent_records: updatedConsents });
                            }}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Badge className={`${getConsentStatusColor(consent.status)} border`}>
                          {consent.status.charAt(0).toUpperCase() + consent.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Notes</Label>
                      <Textarea
                        placeholder="Additional notes about this consent..."
                        value={consent.notes || ''}
                        onChange={(e) => handleConsentNotesChange(index, e.target.value)}
                        className="h-20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
              <Button type="button" onClick={addDocument} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            <div className="space-y-4">
              {documents.map((doc, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="h-5 w-5 text-gray-400 mt-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Document Type</Label>
                      <Select 
                        value={doc.document_type_id.toString()} 
                        onValueChange={(value) => updateDocument(index, 'document_type_id', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((docType) => (
                            <SelectItem key={docType.id} value={docType.id.toString()}>
                              {docType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Upload File</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(index, file);
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {doc.uploaded_file_url && (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                        )}
                      </div>
                      {doc.file_name && (
                        <p className="text-sm text-gray-600">Selected: {doc.file_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      placeholder="Brief description of this document..."
                      value={doc.description || ''}
                      onChange={(e) => updateDocument(index, 'description', e.target.value)}
                      className="h-16"
                    />
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No documents added yet</p>
                  <p className="text-sm">Click "Add Document" to upload supporting files</p>
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPrevious}
          className="flex items-center space-x-2 h-12 px-6 text-base border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Client Info</span>
        </Button>
        <Button 
          type="submit" 
          className="flex items-center space-x-2 h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 hover:shadow-lg rounded-xl transition-all duration-200 ease-out hover:-translate-y-0.5"
        >
          <span>Continue to Referral Details</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}