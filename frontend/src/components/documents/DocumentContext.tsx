import React, { createContext, useContext } from 'react';
import type { components } from '@/types/openapi';

type Document = components["schemas"]["DocumentSchema"];

interface DocumentContextType {
  addDocument: (doc: Document) => void;
  removeDocument: (docId: string) => void;
  setDocumentUploading: (docId: string, uploading: boolean) => void;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider: React.FC<{
  children: React.ReactNode;
  addDocument: (doc: Document) => void;
  removeDocument: (docId: string) => void;
  setDocumentUploading: (docId: string, uploading: boolean) => void;
}> = ({ children, addDocument, removeDocument, setDocumentUploading }) => {
  return (
    <DocumentContext.Provider value={{ addDocument, removeDocument, setDocumentUploading }}>
      {children}
    </DocumentContext.Provider>
  );
};