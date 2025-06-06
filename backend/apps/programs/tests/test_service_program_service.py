import pytest
from uuid import uuid4
from datetime import date, timedelta
from django.contrib.auth import get_user_model

from apps.service_management.models import ServiceProgram, ServiceAssignedStaff
from apps.service_management.services import ServiceProgramService
from apps.service_management.schemas import ServiceProgramIn, ServiceAssignedStaffIn

# Import shared fixtures
from .test_fixtures import service_test_user, staff_member_for_service, option_list_items

User = get_user_model()

@pytest.mark.django_db
class TestServiceProgramService:
    def test_create_service_program(self, service_test_user, staff_member_for_service, option_list_items):
        staff_input_data = [
            ServiceAssignedStaffIn(
                staff_id=staff_member_for_service.id,
                role="Coordinator",
                fte=1.0,
                is_responsible=True,
                start_date=date.today()
            )
        ]
        program_data_dict = {
            "name":"New Service Program via Service",
            "description":"Detailed description.",
            "service_types":[option_list_items['service_type'].id],
            "delivery_modes":[option_list_items['delivery_mode'].id],
            "locations":[option_list_items['location'].id],
            "start_date":date.today(),
            "status":"operational",
            "staff_input": staff_input_data
        }
        program_data = ServiceProgramIn(**program_data_dict)


        program = ServiceProgramService.create_service_program(data=program_data, user_id=service_test_user.id)
        program.refresh_from_db()

        assert program is not None
        assert program.name == "New Service Program via Service"
        assert program.created_by == service_test_user
        assert program.updated_by == service_test_user
        assert program.status == "operational" # Check default status

        # Staff assignment is handled within create_service_program if staff_input is provided
        assert ServiceAssignedStaff.objects.filter(service_program=program, staff=staff_member_for_service).exists()
        assert program.service_types.count() == 1

    def test_get_service_program(self, service_test_user):
        program = ServiceProgram.objects.create(
            name="Existing Program", 
            start_date=date.today(), 
            created_by=service_test_user,
            status="operational"
        )
        retrieved_program = ServiceProgramService.get_service_program(program_id=program.id)
        assert retrieved_program is not None
        assert retrieved_program.id == program.id

    def test_get_non_existent_service_program(self):
        retrieved_program = ServiceProgramService.get_service_program(program_id=uuid4())
        assert retrieved_program is None

    def test_update_service_program(self, service_test_user, staff_member_for_service, option_list_items):
        original_program = ServiceProgram.objects.create(
            name="Original Program Name", 
            start_date=date.today(), 
            created_by=service_test_user,
            description="Original desc",
            status="operational"
        )
        original_program.service_types.add(option_list_items['service_type'])

        new_staff_user, _ = User.objects.get_or_create(username='newstaffsvc', defaults={'email': 'new@staff.svc'})

        staff_update_data = [
            ServiceAssignedStaffIn(
                staff_id=staff_member_for_service.id,
                role="Manager Updated",
                fte=0.5,
                is_responsible=False,
                start_date=date.today() - timedelta(days=10)
            ),
            ServiceAssignedStaffIn(
                staff_id=new_staff_user.id,
                role="New Assistant",
                fte=1.0,
                is_responsible=True,
                start_date=date.today()
            )
        ]

        update_payload_data_dict = {
            "name": "Updated Program Name by Service",
            "description": "Updated description.",
            "service_types": [],
            "start_date": date.today(),
            "status": "operational",
            "staff_input": staff_update_data
        }
        update_data = ServiceProgramIn(**update_payload_data_dict)

        updated_program = ServiceProgramService.update_service_program(
            program_id=original_program.id, 
            data=update_data, 
            user_id=service_test_user.id
        )
        updated_program.refresh_from_db() # Staff update is handled within update_service_program

        assert updated_program.name == "Updated Program Name by Service"
        assert updated_program.description == "Updated description."
        assert updated_program.service_types.count() == 0 
        assert updated_program.updated_by == service_test_user
        
        assert ServiceAssignedStaff.objects.filter(service_program=updated_program).count() == 2
        staff_manager_updated = ServiceAssignedStaff.objects.get(service_program=updated_program, staff=staff_member_for_service)
        assert staff_manager_updated.role == "Manager Updated"
        assert staff_manager_updated.fte == 0.5
        assert ServiceAssignedStaff.objects.filter(service_program=updated_program, staff=new_staff_user, role="New Assistant").exists()

    def test_delete_service_program(self, service_test_user):
        program_to_delete = ServiceProgram.objects.create(
            name="Program to Delete", 
            start_date=date.today(), 
            created_by=service_test_user,
            status="operational"
        )
        success = ServiceProgramService.delete_service_program(program_id=program_to_delete.id, user_id=service_test_user.id)
        assert success is True
        
        # Verify it's marked as deleted
        deleted_program_check = ServiceProgram.objects.get(id=program_to_delete.id)
        assert deleted_program_check.is_deleted is True
        assert deleted_program_check.deleted_by == service_test_user
        assert deleted_program_check.deleted_at is not None

    def test_delete_non_existent_service_program(self, service_test_user):
        success = ServiceProgramService.delete_service_program(program_id=uuid4(), user_id=service_test_user.id)
        assert success is False
