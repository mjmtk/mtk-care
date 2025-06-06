import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Document {
  id: string;
  client_id: string;
  file_name: string;
  sharepoint_id: string;
  type_id: number;
  status_id?: number;
  metadata?: any;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Document | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/common/documents/")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setDocuments)
      .catch(() => setError("Failed to fetch documents."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) => {
    fetch(`/api/common/documents/${id}/`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) setDocuments((docs) => docs.filter((d) => d.id !== id));
        else setError("Failed to delete document.");
      })
      .finally(() => setShowDelete(null));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Documents</h2>
      {loading && <div>Loading...</div>}
      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {!loading && !error && (
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
            {documents.length === 0 ? (
              <TableRow><TableCell colSpan={5}>No documents found.</TableCell></TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.file_name}</TableCell>
                  <TableCell>{doc.type_id}</TableCell>
                  <TableCell>{doc.status_id ?? "-"}</TableCell>
                  <TableCell>
                    <a href={doc.sharepoint_id} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelected(doc)}>Edit</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Edit Document</DialogTitle>
                        {/* TODO: Implement edit form */}
                        <div className="text-muted-foreground">Edit form coming soon.</div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" size="sm" className="ml-2" onClick={() => setShowDelete(doc.id)}>
                      Delete
                    </Button>
                    {showDelete === doc.id && (
                      <Dialog open onOpenChange={() => setShowDelete(null)}>
                        <DialogContent>
                          <DialogTitle>Confirm Delete</DialogTitle>
                          <div>Are you sure you want to delete this document?</div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="destructive" onClick={() => handleDelete(doc.id)}>Delete</Button>
                            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
