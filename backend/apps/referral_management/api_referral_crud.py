from ninja import Router
from .schemas import ReferralIn, ReferralOut, OptionListItemOut, ReferralStatusOut, ReferralPriorityOut, ReferralTypeOut, DropdownItemOut, ReferralStatusUpdateIn, DetailOut
from .models import Referral, ReferralStatus, ReferralPriority, ReferralType
from apps.optionlists.models import OptionList, OptionListItem
from django.shortcuts import get_object_or_404
from typing import List, Optional
from uuid import UUID
from apps.client_management.schemas import ClientSchema
from apps.client_management.models import Client # For type hinting
import traceback

# Helper function to prepare ClientOut data
def _prepare_client_out_data(client_obj: Client) -> Optional[ClientSchema]:
    if not client_obj:
        return None
    try:
        client_data_dict = {
            'id': client_obj.id,
            'first_name': client_obj.first_name,
            'last_name': client_obj.last_name,
            'date_of_birth': client_obj.date_of_birth,
            'email': client_obj.email,
            'phone': client_obj.phone,
            'status': client_obj.status_id,
            'pronoun': client_obj.pronoun_id,
            'pronoun_other': client_obj.pronoun_other,
            'primary_language': client_obj.primary_language_id,
            'interpreter_needed': client_obj.interpreter_needed,
            'address_street': client_obj.address_street,
            'address_city': client_obj.address_city,
            'address_postcode': client_obj.address_postcode,
            'country_context': client_obj.country_context_id,
            'country_of_birth': client_obj.country_of_birth_id,
            'iwi': client_obj.iwi,
            'cultural_groups': list(client_obj.cultural_groups.values_list('id', flat=True)) if client_obj.cultural_groups.exists() else [],
            'cultural_group_other': client_obj.cultural_group_other,
            'ethnicities': [str(item.id) for item in client_obj.ethnicities.all()],
            'primary_identity': client_obj.primary_identity_id,
            'secondary_identities': [str(item.id) for item in client_obj.secondary_identities.all()],
            'secondary_identity_other': client_obj.secondary_identity_other,
            'nhi_facility_code': client_obj.nhi_facility_code,
            'notes': client_obj.notes,
            'gender': client_obj.gender,
            'emergency': bool(client_obj.emergency) if isinstance(client_obj.emergency, list) else None,
            'uploaded_documents': client_obj.uploaded_documents if isinstance(client_obj.uploaded_documents, dict) else ({} if client_obj.uploaded_documents else None),
            'bypass_reasons': client_obj.bypass_reasons,
            'created_at': client_obj.created_at.date() if client_obj.created_at else None,
            'updated_at': client_obj.updated_at.date() if client_obj.updated_at else None,
        }
        return ClientSchema(**client_data_dict)
    except Exception as e:
        print(f"DEBUG: Could not create ClientOut from client_data_dict for client {client_obj.id}: {e}")
        traceback.print_exc()
        return None

router = Router()

def get_authenticated_user(request):
    """Get authenticated user from request - works in both auth bypass and normal mode."""
    return request.user if hasattr(request, 'user') and request.user.is_authenticated else request.auth

@router.get("/", response=List[ReferralOut])
def list_referrals(request):
    referrals_data = []
    # Use select_related to efficiently fetch client data
    for ref in Referral.objects.select_related('client').all():
        client_details_data = None
        client_id_val = None
        if ref.client:
            client_id_val = ref.client.id
            client_details_data = _prepare_client_out_data(ref.client)

        referral_out_instance = ReferralOut(
            id=ref.id,
            type=ref.type_id,
            status=ref.status_id,
            priority=ref.priority_id,
            service_type=ref.service_type_id,
            client_id=client_id_val,
            client_details=client_details_data,
            client_type=ref.client_type,
            reason=ref.reason,
            referral_date=ref.referral_date,
            accepted_date=ref.accepted_date,
            completed_date=ref.completed_date,
            follow_up_date=ref.follow_up_date,
            client_consent_date=ref.client_consent_date,
            notes=ref.notes,
            external_organisation=ref.external_organisation_id,
            external_organisation_contact=ref.external_organisation_contact_id,
        )
        referrals_data.append(referral_out_instance)
    return referrals_data

