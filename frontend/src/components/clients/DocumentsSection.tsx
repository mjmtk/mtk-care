"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { FileText, Upload, Filter, Search, X, FileIcon, CheckCircle2, Download, Trash2, Eye, Edit2, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

import { useSharePointService } from '@/services/sharepoint-service'
import { DocumentService, Document, DocumentCreateData } from '@/services/document-service'
import type { SharePointFile } from '@/services/sharepoint-service'

// TODO: Replace with OptionList integration for document types
const documentTypes = [
  "Consent Form",
  "Health Record", 
  "Identification",
  "Referral",
  "Assessment",
  "Treatment Plan",
  "Progress Note",
  "Discharge Summary",
  "Other",
]

// Map document types to folder categories
const documentTypeToCategory: Record<string, string> = {
  "Consent Form": "consent_form",
  "Health Record": "medical_record",
  "Identification": "id_document",
  "Referral": "referral_letter",
  "Assessment": "assessment",
  "Treatment Plan": "care_plan",
  "Progress Note": "general",
  "Discharge Summary": "general",
  "Other": "other",
}

interface DocumentsSectionProps {
  clientId: string;
  clientName?: string;
  referralId?: string;
}

interface UploadFileData {
  file: File;
  type: string;
  referralId?: string;
  description?: string;
  isConfidential: boolean;
}

