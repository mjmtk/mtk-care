from rest_framework import serializers
from .models import ServiceProgram, Enrolment, ServiceProgramFunding, ServiceCulturalGroup, ServiceAssignedStaff, ServiceAssessmentForm, ServiceRegion # Removed ServiceTypeLink, ServiceDeliveryMode

from apps.optionlists.models import OptionListItem
from apps.optionlists.serializers import SimpleOptionListItemSerializer

class ServiceAssignedStaffSerializer(serializers.ModelSerializer):
    staff_first_name = serializers.CharField(source='staff.first_name', read_only=True)
    staff_last_name = serializers.CharField(source='staff.last_name', read_only=True)

    class Meta:
        model = ServiceAssignedStaff
        fields = [
            'id', 'service_program', 'staff', 'role', 'fte', 'is_responsible', 'start_date', 'end_date',
            'staff_first_name', 'staff_last_name'
        ]

class ServiceBatchOptionListsResponseSerializer(serializers.Serializer):
    service_types = SimpleOptionListItemSerializer(many=True)
    delivery_modes = SimpleOptionListItemSerializer(many=True)
    locations = SimpleOptionListItemSerializer(many=True)
    schema = serializers.DictField()


class DynamicManyToManyFieldsMixin:
    """
    Mixin to dynamically add PrimaryKeyRelatedFields for all ManyToManyFields on the model.
    Excludes fields with custom logic or those listed in `exclude_m2m_fields`.
    Uses get_fields for runtime queryset evaluation (test/transaction safe).
    """
    exclude_m2m_fields = set()

    def get_fields(self):
        fields = super().get_fields()
        model = getattr(getattr(self, 'Meta', None), 'model', None)
        if model:
            for field in model._meta.get_fields():
                if (
                    field.many_to_many
                    and not field.auto_created
                    and field.name not in getattr(self, 'exclude_m2m_fields', set())
                    and field.name not in fields
                ):
                    # OptionListItem-based M2Ms
                    if hasattr(field, 'related_model') and field.related_model.__name__ == 'OptionListItem':
                        limit_choices = getattr(field, 'limit_choices_to', None)
                        if limit_choices and not isinstance(limit_choices, dict):
                            try:
                                limit_choices = limit_choices.children[0] if hasattr(limit_choices, 'children') else {}
                            except Exception:
                                limit_choices = {}
                        # Satisfy DRF: set queryset to .none(), add get_{field_name}_queryset for runtime
                        def make_queryset_method(related_model, limit_choices):
                            def _get_queryset(self):
                                qs = related_model.objects.all()
                                if limit_choices:
                                    qs = qs.filter(**limit_choices)
                                return qs
                            return _get_queryset
                        method_name = f'get_{field.name}_queryset'
                        setattr(self, method_name, make_queryset_method(field.related_model, limit_choices).__get__(self))
                        drf_field = serializers.PrimaryKeyRelatedField(queryset=field.related_model.objects.none(), many=True, required=False, allow_empty=True)
                    else:
                        def make_queryset_method(related_model):
                            def _get_queryset(self):
                                return related_model.objects.all()
                            return _get_queryset
                        method_name = f'get_{field.name}_queryset'
                        setattr(self, method_name, make_queryset_method(field.related_model).__get__(self))
                        drf_field = serializers.PrimaryKeyRelatedField(queryset=field.related_model.objects.none(), many=True, required=False, allow_empty=True)
                    fields[field.name] = drf_field
        return fields