@router.get("/{uuid:referral_id}", response=ReferralOut)
def retrieve_referral(request, referral_id: UUID):
    ref = get_object_or_404(Referral.objects.select_related('client'), pk=referral_id)
    client_details_data = None
    client_id_val = None
    if ref.client:
        client_id_val = ref.client.id
        client_details_data = _prepare_client_out_data(ref.client)

    return ReferralOut(
        id=ref.id,
        type=ref.type_id,
        status=ref.status_id,
        priority=ref.priority_id,
        service_type=ref.service_type_id,
        client_id=client_id_val,
        client_details=client_details_data,
        client_type=ref.client_type,
        reason=ref.reason,
        referral_date=ref.referral_date,
        accepted_date=ref.accepted_date,
        completed_date=ref.completed_date,
        follow_up_date=ref.follow_up_date,
        client_consent_date=ref.client_consent_date,
        notes=ref.notes,
        external_organisation=ref.external_organisation_id,
        external_organisation_contact=ref.external_organisation_contact_id,
    )

@router.patch("/{uuid:referral_id}", response={200: ReferralOut, 404: None})
def update_referral(request, referral_id: UUID, data: ReferralIn):
    ref = Referral.objects.filter(pk=referral_id).first()
    if not ref:
        return 404, None
    data_dict = data.dict(exclude_unset=True)
    fk_fields = [
        ("type", OptionListItem),
        ("status", OptionListItem),
        ("priority", OptionListItem),
        ("service_type", OptionListItem),
        ("client", "client_management.Client"),
        ("external_organisation", "external_organisation_management.ExternalOrganisation"),
        ("external_organisation_contact", "external_organisation_management.ExternalOrganisationContact"),
    ]
    for field, model in fk_fields:
        if field in data_dict and data_dict[field] is not None:
            if isinstance(model, str):
                from django.apps import apps
                model_cls = apps.get_model(model)
            else:
                model_cls = model
            data_dict[field] = model_cls.objects.get(pk=data_dict[field])
    for k, v in data_dict.items():
        setattr(ref, k, v)
    # Call the custom save method, passing the authenticated user
    # The save() method in SoftDeleteModel will handle updated_by
    ref.save(user=get_authenticated_user(request))
    client_details_data = None
    client_id_val = None
    if ref.client:
        # Ensure client is fetched if not already; after save, ref.client should be populated
        ref.refresh_from_db() # to ensure client relation is fresh if it was just set by ID
        client_id_val = ref.client.id
        client_details_data = _prepare_client_out_data(ref.client)

    result = ReferralOut(
        id=ref.id,
        type=ref.type_id,
        status=ref.status_id,
        priority=ref.priority_id,
        service_type=ref.service_type_id,
        client_id=client_id_val,
        client_details=client_details_data,
        client_type=ref.client_type,
        reason=ref.reason,
        referral_date=ref.referral_date,
        accepted_date=ref.accepted_date,
        completed_date=ref.completed_date,
        follow_up_date=ref.follow_up_date,
        client_consent_date=ref.client_consent_date,
        notes=ref.notes,
        external_organisation=ref.external_organisation_id,
        external_organisation_contact=ref.external_organisation_contact_id,
    )
    return 200, result

@router.delete("/{uuid:referral_id}", response={204: None, 404: None})
def delete_referral(request, referral_id: UUID):
    ref = Referral.objects.filter(pk=referral_id).first()
    if not ref:
        return 404, None
    ref.delete()
    return 204, None

from ninja.responses import Response
from django.http import HttpResponse