export function DocumentsSection({ clientId, clientName = "Client", referralId }: DocumentsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadFiles, setUploadFiles] = useState<UploadFileData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [editMode, setEditMode] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  const sharePointService = useSharePointService()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents
  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await DocumentService.listDocuments(clientId, referralId)
      setDocuments(docs)
    } catch (error: any) {
      toast.error("Error loading documents", {
        description: error.message || "Failed to load documents",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [clientId, referralId])

  // Filter documents based on search term and selected type
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.type?.label && doc.type.label.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Map folder categories back to display types for filtering
    const categoryToType: Record<string, string> = {
      'consent_form': 'Consent Form',
      'medical_record': 'Health Record',
      'id_document': 'Identification',
      'referral_letter': 'Referral',
      'assessment': 'Assessment',
      'care_plan': 'Treatment Plan',
      'general': 'Progress Note',
      'other': 'Other',
    }
    
    const docDisplayType = doc.type?.label || categoryToType[doc.folder_category] || 'Other'
    const matchesType = selectedType === "all" || docDisplayType === selectedType
    
    return matchesSearch && matchesType
  })

  // Group documents by status
  const documentsByStatus = {
    all: filteredDocuments,
    recent: filteredDocuments.filter(doc => {
      const uploadDate = new Date(doc.uploaded_at || doc.created_at)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return uploadDate > sevenDaysAgo
    }),
    pending: filteredDocuments.filter(doc => doc.status === 'pending' || doc.status === 'uploading'),
    verified: filteredDocuments.filter(doc => doc.status === 'uploaded'),
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      const newFiles = filesArray.map(file => ({
        file,
        type: "Other",
        referralId: referralId,
        isConfidential: false,
      }))
      setUploadFiles((prev) => [...prev, ...newFiles])
    }
  }

  // Handle file drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files)
      const newFiles = filesArray.map(file => ({
        file,
        type: "Other",
        referralId: referralId,
        isConfidential: false,
      }))
      setUploadFiles((prev) => [...prev, ...newFiles])
    }
  }

  // Remove file from upload list
  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Update file metadata
  const updateFileData = (index: number, updates: Partial<UploadFileData>) => {
    setUploadFiles((prev) => prev.map((file, i) => 
      i === index ? { ...file, ...updates } : file
    ))
  }

  // Handle form submission for document upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      const uploadPromises = uploadFiles.map(async (fileData) => {
        // Create document record
        const documentData: DocumentCreateData = {
          file_name: fileData.file.name,
          original_filename: fileData.file.name,
          file_size: fileData.file.size,
          mime_type: fileData.file.type || 'application/octet-stream',
          client_id: clientId,
          referral_id: fileData.referralId,
          folder_category: documentTypeToCategory[fileData.type] || 'other',
          description: fileData.description,
          is_confidential: fileData.isConfidential,
          status: 'uploading' as const,
        }

        // Create document in database
        const document = await DocumentService.createDocument(documentData)

        // Upload to SharePoint
        if (sharePointService) {
          const uploadResult = await sharePointService.uploadDocument(
            clientId,
            fileData.file,
            fileData.referralId
          )

          if (uploadResult.success && uploadResult.file) {
            // Update document with SharePoint info
            await DocumentService.updateDocument(document.id, {
              status: 'uploaded',
              sharepoint_unique_id: uploadResult.file.UniqueId,
              sharepoint_server_relative_url: uploadResult.file.ServerRelativeUrl,
              sharepoint_etag: uploadResult.file.ETag,
              uploaded_at: new Date().toISOString(),
            })
          } else {
            throw new Error(uploadResult.error || 'Upload failed')
          }
        }

        return document
      })

      await Promise.all(uploadPromises)

      toast.success("Upload Successful", {
        description: `${uploadFiles.length} document(s) uploaded successfully.`,
      })

      setUploadSuccess(true)
      
      // Reset form after successful upload
      setTimeout(() => {
        setUploadFiles([])
        setUploadSuccess(false)
        setUploadDialogOpen(false)
        loadDocuments() // Reload documents
      }, 1500)

    } catch (error: any) {
      toast.error("Upload Failed", {
        description: error.message || "Failed to upload documents",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle document deletion
  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.file_name}"?`)) {
      return
    }

    try {
      await DocumentService.deleteDocument(document.id)
      toast.success("Document deleted", {
        description: "The document has been removed successfully.",
      })
      loadDocuments()
    } catch (error: any) {
      toast.error("Delete Failed", {
        description: error.message || "Failed to delete document",
      })
    }
  }

  // Handle document download
  const handleDownload = async (document: Document) => {
    try {
      const accessUrl = await DocumentService.getDocumentAccessUrl(document.id, 'download')
      if (accessUrl) {
        window.open(accessUrl, '_blank')
      }
    } catch (error: any) {
      toast.error("Download Failed", {
        description: error.message || "Failed to download document",
      })
    }
  }

  // Handle document preview
  const handlePreview = async (document: Document) => {
    try {
      const accessUrl = await DocumentService.getDocumentAccessUrl(document.id, 'preview')
      if (accessUrl) {
        window.open(accessUrl, '_blank')
      }
    } catch (error: any) {
      toast.error("Preview Failed", {
        description: error.message || "Failed to preview document",
      })
    }
  }

  // Handle edit metadata
  const handleEditMetadata = (document: Document) => {
    setEditingDocument(document)
    setEditDialogOpen(true)
  }

  // Handle save metadata
  const handleSaveMetadata = async (updatedData: {
    description?: string;
    folder_category?: string;
    is_confidential?: boolean;
  }) => {
    if (!editingDocument) return

    try {
      const updated = await DocumentService.updateDocument(editingDocument.id, updatedData)
      
      // Update the document in the list
      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocument.id ? { ...doc, ...updated } : doc
      ))
      
      toast.success("Metadata updated", {
        description: "Document metadata has been updated successfully.",
      })
      
      setEditDialogOpen(false)
      setEditingDocument(null)
    } catch (error: any) {
      toast.error("Update Failed", {
        description: error.message || "Failed to update document metadata",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="default">Verified</Badge>
      case 'pending':
      case 'uploading':
        return <Badge variant="outline">Pending Review</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const toggleAllDocuments = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium">Document Management</h3>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload documents for {clientName}. Documents will be stored in SharePoint.
              </DialogDescription>
            </DialogHeader>

            {uploadSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="text-xl font-medium">Upload Successful!</h3>
                <p className="text-muted-foreground">
                  {uploadFiles.length} document(s) have been uploaded successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Drag files here or click to browse</h3>
                    <p className="text-sm text-muted-foreground">Support for PDF, DOC, DOCX, JPG, PNG files</p>
                  </div>
                </div>

                {uploadFiles.length > 0 && (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4 pr-4">
                      {uploadFiles.map((fileData, index) => (
                        <Card key={index}>
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileIcon className="h-5 w-5" />
                                <CardTitle className="text-base">{fileData.file.name}</CardTitle>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Document Type</Label>
                                <Select 
                                  value={fileData.type}
                                  onValueChange={(value) => updateFileData(index, { type: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select document type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {documentTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Client Name</Label>
                                <Input 
                                  value={clientName} 
                                  disabled={!editMode}
                                  className="bg-muted"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                placeholder="Add a description (optional)"
                                value={fileData.description || ''}
                                onChange={(e) => updateFileData(index, { description: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`confidential-${index}`}
                                checked={fileData.isConfidential}
                                onCheckedChange={(checked) => 
                                  updateFileData(index, { isConfidential: checked === true })
                                }
                              />
                              <Label 
                                htmlFor={`confidential-${index}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                Mark as confidential
                              </Label>
                            </div>
                            {fileData.referralId && (
                              <div className="text-sm text-muted-foreground">
                                Will be uploaded to: referrals/{fileData.referralId}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setUploadDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploadFiles.length === 0 || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      `Upload ${uploadFiles.length} Document${uploadFiles.length > 1 ? 's' : ''}`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full md:w-[200px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All document types</SelectItem>
            {documentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="recent">Recently Uploaded</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
        </TabsList>
        
        {(['all', 'recent', 'pending', 'verified'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardHeader className="py-4">
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {tab === 'all' && 'Document Library'}
                    {tab === 'recent' && 'Recently Uploaded Documents'}
                    {tab === 'pending' && 'Documents Pending Review'}
                    {tab === 'verified' && 'Verified Documents'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{documentsByStatus[tab].length} documents</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]">
                        <Checkbox 
                          checked={selectedDocuments.size === documentsByStatus[tab].length && documentsByStatus[tab].length > 0}
                          onCheckedChange={toggleAllDocuments}
                        />
                      </TableHead>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-muted-foreground">Loading documents...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : documentsByStatus[tab].length > 0 ? (
                      documentsByStatus[tab].map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedDocuments.has(doc.id)}
                              onCheckedChange={() => toggleDocumentSelection(doc.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{doc.file_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const categoryToType: Record<string, string> = {
                                'consent_form': 'Consent Form',
                                'medical_record': 'Health Record',
                                'id_document': 'Identification',
                                'referral_letter': 'Referral',
                                'assessment': 'Assessment',
                                'care_plan': 'Treatment Plan',
                                'general': 'Progress Note',
                                'other': 'Other',
                              }
                              return doc.type?.label || categoryToType[doc.folder_category] || 'Other'
                            })()}
                          </TableCell>
                          <TableCell>
                            {doc.referral_id ? (
                              <span className="text-sm">
                                <Badge variant="outline" className="text-xs">Referral</Badge>
                              </span>
                            ) : (
                              <span className="text-sm">
                                <Badge variant="outline" className="text-xs">General</Badge>
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePreview(doc)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Document
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditMetadata(doc)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit Metadata
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(doc)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No documents found</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchTerm("")
                                setSelectedType("all")
                              }}
                            >
                              Clear filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Metadata Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document Metadata</DialogTitle>
            <DialogDescription>
              Update the metadata for "{editingDocument?.file_name}"
            </DialogDescription>
          </DialogHeader>
          
          {editingDocument && (
            <EditMetadataForm
              document={editingDocument}
              onSave={handleSaveMetadata}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Edit Metadata Form Component
interface EditMetadataFormProps {
  document: Document;
  onSave: (data: { description?: string; folder_category?: string; is_confidential?: boolean }) => void;
  onCancel: () => void;
}

function EditMetadataForm({ document, onSave, onCancel }: EditMetadataFormProps) {
  const [description, setDescription] = useState(document.description || '')
  const [folderCategory, setFolderCategory] = useState(document.folder_category)
  const [isConfidential, setIsConfidential] = useState(document.is_confidential)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await onSave({
        description: description.trim() || undefined,
        folder_category: folderCategory,
        is_confidential: isConfidential,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for this document"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="folder-category">Document Type</Label>
        <Select value={folderCategory} onValueChange={setFolderCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(documentTypeToCategory).map(([type, category]) => (
              <SelectItem key={category} value={category}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="confidential"
          checked={isConfidential}
          onCheckedChange={(checked) => setIsConfidential(checked === true)}
        />
        <Label htmlFor="confidential" className="text-sm font-normal cursor-pointer">
          Mark as confidential
        </Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}