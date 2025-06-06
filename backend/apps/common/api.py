from ninja import Router
from .models import Document
from .schemas import DocumentSchema, DocumentCreateSchema, DocumentUpdateSchema
from typing import List
from django.shortcuts import get_object_or_404

router = Router()

@router.get("/documents/", response=List[DocumentSchema])
def list_documents(request, client_id: str = None):
    qs = Document.objects.all()
    if client_id:
        qs = qs.filter(client_id=client_id)
    return qs

@router.get("/documents/{doc_id}/", response=DocumentSchema)
def get_document(request, doc_id: str):
    return get_object_or_404(Document, id=doc_id)

@router.post("/documents/", response=DocumentSchema)
def create_document(request, data: DocumentCreateSchema):
    doc = Document.objects.create(
        client_id=data.client_id,
        file_name=data.file_name,
        sharepoint_id=data.sharepoint_id,
        type_id=data.type_id,
        status_id=data.status_id,
        metadata=data.metadata
    )
    return doc

@router.put("/documents/{doc_id}/", response=DocumentSchema)
def update_document(request, doc_id: str, data: DocumentUpdateSchema):
    doc = get_object_or_404(Document, id=doc_id)
    for attr, value in data.dict(exclude_unset=True).items():
        setattr(doc, attr, value)
    doc.save()
    return doc

@router.delete("/documents/{doc_id}/")
def delete_document(request, doc_id: str):
    doc = get_object_or_404(Document, id=doc_id)
    doc.delete()
    return {"success": True}
