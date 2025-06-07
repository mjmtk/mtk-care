"use client";
import { useState } from "react";
import DocumentList from "@/components/documents/DocumentList";
import DocumentCreateDialog from "@/components/documents/DocumentCreateDialog";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button onClick={() => setOpen(true)}>Create Document</Button>
      </div>
      <DocumentList />
      <DocumentCreateDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
