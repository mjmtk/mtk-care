"""
Secure document access views.
"""
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Document, DocumentAuditLog
from .services import DocumentAccessService, SharePointURLService
from apps.authentication.decorators import auth_required


class SecureDocumentAccessView(APIView):
    """
    Secure proxy for document access that enforces permissions and logging.
    Never exposes direct SharePoint URLs to clients.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, document_id):
        """
        Provide secure access to documents with permission checking and audit logging.
        """
        try:
            document = get_object_or_404(Document, id=document_id)
            action = request.GET.get('action', 'view')
            
            # Check permissions
            if not DocumentAccessService.can_user_access_document(request.user, document):
                # Log access denial
                DocumentAccessService.log_document_access(
                    document=document,
                    user=request.user,
                    action=DocumentAuditLog.ActionType.ACCESS_DENIED,
                    request=request,
                    success=False,
                    error_message="Insufficient permissions"
                )
                
                return Response(
                    {"error": "You don't have permission to access this document"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate appropriate SharePoint URL based on action
            sharepoint_service = SharePointURLService()
            
            if action == 'download':
                sharepoint_url = sharepoint_service.get_document_download_url(document)
                audit_action = DocumentAuditLog.ActionType.DOWNLOADED
            elif action == 'preview':
                sharepoint_url = sharepoint_service.get_document_preview_url(document)
                audit_action = DocumentAuditLog.ActionType.VIEWED
            else:  # Default to view
                sharepoint_url = sharepoint_service.get_document_download_url(document)
                audit_action = DocumentAuditLog.ActionType.VIEWED
            
            if not sharepoint_url:
                return Response(
                    {"error": "Document not available in SharePoint"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Log successful access
            DocumentAccessService.log_document_access(
                document=document,
                user=request.user,
                action=audit_action,
                request=request,
                success=True,
                metadata={'sharepoint_access': True, 'action': action}
            )
            
            # Return the SharePoint URL for redirect
            # In production, you might want to proxy the content instead of redirecting
            return Response({
                "url": sharepoint_url,
                "filename": document.file_name,
                "size": document.file_size,
                "mime_type": document.mime_type
            })
            
        except Exception as e:
            # Log the error
            DocumentAccessService.log_document_access(
                document=document if 'document' in locals() else None,
                user=request.user,
                action=DocumentAuditLog.ActionType.ACCESS_DENIED,
                request=request,
                success=False,
                error_message=str(e)
            )
            
            return Response(
                {"error": "Failed to access document"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentShareLinkView(APIView):
    """
    Generate temporary shareable links for documents.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, document_id):
        """
        Generate a temporary shareable link for a document.
        """
        document = get_object_or_404(Document, id=document_id)
        
        # Check permissions
        if not DocumentAccessService.can_user_access_document(request.user, document):
            return Response(
                {"error": "You don't have permission to share this document"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate temporary share link (implement your own token-based system)
        # For now, return the secure access URL
        secure_url = DocumentAccessService.get_secure_document_url(document, request.user, 'view')
        
        # Log sharing action
        DocumentAccessService.log_document_access(
            document=document,
            user=request.user,
            action=DocumentAuditLog.ActionType.SHARED,
            request=request,
            metadata={'share_url_generated': True}
        )
        
        return Response({
            "share_url": secure_url,
            "expires_in": "7 days",  # Example expiration
            "document_name": document.file_name
        })


class ClientDocumentListView(APIView):
    """
    Secure view for listing client documents with proper URLs.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, client_id):
        """
        List all documents for a client with secure access URLs.
        """
        # TODO: Add client permission checking
        
        documents = Document.objects.filter(
            client_id=client_id,
            is_latest_version=True
        ).select_related('type').order_by('-created_at')
        
        sharepoint_service = SharePointURLService()
        
        document_list = []
        for doc in documents:
            # Generate secure URLs that go through our proxy
            view_url = DocumentAccessService.get_secure_document_url(doc, request.user, 'view')
            download_url = DocumentAccessService.get_secure_document_url(doc, request.user, 'download')
            
            document_data = {
                'id': doc.id,
                'filename': doc.file_name,
                'size': doc.file_size,
                'mime_type': doc.mime_type,
                'category': doc.get_folder_category_display(),
                'description': doc.description,
                'uploaded_at': doc.uploaded_at,
                'status': doc.status,
                'view_url': view_url,
                'download_url': download_url,
                'referral_id': doc.referral_id,
            }
            
            document_list.append(document_data)
        
        return Response({
            'client_id': client_id,
            'documents': document_list,
            'folder_url': sharepoint_service.get_client_folder_web_url(client_id)
        })


class DocumentAuditView(APIView):
    """
    View for accessing document audit logs (admin only).
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, document_id=None):
        """
        Get audit logs for a specific document or all documents.
        """
        # TODO: Add admin permission check
        
        if document_id:
            logs = DocumentAuditLog.objects.filter(
                document_id=document_id
            ).select_related('user', 'document').order_by('-created_at')
        else:
            logs = DocumentAuditLog.objects.all().select_related(
                'user', 'document'
            ).order_by('-created_at')[:100]  # Limit for performance
        
        audit_data = []
        for log in logs:
            audit_data.append({
                'id': log.id,
                'action': log.action,
                'user': log.user.username if log.user else 'System',
                'document': log.document.file_name if log.document else 'Deleted',
                'timestamp': log.created_at,
                'ip_address': log.ip_address,
                'success': log.success,
                'error_message': log.error_message,
                'metadata': log.metadata
            })
        
        return Response({
            'audit_logs': audit_data
        })