from ninja import Router
from ninja.responses import Response
from .models import Document, DocumentAuditLog
from .schemas import DocumentSchema, DocumentCreateSchema, DocumentUpdateSchema
from .services import SharePointURLService, DocumentAccessService
from typing import List, Optional
from django.shortcuts import get_object_or_404
from apps.authentication.decorators import auth_required

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

@documents_router.get("/client/{client_id}/folders", response=dict)
@auth_required
def get_client_folder_urls(request, client_id: str):
    """Get SharePoint folder URLs for a client."""
    sharepoint_service = SharePointURLService()
    
    return {
        "client_folder": sharepoint_service.get_client_folder_web_url(client_id),
        "folder_structure": sharepoint_service.generate_folder_structure_paths(client_id)
    }
