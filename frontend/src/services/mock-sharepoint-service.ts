// Mock SharePoint service for testing in auth bypass mode
export interface SharePointFile {
  UniqueId: string;
  Name: string;
  LinkingUrl: string;
  ServerRelativeUrl: string;
  Length?: number;
  TimeCreated?: string;
  TimeLastModified?: string;
}

export interface DocumentUploadResult {
  success: boolean;
  file?: SharePointFile;
  error?: string;
}

export class MockSharePointService {
  private mockFiles: Map<string, SharePointFile[]> = new Map();

  /**
   * Get the SharePoint folder path for a client's documents
   */
  private getClientDocumentPath(clientId: string, referralId?: string): string {
    const basePath = `/sites/client_docs/Shared Documents/${clientId}`;
    
    if (referralId) {
      return `${basePath}/referrals/${referralId}`;
    } else {
      return `${basePath}/general`;
    }
  }

  /**
   * List all documents for a specific client
   */
  async listClientDocuments(clientId: string, referralId?: string): Promise<SharePointFile[]> {
    await this.simulateDelay();
    const folderKey = referralId ? `${clientId}/${referralId}` : `${clientId}/general`;
    return this.mockFiles.get(folderKey) || [];
  }

  /**
   * Upload a document to a client's SharePoint folder
   */
  async uploadDocument(clientId: string, file: File, referralId?: string): Promise<DocumentUploadResult> {
    await this.simulateDelay();
    
    try {
      const folderPath = this.getClientDocumentPath(clientId, referralId);
      const mockFile: SharePointFile = {
        UniqueId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        Name: file.name,
        LinkingUrl: `${folderPath}/${file.name}`,
        ServerRelativeUrl: `${folderPath}/${file.name}`,
        Length: file.size,
        TimeCreated: new Date().toISOString(),
        TimeLastModified: new Date().toISOString()
      };

      // Store in mock storage
      const folderKey = referralId ? `${clientId}/${referralId}` : `${clientId}/general`;
      const clientFiles = this.mockFiles.get(folderKey) || [];
      // Remove existing file with same name
      const filteredFiles = clientFiles.filter(f => f.Name !== file.name);
      filteredFiles.push(mockFile);
      this.mockFiles.set(folderKey, filteredFiles);

      return {
        success: true,
        file: mockFile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Mock upload failed'
      };
    }
  }

  /**
   * Delete a document from SharePoint
   */
  async deleteDocument(clientId: string, fileName: string, referralId?: string): Promise<boolean> {
    await this.simulateDelay();
    
    const folderKey = referralId ? `${clientId}/${referralId}` : `${clientId}/general`;
    const clientFiles = this.mockFiles.get(folderKey) || [];
    const filteredFiles = clientFiles.filter(f => f.Name !== fileName);
    this.mockFiles.set(folderKey, filteredFiles);
    
    return true;
  }

  /**
   * Get direct download URL for a document
   */
  getDocumentUrl(clientId: string, fileName: string, referralId?: string): string {
    const folderPath = this.getClientDocumentPath(clientId, referralId);
    return `${folderPath}/${fileName}`;
  }

  /**
   * Simulate network delay for realistic testing
   */
  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  }
}

/**
 * Hook to use mock SharePoint service for testing
 */
export function useMockSharePointService() {
  return new MockSharePointService();
}