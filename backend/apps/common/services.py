"""
SharePoint integration services for document management.
"""
import urllib.parse
from typing import Optional
from django.conf import settings
from .models import Document, DocumentAuditLog


class SharePointURLService:
    """
    Service for generating SharePoint URLs and managing document access.
    Handles the complexity of SharePoint URL structures.
    """
    
    def __init__(self):
        self.base_url = getattr(settings, 'SHAREPOINT_SITE_URL', 'https://manaakitech.sharepoint.com/sites/client_docs')
        self.document_library = 'Shared Documents'
    
    def get_client_folder_web_url(self, client_id: str) -> str:
        """
        Generate web URL for client folder that opens in SharePoint interface.
        This creates a proper SharePoint folder view URL.
        """
        path = f"/{self.document_library}/{client_id}"
        encoded_path = urllib.parse.quote(path)
        
        # SharePoint folder view URL format
        return f"{self.base_url}/{self.document_library}/Forms/AllItems.aspx?id={encoded_path}"
    
    def get_referral_folder_web_url(self, client_id: str, referral_id: str) -> str:
        """Generate web URL for specific referral folder."""
        path = f"/{self.document_library}/{client_id}/referrals/{referral_id}"
        encoded_path = urllib.parse.quote(path)
        
        return f"{self.base_url}/{self.document_library}/Forms/AllItems.aspx?id={encoded_path}"
    
    def get_document_download_url(self, document: Document) -> Optional[str]:
        """
        Get direct download URL for a document using SharePoint's download endpoint.
        This bypasses the SharePoint UI and downloads the file directly.
        """
        # First try the direct download URL from SharePoint
        if document.sharepoint_download_url:
            return document.sharepoint_download_url
        # Fallback to web URL with download parameter
        elif document.sharepoint_web_url:
            return f"{document.sharepoint_web_url}?web=1&download=1"
        # Legacy fallback using constructed URLs
        elif document.sharepoint_unique_id:
            return f"{self.base_url}/_layouts/15/download.aspx?UniqueId={document.sharepoint_unique_id}"
        elif document.sharepoint_server_relative_url:
            encoded_url = urllib.parse.quote(document.sharepoint_server_relative_url)
            return f"{self.base_url}/_layouts/15/download.aspx?SourceUrl={encoded_url}"
        return None
    
    def get_document_preview_url(self, document: Document) -> Optional[str]:
        """
        Get URL for previewing document in SharePoint's web viewer.
        """
        # Use the web URL directly from SharePoint - this should work for viewing
        if document.sharepoint_web_url:
            return document.sharepoint_web_url
        # Legacy fallback
        elif document.sharepoint_unique_id:
            return f"{self.base_url}/_layouts/15/WopiFrame.aspx?sourcedoc={document.sharepoint_unique_id}&action=view"
        return None
    
    def get_server_relative_url(self, document: Document) -> str:
        """
        Generate server-relative URL for SharePoint API operations.
        This is used for API calls, not user-facing URLs.
        """
        folder_path = document.sharepoint_folder_path
        return f"/sites/client_docs/{self.document_library}/{folder_path}{document.file_name}"
    
    def generate_folder_structure_paths(self, client_id: str) -> list[str]:
        """
        Generate all folder paths that should be pre-created for a client.
        Uses the new logical folder structure.
        """
        base_path = f"{client_id}"
        
        paths = [
            # Base client folder
            base_path,
            
            # Client-level document structure
            f"{base_path}/general",
            f"{base_path}/general/identification",
            f"{base_path}/general/medical-records", 
            f"{base_path}/general/legal",
            f"{base_path}/general/insurance",
            f"{base_path}/general/other",
            
            # Referrals base folder (specific referral folders created dynamically)
            f"{base_path}/referrals",
        ]
        
        return paths
    
    def generate_referral_folder_structure_paths(self, client_id: str, referral_id: str) -> list[str]:
        """
        Generate folder paths for a specific referral.
        Called when a referral is created.
        """
        base_path = f"{client_id}/referrals/{referral_id}"
        
        paths = [
            base_path,  # Just the referral folder - no subfolders needed
        ]
        
        return paths


