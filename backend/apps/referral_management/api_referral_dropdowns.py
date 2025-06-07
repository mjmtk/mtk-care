from ninja import Router, Schema
from typing import List, Optional

from apps.optionlists.models import OptionList, OptionListItem

# Reusable schema for simple dropdown items (id, label, slug)
class SimpleDropdownItemOut(Schema):
    id: int
    label: str
    slug: Optional[str] = None

# Schema for the referral batch dropdowns response
class ReferralBatchDropdownsOut(Schema):
    referral_statuses: List[SimpleDropdownItemOut] = []
    referral_service_types: List[SimpleDropdownItemOut] = []
    priorities: List[SimpleDropdownItemOut] = []
    sources: List[SimpleDropdownItemOut] = []
    closure_reasons: List[SimpleDropdownItemOut] = []
    rejection_reasons: List[SimpleDropdownItemOut] = []
    required_documents: List[SimpleDropdownItemOut] = []
    # Add other referral-specific dropdowns here as needed

router = Router()

@router.get("/", response=ReferralBatchDropdownsOut, summary="Get all dropdown values for referral forms and filters")
def referral_batch_dropdowns(request):
    """
    Returns all dropdown values needed for referral creation/editing and filtering.
    """
    result = {}

    optionlist_slug_map = {
        "referral_statuses": "referral-statuses",
        "referral_service_types": "common-specific-service-tags",
        "priorities": "referral-priorities",
        "sources": "referral-sources",
        "closure_reasons": "referral-closure-reasons",
        "rejection_reasons": "referral-rejection-reasons",
        "required_documents": "referral-required-documents",
    }

    for key, slug in optionlist_slug_map.items():
        try:
            option_list = OptionList.objects.get(slug=slug)
            items = OptionListItem.objects.filter(option_list=option_list, is_active=True).order_by("sort_order", "label")
            result[key] = [SimpleDropdownItemOut(id=item.id, label=item.label, slug=item.slug) for item in items]
        except OptionList.DoesNotExist:
            result[key] = []
        except Exception as e:
            # Log error for diagnostics, but return empty list for the specific dropdown
            print(f"Error fetching OptionList for slug '{slug}': {e}")
            result[key] = []

    return ReferralBatchDropdownsOut(**result)
