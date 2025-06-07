import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import axiosInstance from "@/services/axios-client";
import { getApiPath } from "@/lib/apiConfig";
import { FileText, ExternalLink, Edit, Trash2, Plus } from "lucide-react";
import DocumentCreateDialog from "./DocumentCreateDialog";

import type { components } from "@/types/openapi";
type Document = components["schemas"]["DocumentSchema"];

// Helper function to construct SharePoint URLs
function getSharePointOptions(sharePointId: string) {
  console.log('Processing SharePoint URL:', sharePointId); // Debug log
  
  // Get SharePoint domain first
  const sharePointDomain = process.env.NEXT_PUBLIC_SHAREPOINT_DOMAIN || 'https://manaakitech.sharepoint.com';
  
  // If it's already a full URL, return as-is
  if (sharePointId.startsWith('http://') || sharePointId.startsWith('https://')) {
    return { 
      libraryUrl: `${sharePointDomain}/sites/client_docs/Shared Documents/Forms/AllItems.aspx`,
      fileName: 'Unknown',
      debugInfo: 'Already full URL'
    };
  }
  
  let fileName = '';
  
  // If it's a mock URL (auth bypass mode), extract filename
  if (sharePointId.startsWith('/mock-sharepoint/documents/')) {
    fileName = sharePointId.replace('/mock-sharepoint/documents/', '');
  }
  // For SharePoint ServerRelativeUrl
  else if (sharePointId.startsWith('/sites/')) {
    fileName = sharePointId.split('/').pop() || '';
  }
  // For other relative paths
  else {
    fileName = sharePointId.split('/').pop() || sharePointId;
  }
  
  // Always just open the SharePoint library - most reliable approach
  const libraryUrl = `${sharePointDomain}/sites/client_docs/Shared Documents/Forms/AllItems.aspx`;
  
  const debugInfo = `FileName: ${fileName}, OriginalPath: ${sharePointId}`;
  
  console.log('SharePoint options:', { libraryUrl, fileName, debugInfo }); // Debug log
  return { libraryUrl, fileName, debugInfo };
}

// Skeleton component for loading state
function DocumentTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>SharePoint</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-16" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Document | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());

  // Function to add a new document to the list
  const addDocument = (newDoc: Document & { tempId?: string }) => {
    setDocuments(prev => {
      // If this is a replacement for a temp document
      if (newDoc.tempId) {
        const tempIndex = prev.findIndex(doc => doc.id === newDoc.tempId);
        if (tempIndex !== -1) {
          // Replace the temp document at the same position
          const newList = [...prev];
          const { tempId, ...finalDoc } = newDoc as any; // Remove tempId from final doc
          newList[tempIndex] = finalDoc;
          return newList;
        }
      }
      
      // Otherwise, check for existing document with same ID and replace/add
      const filtered = prev.filter(doc => doc.id !== newDoc.id);
      return [newDoc, ...filtered];
    });
  };

  // Function to remove a document from the list
  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  // Function to mark a document as uploading
  const setDocumentUploading = (docId: string, uploading: boolean) => {
    setUploadingDocuments(prev => {
      const newSet = new Set(prev);
      if (uploading) {
        newSet.add(docId);
      } else {
        newSet.delete(docId);
      }
      return newSet;
    });
  };

  const clearMockDocuments = async () => {
    const mockDocs = documents.filter(doc => doc.sharepoint_id?.startsWith('/mock-sharepoint/'));
    
    for (const doc of mockDocs) {
      try {
        await axiosInstance.delete(getApiPath(`v1/documents/${doc.id}/`));
      } catch (error) {
        console.error('Failed to delete mock document:', doc.id, error);
      }
    }
    
    // Refresh the list
    setDocuments(docs => docs.filter(doc => !doc.sharepoint_id?.startsWith('/mock-sharepoint/')));
  };

  useEffect(() => {
    setError(null);
    axiosInstance.get(getApiPath("v1/documents/"))
      .then((res) => {
        console.log("Documents fetched:", res.data);
        setDocuments(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Documents fetch error:", err);
        setError(`Failed to fetch documents: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) => {
    axiosInstance.delete(getApiPath(`v1/documents/${id}/`))
      .then(() => {
        setDocuments((docs) => docs.filter((d) => d.id !== id));
      })
      .catch(() => {
        setError("Failed to delete document.");
      })
      .finally(() => setShowDelete(null));
  };

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h2 className="text-xl font-bold">Documents</h2>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
            {documents.some(doc => doc.sharepoint_id?.startsWith('/mock-sharepoint/')) && (
              <Button variant="outline" size="sm" onClick={clearMockDocuments}>
                Clear Mock Data
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <a href="https://manaakitech.sharepoint.com/sites/client_docs/Shared Documents/Forms/AllItems.aspx" target="_blank" rel="noopener noreferrer">
                Open SharePoint Library
              </a>
            </Button>
            {process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true' && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Auth Bypass Mode - Files won't upload to SharePoint
              </span>
            )}
          </div>
        </div>
      
      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading state */}
      {loading && <DocumentTableSkeleton />}
      
      {/* Content state */}
      {!loading && !error && (
        <>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No documents found</h3>
              <p className="text-sm text-muted-foreground">Upload your first document to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SharePoint</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className={uploadingDocuments.has(doc.id) ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {uploadingDocuments.has(doc.id) ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{doc.file_name}</span>
                        {uploadingDocuments.has(doc.id) && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded animate-pulse">Uploading...</span>
                        )}
                        {doc.sharepoint_id?.startsWith('/mock-sharepoint/') && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Mock Data</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{doc.type_id || "Unknown"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{doc.status_id ?? "No status"}</span>
                    </TableCell>
                    <TableCell>
                      {doc.sharepoint_id ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" asChild>
                              <a href={getSharePointOptions(doc.sharepoint_id).libraryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                Open Library
                              </a>
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Look for: {getSharePointOptions(doc.sharepoint_id).fileName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not available</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelected(doc)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogTitle>Edit Document</DialogTitle>
                            <div className="text-muted-foreground">Edit form coming soon.</div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => setShowDelete(doc.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                        {showDelete === doc.id && (
                          <Dialog open onOpenChange={() => setShowDelete(null)}>
                            <DialogContent>
                              <DialogTitle>Confirm Delete</DialogTitle>
                              <p className="text-sm text-muted-foreground mb-4">
                                Are you sure you want to delete "{doc.file_name}"? This action cannot be undone.
                              </p>
                              <div className="flex gap-2">
                                <Button variant="destructive" onClick={() => handleDelete(doc.id)}>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                                <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

        {/* Upload Dialog */}
        <DocumentCreateDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
          onDocumentCreated={addDocument}
          onDocumentUploading={(doc, uploading) => setDocumentUploading(doc.id, uploading)}
        />
    </div>
  );
}
