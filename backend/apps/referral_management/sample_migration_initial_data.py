# Example of how to create a data migration for initial data
# Run: python manage.py makemigrations referral_system --empty --name create_initial_data
# Then add this code to the migration file

from django.db import migrations


def create_initial_data(apps, schema_editor):
    # Create initial ReferralStatus records
    ReferralStatus = apps.get_model('referral_system', 'ReferralStatus')
    statuses = [
        {'name': 'PENDING', 'description': 'Awaiting review', 'order': 10},
        {'name': 'ACCEPTED', 'description': 'Referral has been accepted', 'order': 20},
        {'name': 'REJECTED', 'description': 'Referral has been rejected', 'order': 30},
        {'name': 'COMPLETED', 'description': 'Referral process is complete', 'order': 40},
        {'name': 'CANCELLED', 'description': 'Referral has been cancelled', 'order': 50},
    ]
    

    # Create initial ReferralPriority records
    ReferralPriority = apps.get_model('referral_system', 'ReferralPriority')
    priorities = [
        {'name': 'LOW', 'description': 'Low priority, can wait', 'order': 10},
        {'name': 'MEDIUM', 'description': 'Medium priority, normal processing', 'order': 20},
        {'name': 'HIGH', 'description': 'High priority, needs attention soon', 'order': 30},
        {'name': 'URGENT', 'description': 'Urgent priority, needs immediate attention', 'order': 40},
    ]
    
    for priority_data in priorities:
        ReferralPriority.objects.create(**priority_data)
    
    # Create initial ReferralType records
    ReferralType = apps.get_model('referral_system', 'ReferralType')
    types = [
        {'name': 'INCOMING', 'description': 'Referral from external provider to our organization'},
        {'name': 'OUTGOING', 'description': 'Referral from our organization to external provider'},
    ]
    
    for type_data in types:
        ReferralType.objects.create(**type_data)
    
    # Create initial ServiceType records
    ServiceType = apps.get_model('referral_system', 'ServiceType')
    service_types = [
        {'name': 'Mental Health', 'code': 'mental-health', 'description': 'Mental health services'},
        {'name': 'Family Support', 'code': 'family-support', 'description': 'Family support services'},
        {'name': 'Youth Services', 'code': 'youth-services', 'description': 'Youth services and programs'},
        {'name': 'Substance Use', 'code': 'substance-use', 'description': 'Substance use services'},
        {'name': 'Housing Support', 'code': 'housing-support', 'description': 'Housing support services'},
    ]
    
    for service_type_data in service_types:
        ServiceType.objects.create(**service_type_data)


def create_client_initial_data(apps, schema_editor):

    # Create initial ClientStatus records
    ClientStatus = apps.get_model('client_management', 'ClientStatus')
    statuses = [
        {'name': 'active', 'description': 'Client is currently receiving services'},
        {'name': 'inactive', 'description': 'Client is not currently receiving services'},
        {'name': 'discharged', 'description': 'Client has been discharged from all services'},
        {'name': 'waitlist', 'description': 'Client is on a waitlist for services'},
    ]
    




class Migration(migrations.Migration):

    dependencies = [
        # Add dependencies to the models being referenced
        # Example: ('referral_system', '0001_initial'),
        # Example: ('client_management', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_data),
        migrations.RunPython(create_client_initial_data),
    ]