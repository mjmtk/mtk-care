import { apiRequest } from './api-request';

export interface Document {
  id: string;
  file_name: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  sharepoint_id?: string;
  sharepoint_url?: string;
  sharepoint_unique_id?: string;
  sharepoint_etag?: string;
  sharepoint_server_relative_url?: string;
  sharepoint_web_url?: string;
  sharepoint_download_url?: string;
  client_id?: string;
  referral_id?: string;
  folder_category: string;
  type?: {
    id: number;
    label: string;
    value: string;
  };
  status: 'pending' | 'uploading' | 'uploaded' | 'failed' | 'archived' | 'deleted';
  is_confidential: boolean;
  access_level: 'public' | 'internal' | 'restricted' | 'confidential';
  version: string;
  is_latest_version: boolean;
  description?: string;
  tags: string[];
  metadata: any;
  upload_error?: string;
  uploaded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreateData {
  file_name: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
  client_id?: string;
  referral_id?: string;
  folder_category?: string;
  type_id?: string;
  is_confidential?: boolean;
  access_level?: string;
  description?: string;
  tags?: string[];
  metadata?: any;
}

export interface DocumentUpdateData {
  file_name?: string;
  folder_category?: string;
  type_id?: string;
  status?: string;
  is_confidential?: boolean;
  access_level?: string;
  description?: string;
  tags?: string[];
  metadata?: any;
  sharepoint_id?: string;
  sharepoint_url?: string;
  sharepoint_unique_id?: string;
  sharepoint_server_relative_url?: string;
  sharepoint_etag?: string;
  uploaded_at?: string;
  upload_error?: string;
}

export class DocumentService {
  /**
   * List all documents, optionally filtered by client and/or referral
   */
  static async listDocuments(clientId?: string, referralId?: string): Promise<Document[]> {
    const params = new URLSearchParams();
    if (clientId) params.append('client_id', clientId);
    if (referralId) params.append('referral_id', referralId);
    
    const queryString = params.toString();
    return await apiRequest({
      url: `v1/documents/${queryString ? `?${queryString}` : ''}`,
      method: 'GET'
    });
  }

  /**
   * Get a specific document by ID
   */
  static async getDocument(documentId: string): Promise<Document> {
    return await apiRequest({
      url: `v1/documents/${documentId}`,
      method: 'GET'
    });
  }

  /**
   * Create a new document record
   */
  static async createDocument(data: DocumentCreateData): Promise<Document> {
    return await apiRequest({
      url: 'v1/documents/',
      method: 'POST',
      data
    });
  }

  /**
   * Update an existing document
   */
  static async updateDocument(documentId: string, data: DocumentUpdateData): Promise<Document> {
    return await apiRequest({
      url: `v1/documents/${documentId}`,
      method: 'PUT',
      data
    });
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string): Promise<void> {
    await apiRequest({
      url: `v1/documents/${documentId}`,
      method: 'DELETE'
    });
  }

  /**
   * Mark document as uploaded with SharePoint details
   */
  static async markDocumentUploaded(
    documentId: string, 
    sharepointId?: string, 
    sharepointUrl?: string
  ): Promise<Document> {
    return await apiRequest({
      url: `v1/documents/${documentId}`,
      method: 'PUT',
      data: {
        status: 'uploaded',
        sharepoint_id: sharepointId,
        sharepoint_url: sharepointUrl
      }
    });
  }

  /**
   * Mark document upload as failed
   */
  static async markDocumentFailed(documentId: string, error: string): Promise<Document> {
    return await apiRequest({
      url: `v1/documents/${documentId}`,
      method: 'PUT',
      data: {
        status: 'failed',
        upload_error: error
      }
    });
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Get MIME type from file
   */
  static getMimeType(file: File): string {
    return file.type || 'application/octet-stream';
  }

  /**
   * Get secure access URL for a document
   */
  static async getDocumentAccessUrl(documentId: string, action: 'view' | 'download' | 'preview' = 'view'): Promise<string> {
    const response = await apiRequest({
      url: `v1/documents/${documentId}/access?action=${action}`,
      method: 'GET'
    });
    return response.url;
  }

  /**
   * Get client folder URLs
   */
  static async getClientFolderUrls(clientId: string): Promise<{ client_folder: string; folder_structure: string[] }> {
    const response = await apiRequest({
      url: `v1/documents/client/${clientId}/folders`,
      method: 'GET'
    });
    return response;
  }
}