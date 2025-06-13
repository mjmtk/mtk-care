from ninja import Router
from ninja.responses import Response
from .models import Document, DocumentAuditLog
from .schemas import DocumentSchema, DocumentCreateSchema, DocumentUpdateSchema
from .services import SharePointURLService, DocumentAccessService
from .sharepoint_service import SharePointGraphService
from typing import List, Optional
from django.shortcuts import get_object_or_404
from apps.authentication.decorators import auth_required
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

documents_router = Router()

@documents_router.get("/", response=List[DocumentSchema])
@auth_required
def list_documents(request, client_id: Optional[str] = None):
    """List all documents, optionally filtered by client_id"""
    qs = Document.objects.all().order_by('-created_at')
    if client_id:
        qs = qs.filter(client_id=client_id)
    return list(qs)

@documents_router.get("/{doc_id}", response=DocumentSchema)
@auth_required
def get_document(request, doc_id: str):
    """Get a specific document by ID"""
    return get_object_or_404(Document, id=doc_id)

@documents_router.post("/", response=DocumentSchema)
@auth_required
def create_document(request, data: DocumentCreateSchema):
    """Create a new document record"""
    user = getattr(request, 'auth', None) or getattr(request, 'user', None)
    
    # Prepare creation data
    create_kwargs = data.dict(exclude_unset=True, exclude_none=True)
    
    # Set default values if not provided
    if 'folder_category' not in create_kwargs:
        create_kwargs['folder_category'] = 'general'
    if 'status' not in create_kwargs:
        create_kwargs['status'] = 'pending'
    if 'is_confidential' not in create_kwargs:
        create_kwargs['is_confidential'] = False
    if 'access_level' not in create_kwargs:
        create_kwargs['access_level'] = 'internal'
    if 'tags' not in create_kwargs:
        create_kwargs['tags'] = []
    if 'metadata' not in create_kwargs:
        create_kwargs['metadata'] = {}
    
    # Handle type_id -> type mapping
    if 'type_id' in create_kwargs:
        create_kwargs['type_id'] = create_kwargs.pop('type_id')
    
    doc = Document.objects.create(**create_kwargs)
    if user:
        doc.created_by = user
        doc.save()
    
    return doc

@documents_router.put("/{doc_id}", response=DocumentSchema)
@auth_required
def update_document(request, doc_id: str, data: DocumentUpdateSchema):
    """Update an existing document"""
    user = getattr(request, 'auth', None) or getattr(request, 'user', None)
    doc = get_object_or_404(Document, id=doc_id)
    
    update_data = data.dict(exclude_unset=True, exclude_none=True)
    
    for attr, value in update_data.items():
        if hasattr(doc, attr):
            setattr(doc, attr, value)
    
    doc.save(user=user)
    return doc

@documents_router.delete("/{doc_id}")
@auth_required
def delete_document(request, doc_id: str):
    """Delete a document (soft delete)"""
    user = getattr(request, 'auth', None) or getattr(request, 'user', None)
    doc = get_object_or_404(Document, id=doc_id)
    
    # Check permissions
    if not DocumentAccessService.can_user_access_document(user, doc):
        return Response({"error": "Access denied"}, status=403)
    
    doc.delete(user=user)
    
    # Log deletion
    DocumentAccessService.log_document_access(
        document=doc,
        user=user,
        action=DocumentAuditLog.ActionType.DELETED,
        request=request,
        success=True
    )
    
    return {"success": True}

@documents_router.get("/{doc_id}/access", response=dict)
@auth_required
def get_document_access_url(request, doc_id: str, action: str = "view"):
    """Get secure access URL for a document."""
    user = getattr(request, 'auth', None) or getattr(request, 'user', None)
    document = get_object_or_404(Document, id=doc_id)
    
    # Check permissions
    if not DocumentAccessService.can_user_access_document(user, document):
        return Response({"error": "Access denied"}, status=403)
    
    sharepoint_service = SharePointURLService()
    
    if action == 'download':
        url = sharepoint_service.get_document_download_url(document)
        audit_action = DocumentAuditLog.ActionType.DOWNLOADED
    elif action == 'preview':
        url = sharepoint_service.get_document_preview_url(document)
        audit_action = DocumentAuditLog.ActionType.VIEWED
    else:
        url = sharepoint_service.get_document_download_url(document)
        audit_action = DocumentAuditLog.ActionType.VIEWED
    
    if not url:
        return Response({"error": "Document not available"}, status=404)
    
    # Log access
    DocumentAccessService.log_document_access(
        document=document,
        user=user,
        action=audit_action,
        request=request,
        success=True
    )
    
    return {
        "url": url,
        "filename": document.file_name,
        "size": document.file_size,
        "mime_type": document.mime_type
    }


