import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { components } from "@/types/openapi";
import axiosInstance from "@/services/axios-client";
import { getApiPath } from "@/lib/apiConfig";
import { DocumentService } from "@/services/document-service";

type DocumentCreateSchema = components['schemas']['DocumentCreateSchema'];

// Extended form type that includes UI fields not in the API schema
interface DocumentFormData extends Partial<DocumentCreateSchema> {
  title?: string;
  description?: string;
}

type Document = components["schemas"]["DocumentSchema"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentCreated?: (doc: Document) => void;
  onDocumentUploading?: (doc: Document, uploading: boolean) => void;
}

export default function DocumentCreateDialog({ open, onOpenChange, onDocumentCreated, onDocumentUploading }: Props) {
  const [form, setForm] = useState<DocumentFormData>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let sharepointUrl = '';
    let fileName = '';
    
    if (!file) {
      setError("Please select a file to upload");
      setLoading(false);
      return;
    }
    
    try {
      fileName = file.name;
      
      // 1. Create document record in database first
      const payload: DocumentCreateSchema = {
        ...form,
        file_name: fileName,
        // Store title and description in metadata since they're not direct fields in the schema
        metadata: {
          title: (form as DocumentFormData).title || fileName,
          description: (form as DocumentFormData).description || 'Uploaded document'
        },
        // Required fields from schema
        type_id: form.type_id || null, // Default to null if not provided
        status: 'uploading' as const
      };
      
      console.log("Creating document with data:", payload);
      
      // Create optimistic document for immediate feedback
      const tempId = `temp-${Date.now()}`;
      const tempDoc = {
        id: tempId,
        file_name: fileName,
        sharepoint_id: '',
        type_id: form.type_id || null,
        status_id: null,
        metadata: payload.metadata
      };
      
      // Add temporary document and mark as uploading
      onDocumentCreated?.(tempDoc);
      onDocumentUploading?.(tempDoc, true);
      
      try {
        // 2. Create document record in database
        const document = await DocumentService.createDocument(payload);
        console.log("Document created in database:", document);
        
        // 3. Upload file via backend API (backend handles SharePoint integration)
        const uploadResult = await DocumentService.uploadDocumentFile(document.id, file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'File upload failed');
        }
        
        console.log("File uploaded successfully:", uploadResult);
        
        // Stop uploading state for temp document
        onDocumentUploading?.(tempDoc, false);
        
        // Replace temp document with real one (same position in list)
        const realDoc = { ...document, tempId }; // Include tempId for replacement logic
        onDocumentCreated?.(realDoc);
        
        console.log("Document created and uploaded successfully");
        setForm({});
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onOpenChange(false);
      } catch (apiError) {
        // Remove the temporary document on failure
        onDocumentUploading?.(tempDoc, false);
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (err: any) {
      console.error("Document creation error:", err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Create New Document</DialogTitle>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={form.title || ""} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" value={form.description || ""} onChange={handleChange} />
          </div>
          {/* Add more metadata fields as needed */}
          <div>
            <Label htmlFor="file">File</Label>
            <Input id="file" name="file" type="file" onChange={handleFileChange} ref={fileInputRef} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Uploading..." : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
