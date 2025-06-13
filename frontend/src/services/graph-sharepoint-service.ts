import { useSession } from 'next-auth/react';

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

export class GraphSharePointService {
  private accessToken: string;
  private siteUrl: string;
  private siteId: string | null = null;

  constructor(accessToken: string, siteUrl: string) {
    this.accessToken = accessToken;
    this.siteUrl = siteUrl;
    
    // Debug: Log token info (first/last 10 chars only for security)
    console.log('SharePoint service initialized with token:', 
      accessToken.substring(0, 10) + '...' + accessToken.substring(accessToken.length - 10)
    );
    console.log('Site URL:', siteUrl);
  }

  /**
   * Get site ID from SharePoint site URL
   */
  private async getSiteId(): Promise<string> {
    if (this.siteId) return this.siteId;

    try {
      // Extract hostname and site path from URL
      const url = new URL(this.siteUrl);
      const hostname = url.hostname;
      const sitePath = url.pathname;

      const graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;
      console.log('Fetching site ID from:', graphUrl);
      console.log('Site URL parts:', { hostname, sitePath });
      
      const response = await fetch(graphUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Site ID response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Site ID error response:', errorText);
        throw new Error(`Failed to get site ID: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const siteData = await response.json();
      this.siteId = siteData.id;
      return this.siteId;
    } catch (error) {
      console.error('Error getting site ID:', error);
      throw error;
    }
  }

  /**
   * Get the client document folder path
   */
  private getClientDocumentPath(clientId: string, referralId?: string): string {
    if (referralId) {
      return `/${clientId}/referrals/${referralId}`;
    } else {
      return `/${clientId}/general`;
    }
  }

  /**
   * Create folder structure if it doesn't exist
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    try {
      const siteId = await this.getSiteId();
      const pathParts = folderPath.split('/').filter(Boolean);
      
      let currentPath = '';
      for (const part of pathParts) {
        currentPath += `/${part}`;
        
        try {
          // Try to get the folder
          await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${currentPath}`,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
              },
            }
          );
        } catch {
          // Folder doesn't exist, create it
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
          
          await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${parentPath}:/children`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: part,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
              }),
            }
          );
        }
      }
    } catch (error) {
      console.error('Error ensuring folder exists:', error);
      // Don't throw - folder creation is best effort
    }
  }

  /**
   * Upload a document to SharePoint
   */
  async uploadDocument(clientId: string, file: File, referralId?: string): Promise<DocumentUploadResult> {
    try {
      const siteId = await this.getSiteId();
      const folderPath = this.getClientDocumentPath(clientId, referralId);
      
      // Ensure folder structure exists
      await this.ensureFolderExists(folderPath);

      // Upload file
      const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${folderPath}/${file.name}:/content`;
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const uploadResult = await response.json();
      
      // Convert Graph API response to SharePoint format
      const sharePointFile: SharePointFile = {
        UniqueId: uploadResult.id,
        Name: uploadResult.name,
        LinkingUrl: uploadResult.webUrl,
        ServerRelativeUrl: folderPath + '/' + uploadResult.name,
        Length: uploadResult.size,
        TimeCreated: uploadResult.createdDateTime,
        TimeLastModified: uploadResult.lastModifiedDateTime,
      };

      return {
        success: true,
        file: sharePointFile,
      };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error?.message || String(error),
      };
    }
  }

  /**
   * List documents in a client folder
   */
  async listClientDocuments(clientId: string, referralId?: string): Promise<SharePointFile[]> {
    try {
      const siteId = await this.getSiteId();
      const folderPath = this.getClientDocumentPath(clientId, referralId);

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${folderPath}:/children`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // Folder doesn't exist yet
        }
        throw new Error(`Failed to list documents: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert Graph API response to SharePoint format
      return data.value
        .filter((item: any) => item.file) // Only files, not folders
        .map((item: any): SharePointFile => ({
          UniqueId: item.id,
          Name: item.name,
          LinkingUrl: item.webUrl,
          ServerRelativeUrl: folderPath + '/' + item.name,
          Length: item.size,
          TimeCreated: item.createdDateTime,
          TimeLastModified: item.lastModifiedDateTime,
        }));
    } catch (error) {
      console.error('Error listing client documents:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(clientId: string, fileName: string, referralId?: string): Promise<boolean> {
    try {
      const siteId = await this.getSiteId();
      const folderPath = this.getClientDocumentPath(clientId, referralId);

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${folderPath}/${fileName}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Get document download URL
   */
  getDocumentUrl(clientId: string, fileName: string, referralId?: string): string {
    const folderPath = this.getClientDocumentPath(clientId, referralId);
    return `${this.siteUrl}${folderPath}/${fileName}`;
  }
}

/**
 * Hook to use Graph SharePoint service
 */
export function useGraphSharePointService() {
  const { data: session } = useSession();
  
  if (!session?.accessToken) {
    return null;
  }
  
  const siteUrl = process.env.NEXT_PUBLIC_SHAREPOINT_SITE_URL;
  if (!siteUrl) {
    console.error('NEXT_PUBLIC_SHAREPOINT_SITE_URL not configured');
    return null;
  }
  
  return new GraphSharePointService(session.accessToken as string, siteUrl);
}