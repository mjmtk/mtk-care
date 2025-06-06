from ninja import Router
from .models import Document
from .schemas import DocumentSchema, DocumentCreateSchema, DocumentUpdateSchema
from typing import List
from django.shortcuts import get_object_or_404

documents_router = Router()

@documents_router.get("/", response=List[DocumentSchema])
def list_documents(request, client_id: str = None):
    qs = Document.objects.all()
    if client_id:
        qs = qs.filter(client_id=client_id)
    return qs

@documents_router.get("/{doc_id}/", response=DocumentSchema)
def get_document(request, doc_id: str):
    return get_object_or_404(Document, id=doc_id)

@documents_router.post("/", response=DocumentSchema)
def create_document(request, data: DocumentCreateSchema):
    create_kwargs = {
        'file_name': data.file_name,
        'sharepoint_id': data.sharepoint_id,
        'status_id': data.status_id,
        'metadata': data.metadata
    }
    if data.type_id is not None:
        create_kwargs['type_id'] = data.type_id

    doc = Document.objects.create(**create_kwargs)
    return doc

@documents_router.put("/{doc_id}/", response=DocumentSchema)
def update_document(request, doc_id: str, data: DocumentUpdateSchema):
    doc = get_object_or_404(Document, id=doc_id)
    for attr, value in data.dict(exclude_unset=True).items():
        setattr(doc, attr, value)
    doc.save()
    return doc

@documents_router.delete("/{doc_id}/")
def delete_document(request, doc_id: str):
    doc = get_object_or_404(Document, id=doc_id)
    doc.delete()
    return {"success": True}
