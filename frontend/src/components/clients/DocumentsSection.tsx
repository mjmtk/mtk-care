import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, AlertCircle, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSharePointService } from '@/services/sharepoint-service';
import { useMockSharePointService } from '@/services/mock-sharepoint-service';
import { DocumentService, Document } from '@/services/document-service';
import type { SharePointFile } from '@/services/sharepoint-service';

interface DocumentsSectionProps {
  clientId: string;
  episodeId?: string;
}

export function DocumentsSection({ clientId, episodeId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sharePointFiles, setSharePointFiles] = useState<SharePointFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const sharePointService = useSharePointService();
  const mockSharePointService = useMockSharePointService();
  
  // Use mock service if real SharePoint is not available
  const activeSharePointService = sharePointService || mockSharePointService;

  // Load documents and SharePoint files
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load database documents
      const dbDocuments = await DocumentService.listDocuments(clientId);
      setDocuments(dbDocuments);
      
      // Load SharePoint files if service is available
      if (activeSharePointService) {
        try {
          const spFiles = await activeSharePointService.listClientDocuments(clientId, episodeId);
          setSharePointFiles(spFiles);
        } catch (spError) {
          console.warn('SharePoint files could not be loaded:', spError);
          // Don't show error for SharePoint - it's optional
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [clientId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setError(null);
      setUploadSuccess(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    setError(null);
    setUploadSuccess(null);
    
    // Create optimistic document for instant UI update
    const optimisticDocument: Document = {
      id: 'temp-' + Date.now(),
      file_name: uploadFile.name,
      original_filename: uploadFile.name,
      file_size: uploadFile.size,
      mime_type: DocumentService.getMimeType(uploadFile),
      client_id: clientId,
      referral_id: episodeId,
      folder_category: 'general',
      status: 'uploading',
      is_confidential: false,
      access_level: 'internal',
      version: '1.0',
      is_latest_version: true,
      tags: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to document list immediately for instant feedback
    setDocuments(prev => [optimisticDocument, ...prev]);
    
    try {
      // Create document record in database
      const documentData = {
        file_name: uploadFile.name,
        original_filename: uploadFile.name,
        file_size: uploadFile.size,
        mime_type: DocumentService.getMimeType(uploadFile),
        client_id: clientId,
        referral_id: episodeId,
        folder_category: 'general',
        status: 'uploading' as const
      };
      
      const document = await DocumentService.createDocument(documentData);
      
      // Update the optimistic document with real ID
      setDocuments(prev => prev.map(doc => 
        doc.id === optimisticDocument.id ? { ...document, status: 'uploading' } : doc
      ));
      
      // Upload to SharePoint if service is available
      if (activeSharePointService) {
        try {
          const uploadResult = await activeSharePointService.uploadDocument(clientId, uploadFile, episodeId);
          
          if (uploadResult.success) {
            // Mark as uploaded in database
            const updatedDocument = await DocumentService.markDocumentUploaded(
              document.id, 
              uploadResult.file?.UniqueId, 
              uploadResult.file?.ServerRelativeUrl
            );
            
            // Update the document in the list
            setDocuments(prev => prev.map(doc => 
              doc.id === document.id ? updatedDocument : doc
            ));
            
            const serviceType = sharePointService ? 'SharePoint' : 'Mock SharePoint';
            setUploadSuccess(`File uploaded successfully to ${serviceType}!`);
          } else {
            // Mark as failed in database
            const failedDocument = await DocumentService.markDocumentFailed(document.id, uploadResult.error || 'Upload failed');
            
            // Update the document in the list
            setDocuments(prev => prev.map(doc => 
              doc.id === document.id ? failedDocument : doc
            ));
            
            throw new Error(uploadResult.error || 'SharePoint upload failed');
          }
        } catch (spError: any) {
          // Mark as failed in database
          const failedDocument = await DocumentService.markDocumentFailed(document.id, spError.message);
          
          // Update the document in the list
          setDocuments(prev => prev.map(doc => 
            doc.id === document.id ? failedDocument : doc
          ));
          
          throw spError;
        }
      } else {
        // No SharePoint service - just mark as uploaded
        const updatedDocument = await DocumentService.markDocumentUploaded(document.id);
        
        // Update the document in the list
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id ? updatedDocument : doc
        ));
        
        setUploadSuccess('Document record created (SharePoint not available)');
      }
      
      // Clear form
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh SharePoint files
      if (activeSharePointService) {
        try {
          const spFiles = await activeSharePointService.listClientDocuments(clientId, episodeId);
          setSharePointFiles(spFiles);
        } catch (spError) {
          console.warn('Could not refresh SharePoint files:', spError);
        }
      }
      
    } catch (err: any) {
      // Remove the optimistic document or mark it as failed
      setDocuments(prev => prev.filter(doc => doc.id !== optimisticDocument.id));
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.file_name}"?`)) {
      return;
    }
    
    try {
      // Delete from SharePoint if possible
      if (activeSharePointService && document.sharepoint_id) {
        try {
          await activeSharePointService.deleteDocument(clientId, document.file_name, episodeId);
        } catch (spError) {
          console.warn('Could not delete from SharePoint:', spError);
        }
      }
      
      // Delete from database
      await DocumentService.deleteDocument(document.id);
      await loadDocuments();
      
    } catch (err: any) {
      setError(err?.message || 'Failed to delete document');
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'uploaded': return 'default';
      case 'uploading': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <CheckCircle className="h-3 w-3" />;
      case 'uploading': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'failed': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium">Documents</h3>
      </div>
      
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Document</CardTitle>
          <CardDescription>
            Upload documents for client {clientId}
            {episodeId && ` → referrals/${episodeId}`}
            {!episodeId && ' → general'}
            {sharePointService ? ' (SharePoint)' : ' (Mock SharePoint - Testing Mode)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input 
              ref={fileInputRef}
              type="file" 
              onChange={handleFileChange} 
              disabled={uploading}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {uploadSuccess && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{uploadSuccess}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document List</CardTitle>
          <CardDescription>
            {documents.length} document(s) found for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents found</p>
              <p className="text-sm">Upload a document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{doc.file_name}</span>
                      <Badge variant={getStatusVariant(doc.status)} className="flex items-center gap-1">
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {DocumentService.formatFileSize(doc.file_size)} • 
                      {new Date(doc.created_at).toLocaleDateString()}
                      {doc.description && ` • ${doc.description}`}
                    </div>
                    {doc.upload_error && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {doc.upload_error}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.sharepoint_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.sharepoint_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(doc)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* SharePoint Files (if available but not in database) */}
      {sharePointFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SharePoint Files (Not in Database)</CardTitle>
            <CardDescription>
              Files found in SharePoint but not tracked in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sharePointFiles
                .filter(spFile => !documents.some(doc => doc.file_name === spFile.Name))
                .map((file) => (
                  <div key={file.UniqueId} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span>{file.Name}</span>
                      <Badge variant="outline">SharePoint Only</Badge>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.ServerRelativeUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}