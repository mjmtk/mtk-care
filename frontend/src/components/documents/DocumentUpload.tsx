import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DocumentService } from '@/services/document-service';

export interface DocumentRecord {
  id?: string;
  file_name: string;
  document_type_id?: number;
  folder_category: string;
  description?: string;
  file?: File;
  uploaded_file_url?: string;
  status?: 'pending' | 'uploading' | 'uploaded' | 'failed';
  upload_error?: string;
  sharepoint_id?: string;
  sharepoint_url?: string;
}

interface DocumentUploadProps {
  clientId: string;
  referralId?: string;
  documents: DocumentRecord[];
  onDocumentsChange: (documents: DocumentRecord[]) => void;
  documentTypes?: Array<{ id: number; label: string; slug: string; description?: string }>;
  allowedCategories?: string[];
  showDescription?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string;
  className?: string;
}

export function DocumentUpload({
  clientId,
  referralId,
  documents,
  onDocumentsChange,
  documentTypes = [],
  allowedCategories = ['consent-forms', 'assessments', 'care-plans', 'general'],
  showDescription = true,
  maxFiles = 10,
  acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  className = ''
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  

  const addDocument = () => {
    if (documents.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newDoc: DocumentRecord = {
      file_name: '',
      document_type_id: documentTypes[0]?.id || 0,
      folder_category: allowedCategories[0] || 'general',
      description: '',
      status: 'pending'
    };
    
    onDocumentsChange([...documents, newDoc]);
    setError(null);
  };

  const removeDocument = async (index: number) => {
    const document = documents[index];
    
    // If document was uploaded, delete from SharePoint and database
    if (document.id && document.status === 'uploaded') {
      try {
        // Note: SharePoint deletion is handled by the backend when document is deleted
        
        // Delete from database
        if (document.id && !document.id.startsWith('temp-')) {
          await DocumentService.deleteDocument(document.id);
        }
      } catch (error) {
        console.warn('Failed to delete document:', error);
      }
    }
    
    const newDocuments = documents.filter((_, i) => i !== index);
    onDocumentsChange(newDocuments);
    
    // Clear file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    const updatedDocs = [...documents];
    updatedDocs[index] = {
      ...updatedDocs[index],
      file,
      file_name: file.name,
      status: 'uploading'
    };
    onDocumentsChange(updatedDocs);

    setUploading(prev => new Set(prev).add(index));
    setError(null);

    try {
      // Create document record in database
      const documentData = {
        file_name: file.name,
        original_filename: file.name,
        file_size: file.size,
        mime_type: DocumentService.getMimeType(file),
        client_id: clientId,
        referral_id: referralId,
        folder_category: updatedDocs[index].folder_category,
        type_id: updatedDocs[index].document_type_id || undefined,
        description: updatedDocs[index].description,
        status: 'uploading' as const
      };

      const document = await DocumentService.createDocument(documentData);

      // Update with database ID
      updatedDocs[index] = {
        ...updatedDocs[index],
        id: document.id,
        status: 'uploading'
      };
      onDocumentsChange(updatedDocs);

      // Upload via backend API (backend handles SharePoint integration)
      try {
        const uploadResult = await DocumentService.uploadDocumentFile(document.id, file);
        
        if (uploadResult.success) {
          updatedDocs[index] = {
            ...updatedDocs[index],
            status: 'uploaded',
            sharepoint_id: uploadResult.sharepoint_id,
            sharepoint_url: uploadResult.sharepoint_url
          };
          onDocumentsChange(updatedDocs);
        } else {
          updatedDocs[index] = {
            ...updatedDocs[index],
            status: 'failed',
            upload_error: uploadResult.error || 'Upload failed'
          };
          onDocumentsChange(updatedDocs);
        }
      } catch (error) {
        console.error('Document upload error:', error);
        updatedDocs[index] = {
          ...updatedDocs[index],
          status: 'failed',
          upload_error: 'Upload failed: Network error'
        };
        onDocumentsChange(updatedDocs);
      }

    } catch (err: any) {
      console.error('Upload failed:', err);
      
      updatedDocs[index] = {
        ...updatedDocs[index],
        status: 'failed',
        upload_error: err?.message || 'Upload failed'
      };
      onDocumentsChange(updatedDocs);
      
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const updateDocument = (index: number, field: keyof DocumentRecord, value: any) => {
    const updatedDocs = [...documents];
    (updatedDocs[index] as any)[field] = value;
    onDocumentsChange(updatedDocs);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'uploaded': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'uploaded': return 'default';
      case 'uploading': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
        <Button 
          type="button" 
          onClick={addDocument} 
          variant="outline"
          disabled={documents.length >= maxFiles}
        >
          <Upload className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {documents.map((doc, index) => (
          <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(doc.status)}
                <span className="text-sm font-medium">Document {index + 1}</span>
                <Badge variant={getStatusVariant(doc.status)}>
                  {doc.status || 'pending'}
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(index)}
                className="text-gray-400 hover:text-red-600"
                disabled={uploading.has(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Document Type</Label>
                  <Select 
                    value={doc.document_type_id?.toString() || ''} 
                    onValueChange={(value) => updateDocument(index, 'document_type_id', parseInt(value))}
                    disabled={uploading.has(index)}
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
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload File</Label>
                <div className="space-y-2">
                  <input
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    type="file"
                    accept={acceptedFileTypes}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(index, file);
                      }
                    }}
                    disabled={uploading.has(index)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  {doc.file_name && (
                    <p className="text-sm text-gray-600">
                      {doc.status === 'uploading' ? 'Uploading...' : 'Selected:'} {doc.file_name}
                    </p>
                  )}
                  {doc.upload_error && (
                    <p className="text-sm text-red-600">Error: {doc.upload_error}</p>
                  )}
                </div>
              </div>
            </div>

            {showDescription && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  placeholder="Brief description of this document..."
                  value={doc.description || ''}
                  onChange={(e) => updateDocument(index, 'description', e.target.value)}
                  className="h-16"
                  disabled={uploading.has(index)}
                />
              </div>
            )}

            {doc.sharepoint_url && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href={doc.sharepoint_url} target="_blank" rel="noopener noreferrer">
                    View in SharePoint
                  </a>
                </Button>
              </div>
            )}
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

      {documents.length > 0 && (
        <div className="text-sm text-gray-500">
          {documents.length} of {maxFiles} documents added
          {referralId && (
            <span className="ml-2">
              • Files will be stored in: /{clientId}/referrals/{referralId}/
            </span>
          )}
          {!referralId && (
            <span className="ml-2">
              • Files will be stored in: /{clientId}/general/[category]/
            </span>
          )}
        </div>
      )}
    </div>
  );
}