class DocumentAccessService:
    """
    Service for managing secure document access and audit logging.
    """
    
    @staticmethod
    def log_document_access(document: Document, user, action: str, 
                          request=None, success: bool = True, 
                          error_message: str = None, **metadata):
        """
        Log document access for audit trail.
        """
        audit_data = {
            'document': document,
            'user': user,
            'action': action,
            'success': success,
            'error_message': error_message,
            'metadata': metadata
        }
        
        if request:
            audit_data.update({
                'ip_address': get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:500]  # Truncate long user agents
            })
        
        DocumentAuditLog.objects.create(**audit_data)
    
    @staticmethod
    def can_user_access_document(user, document: Document) -> bool:
        """
        Check if user has permission to access the document.
        Implement your permission logic here.
        """
        # Basic permission check - expand based on your requirements
        if user.is_superuser:
            return True
        
        # If document belongs to a referral, check referral permissions
        if document.referral_id:
            # TODO: Implement referral-specific permission check
            # return user.has_perm('view_referral', document.referral)
            pass
        
        # If document belongs to a client, check client permissions  
        if document.client_id:
            # TODO: Implement client-specific permission check
            # return user.has_perm('view_client', document.client)
            pass
        
        # Default: allow access (update this based on your security requirements)
        return True
    
    @staticmethod
    def get_secure_document_url(document: Document, user, action: str = 'view') -> Optional[str]:
        """
        Generate a secure URL for document access that goes through the application.
        This ensures proper permission checking and audit logging.
        """
        from django.urls import reverse
        from django.utils.http import urlencode
        
        # Generate a URL that points to your secure document view
        base_url = reverse('secure_document_access', kwargs={'document_id': document.id})
        
        # Add action parameter
        params = {'action': action}
        return f"{base_url}?{urlencode(params)}"


def get_client_ip(request) -> Optional[str]:
    """
    Extract client IP address from request, handling proxies.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class DocumentVersioningService:
    """
    Service for managing document versions and history.
    """
    
    @staticmethod
    def create_new_version(original_document: Document, new_file_data: dict, user) -> Document:
        """
        Create a new version of an existing document.
        """
        # Mark original as not latest
        original_document.is_latest_version = False
        original_document.save()
        
        # Create new version
        new_version_data = {
            'file_name': new_file_data['file_name'],
            'original_filename': new_file_data.get('original_filename'),
            'file_size': new_file_data.get('file_size'),
            'mime_type': new_file_data.get('mime_type'),
            'client_id': original_document.client_id,
            'referral_id': original_document.referral_id,
            'folder_category': original_document.folder_category,
            'type': original_document.type,
            'is_confidential': original_document.is_confidential,
            'access_level': original_document.access_level,
            'description': new_file_data.get('description', original_document.description),
            'version': increment_version(original_document.version),
            'is_latest_version': True,
            'superseded_by': None,  # Will be set when this version is superseded
        }
        
        new_document = Document.objects.create(**new_version_data)
        
        # Update original to point to new version
        original_document.superseded_by = new_document
        original_document.save()
        
        # Log the versioning action
        DocumentAccessService.log_document_access(
            document=new_document,
            user=user,
            action=DocumentAuditLog.ActionType.UPLOADED,
            metadata={'version_of': original_document.id, 'previous_version': original_document.version}
        )
        
        return new_document


def increment_version(current_version: str) -> str:
    """
    Increment version number (e.g., "1.0" -> "1.1", "1.9" -> "2.0")
    """
    try:
        major, minor = map(int, current_version.split('.'))
        if minor >= 9:
            return f"{major + 1}.0"
        else:
            return f"{major}.{minor + 1}"
    except (ValueError, AttributeError):
        return "1.1"  # Default if current version is malformed