@documents_router.post("/{doc_id}/upload", response=dict)
@auth_required
def upload_document_file(request, doc_id: str):
    """Upload file for a document and store in SharePoint via backend."""
    from django.core.files.storage import default_storage
    import tempfile
    import os
    
    document = get_object_or_404(Document, id=doc_id)
    user = getattr(request, 'auth', None) or getattr(request, 'user', None)
    
    # Check permissions
    if not DocumentAccessService.can_user_access_document(user, document):
        return Response({"error": "Access denied"}, status=403)
    
    # Get uploaded file
    if 'file' not in request.FILES:
        return Response({"error": "No file provided"}, status=400)
    
    uploaded_file = request.FILES['file']
    
    try:
        # Update document status to uploading
        document.status = 'uploading'
        document.file_size = uploaded_file.size
        document.mime_type = uploaded_file.content_type or 'application/octet-stream'
        document.save()
        
        # Initialize SharePoint service
        sharepoint_service = SharePointGraphService()
        
        # Determine file path in SharePoint based on document type and context
        if document.referral_id:
            # Referral-specific documents: client_id/referrals/referral_id/
            file_path = f"{document.client_id}/referrals/{document.referral_id}/{document.file_name}"
        else:
            # Client-level documents: client_id/general/category/
            folder_category = document.folder_category or 'general-other'
            # Map client-level categories to general subfolders
            if folder_category in ['identification', 'medical-records', 'legal', 'insurance']:
                file_path = f"{document.client_id}/general/{folder_category}/{document.file_name}"
            else:
                file_path = f"{document.client_id}/general/other/{document.file_name}"
        
        logger.info(f"Uploading document {document.id} to SharePoint path: {file_path}")
        
        # Upload to SharePoint
        sharepoint_result = sharepoint_service.upload_file(
            file_path_in_sharepoint=file_path,
            file_content=uploaded_file,
            mime_type=document.mime_type
        )
        
        # Update document with SharePoint metadata
        logger.info(f"SharePoint upload result: {sharepoint_result}")
        document.sharepoint_id = sharepoint_result['id']
        document.sharepoint_unique_id = sharepoint_result['id']
        document.sharepoint_server_relative_url = sharepoint_result['serverRelativeUrl']
        document.sharepoint_web_url = sharepoint_result['webUrl']
        document.sharepoint_download_url = sharepoint_result.get('downloadUrl')
        document.sharepoint_etag = sharepoint_result.get('eTag')
        document.status = 'uploaded'
        document.uploaded_at = timezone.now()
        document.save(user=user)
        
        logger.info(f"Document {document.id} saved with SharePoint URLs:")
        logger.info(f"  - web_url: {document.sharepoint_web_url}")
        logger.info(f"  - download_url: {document.sharepoint_download_url}")
        logger.info(f"  - server_relative_url: {document.sharepoint_server_relative_url}")
        
        # Log successful upload
        DocumentAccessService.log_document_access(
            document=document,
            user=user,
            action=DocumentAuditLog.ActionType.UPLOADED,
            request=request,
            success=True,
            metadata={
                'sharepoint_id': sharepoint_result['id'],
                'file_path': file_path
            }
        )
        
        logger.info(f"Successfully uploaded document {document.id} to SharePoint")
        
        return {
            "success": True,
            "sharepoint_id": document.sharepoint_id,
            "sharepoint_url": document.sharepoint_web_url,
            "message": "File uploaded successfully to SharePoint"
        }
        
    except Exception as e:
        logger.error(f"Failed to upload document {document.id}: {str(e)}")
        
        # Update document status to failed
        document.status = 'failed'
        document.upload_error = str(e)
        document.save()
        
        # Log failed upload
        DocumentAccessService.log_document_access(
            document=document,
            user=user,
            action=DocumentAuditLog.ActionType.UPLOADED,
            request=request,
            success=False,
            error_message=str(e)
        )
        
        # Check if it's a permissions error and provide helpful message
        error_message = str(e)
        if "403" in error_message or "Forbidden" in error_message:
            error_message = (
                "SharePoint upload failed due to insufficient permissions. "
                "Please ensure the Azure AD application has Sites.ReadWrite.All and Files.ReadWrite.All permissions. "
                "See docs/04-development/backend/azure-ad-sharepoint-permissions.md for setup instructions."
            )
        elif "401" in error_message or "Unauthorized" in error_message:
            error_message = (
                "SharePoint authentication failed. Please check Azure AD client credentials in environment variables."
            )
        
        return Response({"error": f"Upload failed: {error_message}"}, status=500)

@documents_router.get("/client/{client_id}/folders", response=dict)
@auth_required
def get_client_folder_urls(request, client_id: str):
    """Get SharePoint folder URLs for a client."""
    sharepoint_service = SharePointURLService()
    
    return {
        "client_folder": sharepoint_service.get_client_folder_web_url(client_id),
        "folder_structure": sharepoint_service.generate_folder_structure_paths(client_id)
    }
