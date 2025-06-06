import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { usePnP } from "@/providers/PnpSharePointProvider";
import { components } from "@/types/openapi";

type DocumentCreateSchema = components['schemas']['DocumentCreateSchema'];

// Extended form type that includes UI fields not in the API schema
interface DocumentFormData extends Partial<DocumentCreateSchema> {
  title?: string;
  description?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentCreateDialog({ open, onOpenChange }: Props) {
  const sp = usePnP();
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
    
    const isAuthBypassMode = process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true';
    let sharepointUrl = '';
    let fileName = '';
    
    if (!file) {
      setError("Please select a file to upload");
      setLoading(false);
      return;
    }
    
    try {
      fileName = file.name;
      
      // 1. Upload the file to SharePoint (if not in bypass mode)
      if (!isAuthBypassMode && sp) {
        console.log("Uploading file to SharePoint:", fileName);
        const folderUrl = "/sites/client_docs/Shared Documents";
        const uploadResult = await sp.web.getFolderByServerRelativePath(folderUrl).files.addChunked(fileName, file, { Overwrite: true });
        sharepointUrl = uploadResult?.ServerRelativeUrl || '';
        console.log("SharePoint upload successful, URL:", sharepointUrl);
      } else {
        // In bypass mode, use a mock SharePoint URL
        console.log("Auth bypass mode: Using mock SharePoint URL");
        sharepointUrl = `/mock-sharepoint/documents/${fileName}`;
      }
      
      // 2. Post document metadata + SharePoint URL to backend
      const payload: DocumentCreateSchema = {
        ...form,
        sharepoint_id: sharepointUrl,
        file_name: fileName,
        // Store title and description in metadata since they're not direct fields in the schema
        metadata: {
          title: (form as DocumentFormData).title || fileName,
          description: (form as DocumentFormData).description || 'Uploaded document'
        },
        // Required fields from schema
        type_id: form.type_id || null // Default to null if not provided
      };
      
      console.log("Sending document data to API:", payload);
      const res = await fetch("/api/documents/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error("API error:", res.status, errorText);
        throw new Error(`Failed to create document record: ${res.status} ${errorText}`);
      }
      
      console.log("Document created successfully");
      setForm({});
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onOpenChange(false);
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
