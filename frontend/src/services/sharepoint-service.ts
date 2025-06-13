import { usePnP } from '@/providers/PnpSharePointProvider';

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

export class SharePointService {
  private sp: any;

  constructor(sp: any) {
    this.sp = sp;
  }

  /**
   * Get the SharePoint folder path for a client's documents
   * Structure: /sites/client_docs/Shared Documents/<client-id>/general/
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
    if (!this.sp) {
      throw new Error('SharePoint service not initialized');
    }

    try {
      const folderPath = this.getClientDocumentPath(clientId, referralId);
      const folder = this.sp.web.getFolderByServerRelativePath(folderPath);
      const files = await folder.files();
      return Array.isArray(files) ? files : files.value || files.d?.results || [];
    } catch (error) {
      console.error('Error listing client documents:', error);
      throw error;
    }
  }

  /**
   * Upload a document to a client's SharePoint folder
   */
  async uploadDocument(clientId: string, file: File, referralId?: string): Promise<DocumentUploadResult> {
    if (!this.sp) {
      throw new Error('SharePoint service not initialized');
    }

    try {
      const folderPath = this.getClientDocumentPath(clientId, referralId);
      
      // Ensure folder exists (create nested folders if needed)
      try {
        await this.sp.web.getFolderByServerRelativePath(folderPath).get();
      } catch (error) {
        // Folder doesn't exist, create the nested structure
        await this.createNestedFolders(clientId, referralId);
      }

      const folder = this.sp.web.getFolderByServerRelativePath(folderPath);
      const uploadResult = await folder.files.addUsingPath(file.name, file, { Overwrite: true });
      
      return {
        success: true,
        file: uploadResult.file || uploadResult
      };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error?.message || String(error)
      };
    }
  }

  /**
   * Create nested folder structure for client documents
   */
  private async createNestedFolders(clientId: string, referralId?: string): Promise<void> {
    const basePath = `/sites/client_docs/Shared Documents`;
    
    // Create client folder
    const clientPath = `${basePath}/${clientId}`;
    try {
      await this.sp.web.folders.addUsingPath(clientPath);
    } catch (error) {
      // Folder might already exist
    }

    if (referralId) {
      // Create referrals folder
      const referralsPath = `${clientPath}/referrals`;
      try {
        await this.sp.web.folders.addUsingPath(referralsPath);
      } catch (error) {
        // Folder might already exist
      }

      // Create specific referral folder
      const referralPath = `${referralsPath}/${referralId}`;
      try {
        await this.sp.web.folders.addUsingPath(referralPath);
      } catch (error) {
        // Folder might already exist
      }
    } else {
      // Create general folder
      const generalPath = `${clientPath}/general`;
      try {
        await this.sp.web.folders.addUsingPath(generalPath);
      } catch (error) {
        // Folder might already exist
      }
    }
  }

  /**
   * Delete a document from SharePoint
   */
  async deleteDocument(clientId: string, fileName: string, referralId?: string): Promise<boolean> {
    if (!this.sp) {
      throw new Error('SharePoint service not initialized');
    }

    try {
      const folderPath = this.getClientDocumentPath(clientId, referralId);
      const file = this.sp.web.getFileByServerRelativePath(`${folderPath}/${fileName}`);
      await file.delete();
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Get direct download URL for a document
   */
  getDocumentUrl(clientId: string, fileName: string, referralId?: string): string {
    const folderPath = this.getClientDocumentPath(clientId, referralId);
    return `${folderPath}/${fileName}`;
  }
}

/**
 * Hook to use SharePoint service
 */
export function useSharePointService() {
  const sp = usePnP();
  
  if (!sp) {
    return null;
  }
  
  return new SharePointService(sp);
}