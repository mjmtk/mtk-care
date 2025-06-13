"""
SharePoint integration service using Microsoft Graph API.
Handles authentication and file operations with SharePoint.
"""
import base64
import logging
from typing import Optional, Dict, Any, BinaryIO
import requests
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
import mimetypes
import io

logger = logging.getLogger(__name__)


class SharePointGraphService:
    """
    Service for interacting with SharePoint using Microsoft Graph API.
    Uses application-level permissions (client credentials flow).
    """
    
    def __init__(self):
        self.tenant_id = settings.AZURE_AD.get('TENANT_ID')
        self.client_id = settings.SHAREPOINT_CLIENT_ID or settings.AZURE_AD.get('CLIENT_ID')
        self.client_secret = settings.SHAREPOINT_CLIENT_SECRET or settings.AZURE_AD.get('CLIENT_SECRET')
        self.site_url = settings.SHAREPOINT_SITE_URL
        self.graph_url = "https://graph.microsoft.com/v1.0"
        self._site_id = None
        
    def _get_access_token(self) -> str:
        """
        Get access token using client credentials flow.
        Caches token for efficiency.
        """
        cache_key = f"sharepoint_access_token_{self.client_id}"
        token = cache.get(cache_key)
        
        if token:
            return token
            
        # Request new token
        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://graph.microsoft.com/.default',
            'grant_type': 'client_credentials'
        }
        
        try:
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            access_token = token_data['access_token']
            expires_in = token_data.get('expires_in', 3600)
            
            # Cache token for slightly less than its expiry time
            cache.set(cache_key, access_token, expires_in - 300)
            
            return access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get SharePoint access token: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise Exception(f"SharePoint authentication failed: {str(e)}")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authorization headers for Graph API requests."""
        return {
            'Authorization': f'Bearer {self._get_access_token()}',
            'Content-Type': 'application/json'
        }
    
    def get_site_id(self) -> str:
        """
        Get SharePoint site ID from URL.
        Caches the result as site IDs don't change.
        """
        if self._site_id:
            return self._site_id
            
        cache_key = f"sharepoint_site_id_{self.site_url}"
        site_id = cache.get(cache_key)
        
        if site_id:
            self._site_id = site_id
            return site_id
            
        # Parse site URL to get hostname and site path
        from urllib.parse import urlparse
        parsed = urlparse(self.site_url)
        hostname = parsed.hostname
        site_path = parsed.path
        
        # Remove /sites/ prefix if present
        if site_path.startswith('/sites/'):
            site_path = site_path[7:]
        
        # Get site ID from Graph API
        url = f"{self.graph_url}/sites/{hostname}:/sites/{site_path}"
        
        try:
            response = requests.get(url, headers=self._get_headers())
            response.raise_for_status()
            
            site_data = response.json()
            site_id = site_data['id']
            
            # Cache site ID indefinitely
            cache.set(cache_key, site_id, None)
            self._site_id = site_id
            
            return site_id
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get SharePoint site ID: {e}")
            raise Exception(f"Failed to get SharePoint site ID: {str(e)}")
    
    def create_folder_if_not_exists(self, folder_path: str) -> bool:
        """
        Create folder structure in SharePoint if it doesn't exist.
        Returns True if folder was created or already exists.
        """
        site_id = self.get_site_id()
        
        # Split path into segments
        path_segments = [p for p in folder_path.split('/') if p]
        current_path = ""
        
        for segment in path_segments:
            parent_path = current_path
            current_path = f"{current_path}/{segment}" if current_path else segment
            
            # Check if folder exists
            check_url = f"{self.graph_url}/sites/{site_id}/drive/root:/{current_path}"
            
            try:
                response = requests.get(check_url, headers=self._get_headers())
                if response.status_code == 200:
                    # Folder exists, continue to next segment
                    continue
            except:
                pass
            
            # Create folder
            if parent_path:
                create_url = f"{self.graph_url}/sites/{site_id}/drive/root:/{parent_path}:/children"
            else:
                create_url = f"{self.graph_url}/sites/{site_id}/drive/root/children"
            
            folder_data = {
                "name": segment,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "rename"
            }
            
            try:
                response = requests.post(
                    create_url,
                    headers=self._get_headers(),
                    json=folder_data
                )
                response.raise_for_status()
                logger.info(f"Created SharePoint folder: {current_path}")
            except requests.exceptions.RequestException as e:
                if "nameAlreadyExists" not in str(e):
                    logger.error(f"Failed to create folder {current_path}: {e}")
                    return False
        
        return True
    
    def upload_file(self, file_path_in_sharepoint: str, file_content: BinaryIO, 
                   mime_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload file to SharePoint.
        
        Args:
            file_path_in_sharepoint: Full path including filename (e.g., "client123/documents/file.pdf")
            file_content: File content as binary stream
            mime_type: MIME type of the file
            
        Returns:
            Dict with SharePoint file metadata
        """
        site_id = self.get_site_id()
        
        # Ensure parent folder exists
        folder_path = '/'.join(file_path_in_sharepoint.split('/')[:-1])
        if folder_path:
            self.create_folder_if_not_exists(folder_path)
        
        # Read file content
        file_content.seek(0)
        file_data = file_content.read()
        file_size = len(file_data)
        
        # Determine upload method based on file size
        # Use simple upload for files < 4MB, otherwise use upload session
        if file_size < 4 * 1024 * 1024:  # 4MB
            return self._simple_upload(site_id, file_path_in_sharepoint, file_data, mime_type)
        else:
            return self._large_file_upload(site_id, file_path_in_sharepoint, file_data, mime_type)
    
    def _simple_upload(self, site_id: str, file_path: str, file_data: bytes, 
                      mime_type: Optional[str] = None) -> Dict[str, Any]:
        """Upload small file using simple upload."""
        upload_url = f"{self.graph_url}/sites/{site_id}/drive/root:/{file_path}:/content"
        
        headers = {
            'Authorization': f'Bearer {self._get_access_token()}',
            'Content-Type': mime_type or 'application/octet-stream'
        }
        
        try:
            response = requests.put(
                upload_url,
                headers=headers,
                data=file_data
            )
            response.raise_for_status()
            
            file_metadata = response.json()
            logger.info(f"Successfully uploaded file to SharePoint: {file_path}")
            logger.debug(f"SharePoint response metadata: {file_metadata}")
            
            return {
                'id': file_metadata.get('id'),
                'name': file_metadata.get('name'),
                'size': file_metadata.get('size'),
                'webUrl': file_metadata.get('webUrl'),
                'downloadUrl': file_metadata.get('@microsoft.graph.downloadUrl'),
                'createdDateTime': file_metadata.get('createdDateTime'),
                'eTag': file_metadata.get('eTag'),
                'serverRelativeUrl': file_metadata.get('webDavUrl', file_metadata.get('webUrl', ''))
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload file to SharePoint: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise Exception(f"SharePoint upload failed: {str(e)}")
    
    def _large_file_upload(self, site_id: str, file_path: str, file_data: bytes,
                          mime_type: Optional[str] = None) -> Dict[str, Any]:
        """Upload large file using upload session."""
        # Create upload session
        session_url = f"{self.graph_url}/sites/{site_id}/drive/root:/{file_path}:/createUploadSession"
        
        session_data = {
            "item": {
                "@microsoft.graph.conflictBehavior": "rename"
            }
        }
        
        try:
            response = requests.post(
                session_url,
                headers=self._get_headers(),
                json=session_data
            )
            response.raise_for_status()
            
            upload_session = response.json()
            upload_url = upload_session['uploadUrl']
            
            # Upload file in chunks
            chunk_size = 10 * 1024 * 1024  # 10MB chunks
            file_size = len(file_data)
            
            for i in range(0, file_size, chunk_size):
                chunk_end = min(i + chunk_size, file_size)
                chunk_data = file_data[i:chunk_end]
                
                headers = {
                    'Content-Length': str(len(chunk_data)),
                    'Content-Range': f'bytes {i}-{chunk_end-1}/{file_size}'
                }
                
                chunk_response = requests.put(upload_url, headers=headers, data=chunk_data)
                
                if chunk_response.status_code not in [200, 201, 202]:
                    raise Exception(f"Chunk upload failed: {chunk_response.text}")
            
            # Final response contains file metadata
            file_metadata = chunk_response.json()
            logger.info(f"Successfully uploaded large file to SharePoint: {file_path}")
            logger.debug(f"SharePoint response metadata: {file_metadata}")
            
            return {
                'id': file_metadata.get('id'),
                'name': file_metadata.get('name'),
                'size': file_metadata.get('size'),
                'webUrl': file_metadata.get('webUrl'),
                'downloadUrl': file_metadata.get('@microsoft.graph.downloadUrl'),
                'createdDateTime': file_metadata.get('createdDateTime'),
                'eTag': file_metadata.get('eTag'),
                'serverRelativeUrl': file_metadata.get('webDavUrl', file_metadata.get('webUrl', ''))
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create upload session: {e}")
            raise Exception(f"SharePoint large file upload failed: {str(e)}")
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from SharePoint.
        
        Args:
            file_path: Path to file in SharePoint
            
        Returns:
            True if successful, False otherwise
        """
        site_id = self.get_site_id()
        delete_url = f"{self.graph_url}/sites/{site_id}/drive/root:/{file_path}"
        
        try:
            response = requests.delete(delete_url, headers=self._get_headers())
            
            if response.status_code == 204:
                logger.info(f"Successfully deleted file from SharePoint: {file_path}")
                return True
            else:
                logger.error(f"Failed to delete file: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete file from SharePoint: {e}")
            return False
    
    def get_file_metadata(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a file in SharePoint."""
        site_id = self.get_site_id()
        url = f"{self.graph_url}/sites/{site_id}/drive/root:/{file_path}"
        
        try:
            response = requests.get(url, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException:
            return None