class ServiceProgramSerializer(serializers.ModelSerializer):
    # Ensure that related queries exclude soft-deleted ServicePrograms
    def to_representation(self, instance):
        # Optionally filter out soft-deleted related objects if needed
        return super().to_representation(instance)

    def validate(self, data):
        staff_data = data.get('staff_input', None)
        if staff_data is None or not staff_data:
            raise serializers.ValidationError({
                'staff': 'You must provide at least one staff assignment.'
            })
        if not any(s.get('is_responsible', False) for s in staff_data):
            raise serializers.ValidationError({
                'staff': 'At least one staff assignment must have is_responsible=true.'
            })
        return data

    # Explicitly declare all M2M fields for robust DRF/test compatibility
    # Use a callable for queryset to ensure fresh evaluation at runtime (DRF 3.16+)
    service_types = serializers.PrimaryKeyRelatedField(
        queryset=OptionListItem.objects.filter(option_list__slug='service_management-service_types'),
        many=True, required=False, allow_empty=True
    )
    delivery_modes = serializers.PrimaryKeyRelatedField(
        queryset=OptionListItem.objects.filter(option_list__slug='service_management-delivery_modes'),
        many=True, required=False, allow_empty=True
    )
    locations = serializers.PrimaryKeyRelatedField(
        queryset=OptionListItem.objects.filter(option_list__slug='service_management-locations'),
        many=True, required=False, allow_empty=True
    )
    funding_agencies = serializers.PrimaryKeyRelatedField(
        queryset=OptionListItem.objects.filter(option_list__slug='service_management-funding_agencies'),
        many=True, required=False, allow_empty=True
    )

    def get_service_types_queryset(self):
        return OptionListItem.objects.filter(option_list__slug='service_management-service_types')

    def get_delivery_modes_queryset(self):
        return OptionListItem.objects.filter(option_list__slug='service_management-delivery_modes')

    def get_locations_queryset(self):
        return OptionListItem.objects.filter(option_list__slug='service_management-locations')

    def get_funding_agencies_queryset(self):
        return OptionListItem.objects.filter(option_list__slug='service_management-funding_agencies')

    # If you have a CulturalGroup model, adjust as needed:
    # Use lazy import to avoid circular import
    def _get_cultural_groups_queryset():
        from apps.cultural_groups.models import CulturalGroup
        return CulturalGroup.objects.all()
    def _get_assessment_forms_queryset():
        from apps.assessment_forms.models import AssessmentForm
        return AssessmentForm.objects.all()
    cultural_groups = serializers.PrimaryKeyRelatedField(
        queryset=_get_cultural_groups_queryset(),
        many=True, required=False, allow_empty=True
    )
    assessment_forms = serializers.PrimaryKeyRelatedField(
        queryset=_get_assessment_forms_queryset(),
        many=True, required=False, allow_empty=True
    )

    status = serializers.CharField(required=False, help_text="Service status: 'draft', 'inactive', 'operational', or 'archived'. 'inactive' means setup complete but not yet operational.")

    staff = ServiceAssignedStaffSerializer(many=True, source='serviceassignedstaff_set', read_only=True)
    staff_input = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of staff assignments: [{staff_id, role, fte, is_responsible}]"
    )



    def validate_staff_input(self, value):
        errors = []
        for i, staff in enumerate(value):
            staff_id = staff.get('staff_id')
            if staff_id in (None, '', 'undefined'):
                errors.append(f"Entry {i}: staff_id is required and cannot be empty or 'undefined'.")
            if 'role' not in staff or not staff['role']:
                errors.append(f"Entry {i}: role is required.")
            if 'fte' not in staff or staff['fte'] in (None, '', 'undefined'):
                errors.append(f"Entry {i}: fte is required.")
            if 'is_responsible' not in staff:
                errors.append(f"Entry {i}: is_responsible is required.")
        if errors:
            raise serializers.ValidationError(errors)
        return value

    class Meta:
        model = ServiceProgram
        fields = (
            'id',
            'name',
            'description',
            'service_types',
            'delivery_modes',
            'locations',
            'funding_agencies',
            'cultural_groups',
            'assessment_forms',
            'status',
            'staff',
            'staff_input',
            'start_date',
            'end_date',
            'extra_data',
        )

    def create(self, validated_data):
        staff_data = validated_data.pop('staff_input', [])
        service_program = super().create(validated_data)
        self._sync_staff(service_program, staff_data)
        return service_program

    def update(self, instance, validated_data):
        staff_data = validated_data.pop('staff_input', None)
        service_program = super().update(instance, validated_data)
        if staff_data is not None:
            self._sync_staff(service_program, staff_data)
        return service_program

    def _sync_staff(self, service_program, staff_data):
        from .models import ServiceAssignedStaff
        ServiceAssignedStaff.objects.filter(service_program=service_program).delete()
        for staff in staff_data:
            ServiceAssignedStaff.objects.create(
                service_program=service_program,
                staff_id=staff['staff_id'],
                role=staff['role'],
                fte=staff.get('fte', 1.0),
                is_responsible=staff.get('is_responsible', False),
                start_date=staff.get('start_date') or service_program.start_date,
                end_date=staff.get('end_date') or service_program.end_date
            )

    # DRF will now handle staff serialization via ServiceAssignedStaffSerializer; no custom to_representation needed.



class EnrolmentSerializer(serializers.ModelSerializer):
    def validate(self, data):
        # Extract relevant fields
        client = data.get('client')
        service_program = data.get('service_program')
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # For updates, exclude the current instance
        instance_id = self.instance.id if self.instance else None

        # Find overlapping enrolments
        overlapping = Enrolment.objects.filter(
            client=client,
            service_program=service_program
        )
        if instance_id:
            overlapping = overlapping.exclude(id=instance_id)
        # Overlap logic: (A starts before B ends) and (A ends after B starts)
        overlapping = overlapping.filter(
            start_date__lte=end_date if end_date else start_date,
            end_date__gte=start_date
        )
        if overlapping.exists():
            raise serializers.ValidationError(
                'Overlapping enrolment exists for this client and service during the selected period.'
            )
        return data

    class Meta:
        model = Enrolment
        fields = '__all__'


# Through/link table serializers (if needed for admin or API)
class ServiceProgramFundingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProgramFunding
        fields = '__all__'

class ServiceCulturalGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCulturalGroup
        fields = '__all__'



class ServiceAssessmentFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceAssessmentForm
        fields = '__all__'

class ServiceRegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRegion
        fields = '__all__'