@router.post("/", response={201: ReferralOut})
def create_referral(request, data: ReferralIn):
    fk_fields = [
        ("type", OptionListItem),
        ("status", OptionListItem),
        ("priority", OptionListItem),
        ("service_type", OptionListItem),
        ("client", "client_management.Client"),
        ("external_organisation", "external_organisation_management.ExternalOrganisation"),
        ("external_organisation_contact", "external_organisation_management.ExternalOrganisationContact"),
    ]
    data_dict = data.dict()
    for field, model in fk_fields:
        if field in data_dict and data_dict[field] is not None:
            if isinstance(model, str):
                from django.apps import apps
                model_cls = apps.get_model(model)
            else:
                model_cls = model
            data_dict[field] = model_cls.objects.get(pk=data_dict[field])
    # Instantiate the model with data_dict
    ref = Referral(**data_dict)
    # Call the custom save method, passing the authenticated user
    # The save() method in SoftDeleteModel will handle created_by and updated_by
    ref.save(user=get_authenticated_user(request))
    client_details_data = None
    client_id_val = None
    if ref.client:
        client_id_val = None
    client_details_data = None
    if ref.client:
        client_id_val = ref.client.id
        # ref.client should be a full Client instance after save
        client_details_data = _prepare_client_out_data(ref.client)

    result = ReferralOut(
        id=ref.id,
        type=ref.type_id,
        status=ref.status_id,
        priority=ref.priority_id,
        service_type=ref.service_type_id,
        client_id=client_id_val,
        client_details=client_details_data,
        client_type=ref.client_type,
        reason=ref.reason,
        referral_date=ref.referral_date,
        accepted_date=ref.accepted_date,
        completed_date=ref.completed_date,
        follow_up_date=ref.follow_up_date,
        client_consent_date=ref.client_consent_date,
        notes=ref.notes,
        external_organisation=ref.external_organisation_id,
        external_organisation_contact=ref.external_organisation_contact_id,
    )
    return 201, result


@router.get("/batch-optionlists/", response=dict[str, List[DropdownItemOut]])
def batch_optionlists(request):
    option_list_slugs = [
        "referral-types",
        "referral-statuses",
        "referral-priorities",
        "referral-service-types",
        # TODO: Consider adding external_service_providers if it's OptionList based or handle separately
    ]
    
    response_data = {}
    
    for slug in option_list_slugs:
        try:
            option_list = OptionList.objects.get(slug=slug)
            items = OptionListItem.objects.filter(option_list=option_list, is_active=True).order_by('sort_order', 'name')
            
            dropdown_items = []
            for item in items:
                label_to_use = item.label if item.label else item.name
                dropdown_items.append(DropdownItemOut(id=item.id, label=label_to_use))
            response_data[slug] = dropdown_items
            
        except OptionList.DoesNotExist:
            response_data[slug] = [] # Return empty list if OptionList slug not found
            
    return response_data


@router.patch("/{referral_id}/update-status/", response={200: ReferralOut, 400: DetailOut, 404: DetailOut}, tags=["Referrals"])
def update_referral_status(request, referral_id: UUID, payload: ReferralStatusUpdateIn):
    referral = get_object_or_404(Referral, id=referral_id)
    
    try:
        # Ensure the status_id belongs to the 'referral-statuses' OptionList for safety
        new_status = OptionListItem.objects.get(pk=payload.status_id, option_list__slug="referral-statuses")
    except OptionListItem.DoesNotExist:
        # Using a 400 error for invalid input, could also be 404 if status_id is seen as a sub-resource not found
        return 400, {"detail": f"Invalid status_id: {payload.status_id} or it does not belong to 'referral-statuses'."}

    referral.status = new_status
    # Assuming your Referral model's save method can take a 'user' argument to update 'updated_by'
    # If not, you might need to set referral.updated_by = request.auth manually before saving
    referral.save(user=get_authenticated_user(request)) 

    # Prepare the output using the same logic as retrieve_referral or create_referral for consistency
    client_details_data = None
    client_id_val = None
    if referral.client:
        client_id_val = referral.client.id
        # _prepare_client_out_data is a helper, ensure it's defined and accessible in this file's scope
        client_details_data = _prepare_client_out_data(referral.client) 

    return ReferralOut(
        id=referral.id,
        type=referral.type_id,
        status=referral.status_id, # This should now reflect the new_status.id
        priority=referral.priority_id,
        service_type=referral.service_type_id,
        client_id=client_id_val,
        client_details=client_details_data,
        client_type=referral.client_type,
        reason=referral.reason,
        referral_date=referral.referral_date,
        accepted_date=referral.accepted_date,
        completed_date=referral.completed_date,
        follow_up_date=referral.follow_up_date,
        client_consent_date=referral.client_consent_date,
        notes=referral.notes,
        external_organisation=referral.external_organisation_id,
        external_organisation_contact=referral.external_organisation_contact_id,
    )
