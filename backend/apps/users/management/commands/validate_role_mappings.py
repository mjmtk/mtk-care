from django.core.management.base import BaseCommand
from django.db import models
from apps.users.models import Role, GroupRoleMapping, User
import requests
import json
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Validate role mappings health for deployment readiness'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-azure',
            action='store_true',
            help='Also validate groups exist in Azure AD (requires API access)',
        )
        parser.add_argument(
            '--output-format',
            choices=['text', 'json'],
            default='text',
            help='Output format for CI/CD integration',
        )
        parser.add_argument(
            '--fail-on-warnings',
            action='store_true',
            help='Exit with error code if warnings are found',
        )

    def handle(self, *args, **options):
        check_azure = options['check_azure']
        output_format = options['output_format']
        fail_on_warnings = options['fail_on_warnings']

        # Collect all validation results
        results = {
            'status': 'PASS',
            'checks': [],
            'errors': [],
            'warnings': [],
            'summary': {}
        }

        # Run all validation checks
        self.check_roles_exist(results)
        self.check_role_mappings_exist(results)
        self.check_orphaned_mappings(results)
        self.check_duplicate_mappings(results)
        self.check_admin_access(results)
        
        if check_azure:
            self.check_azure_groups(results)

        # Generate summary
        results['summary'] = {
            'total_checks': len(results['checks']),
            'passed_checks': len([c for c in results['checks'] if c['status'] == 'PASS']),
            'failed_checks': len([c for c in results['checks'] if c['status'] == 'FAIL']),
            'warnings': len(results['warnings']),
            'errors': len(results['errors'])
        }

        # Determine overall status
        if results['errors'] or results['summary']['failed_checks'] > 0:
            results['status'] = 'FAIL'
        elif results['warnings'] and fail_on_warnings:
            results['status'] = 'FAIL'
        elif results['warnings']:
            results['status'] = 'WARN'

        # Output results
        if output_format == 'json':
            self.stdout.write(json.dumps(results, indent=2))
        else:
            self.output_text_format(results)

        # Exit with appropriate code for CI/CD
        if results['status'] == 'FAIL':
            exit(1)
        elif results['status'] == 'WARN' and fail_on_warnings:
            exit(1)
        else:
            exit(0)

    def check_roles_exist(self, results):
        """Verify all required roles exist in the database"""
        required_roles = [
            'Superuser', 'Administrator', 'Manager', 'Program Manager',
            'Supervisor', 'Team Lead', 'Practitioner', 'Volunteer'
        ]
        
        existing_roles = set(Role.objects.values_list('name', flat=True))
        missing_roles = [role for role in required_roles if role not in existing_roles]
        
        if missing_roles:
            results['checks'].append({
                'name': 'Required Roles Exist',
                'status': 'FAIL',
                'message': f'Missing roles: {", ".join(missing_roles)}'
            })
            results['errors'].append(f'Missing required roles: {missing_roles}')
        else:
            results['checks'].append({
                'name': 'Required Roles Exist',
                'status': 'PASS',
                'message': f'All {len(required_roles)} required roles exist'
            })

    def check_role_mappings_exist(self, results):
        """Verify role mappings exist"""
        mapping_count = GroupRoleMapping.objects.count()
        
        if mapping_count == 0:
            results['checks'].append({
                'name': 'Role Mappings Exist',
                'status': 'FAIL',
                'message': 'No role mappings found - users will not be able to access the system!'
            })
            results['errors'].append('No role mappings configured')
        else:
            results['checks'].append({
                'name': 'Role Mappings Exist',
                'status': 'PASS',
                'message': f'{mapping_count} role mappings configured'
            })

    def check_orphaned_mappings(self, results):
        """Check for mappings pointing to non-existent roles"""
        orphaned = GroupRoleMapping.objects.filter(role__isnull=True)
        orphaned_count = orphaned.count()
        
        if orphaned_count > 0:
            results['checks'].append({
                'name': 'No Orphaned Mappings',
                'status': 'FAIL',
                'message': f'{orphaned_count} mappings point to deleted roles'
            })
            results['errors'].append(f'{orphaned_count} orphaned role mappings found')
        else:
            results['checks'].append({
                'name': 'No Orphaned Mappings',
                'status': 'PASS',
                'message': 'All mappings have valid roles'
            })

    def check_duplicate_mappings(self, results):
        """Check for duplicate group mappings"""
        # Find groups mapped to multiple roles
        duplicates = GroupRoleMapping.objects.values('azure_ad_group_id').annotate(
            count=models.Count('id')
        ).filter(count__gt=1)
        
        if duplicates.exists():
            duplicate_groups = [d['azure_ad_group_id'] for d in duplicates]
            results['checks'].append({
                'name': 'No Duplicate Mappings',
                'status': 'WARN',
                'message': f'Groups with multiple role mappings: {duplicate_groups}'
            })
            results['warnings'].append(f'Duplicate mappings for groups: {duplicate_groups}')
        else:
            results['checks'].append({
                'name': 'No Duplicate Mappings',
                'status': 'PASS',
                'message': 'No duplicate group mappings found'
            })

    def check_admin_access(self, results):
        """Verify at least one group maps to Administrator role"""
        admin_role = Role.objects.filter(name='Administrator').first()
        if not admin_role:
            results['checks'].append({
                'name': 'Admin Access Available',
                'status': 'FAIL',
                'message': 'Administrator role does not exist'
            })
            results['errors'].append('Administrator role not found')
            return

        admin_mappings = GroupRoleMapping.objects.filter(role=admin_role).count()
        
        if admin_mappings == 0:
            results['checks'].append({
                'name': 'Admin Access Available',
                'status': 'FAIL',
                'message': 'No groups mapped to Administrator role - potential lockout!'
            })
            results['errors'].append('No administrator access configured')
        else:
            results['checks'].append({
                'name': 'Admin Access Available',
                'status': 'PASS',
                'message': f'{admin_mappings} groups have administrator access'
            })

    def check_azure_groups(self, results):
        """Validate that mapped groups still exist in Azure AD"""
        # This requires Azure credentials and is optional
        tenant_id = os.getenv('AZURE_TENANT_ID')
        client_id = os.getenv('AZURE_CLIENT_ID')
        client_secret = os.getenv('AZURE_CLIENT_SECRET')

        if not all([tenant_id, client_id, client_secret]):
            results['checks'].append({
                'name': 'Azure Groups Validation',
                'status': 'SKIP',
                'message': 'Azure credentials not available'
            })
            return

        try:
            # Get access token
            token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            token_data = {
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret,
                'scope': 'https://graph.microsoft.com/.default'
            }
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status()
            access_token = token_response.json()['access_token']

            # Check each mapped group
            headers = {'Authorization': f'Bearer {access_token}'}
            missing_groups = []
            
            mappings = GroupRoleMapping.objects.all()
            for mapping in mappings:
                group_url = f"https://graph.microsoft.com/v1.0/groups/{mapping.azure_ad_group_id}"
                response = requests.get(group_url, headers=headers)
                
                if response.status_code == 404:
                    missing_groups.append({
                        'id': mapping.azure_ad_group_id,
                        'name': mapping.azure_ad_group_name
                    })

            if missing_groups:
                results['checks'].append({
                    'name': 'Azure Groups Validation',
                    'status': 'WARN',
                    'message': f'{len(missing_groups)} mapped groups not found in Azure AD'
                })
                results['warnings'].append(f'Groups not found in Azure: {missing_groups}')
            else:
                results['checks'].append({
                    'name': 'Azure Groups Validation',
                    'status': 'PASS',
                    'message': f'All {mappings.count()} mapped groups exist in Azure AD'
                })

        except Exception as e:
            results['checks'].append({
                'name': 'Azure Groups Validation',
                'status': 'FAIL',
                'message': f'Error validating Azure groups: {str(e)}'
            })
            results['errors'].append(f'Azure validation failed: {str(e)}')

    def output_text_format(self, results):
        """Output results in human-readable text format"""
        status_colors = {
            'PASS': self.style.SUCCESS,
            'FAIL': self.style.ERROR,
            'WARN': self.style.WARNING,
            'SKIP': self.style.WARNING
        }

        self.stdout.write('\n' + '='*80)
        self.stdout.write(status_colors[results['status']](
            f"ROLE MAPPINGS HEALTH CHECK - {results['status']}"
        ))
        self.stdout.write('='*80)

        for check in results['checks']:
            status_icon = {
                'PASS': '✓',
                'FAIL': '✗',
                'WARN': '⚠',
                'SKIP': '-'
            }[check['status']]
            
            color = status_colors[check['status']]
            self.stdout.write(
                f"{status_icon} {color(check['name'])}: {check['message']}"
            )

        # Summary
        summary = results['summary']
        self.stdout.write('\n' + '-'*80)
        self.stdout.write('SUMMARY:')
        self.stdout.write(f"  Total checks: {summary['total_checks']}")
        self.stdout.write(f"  Passed: {summary['passed_checks']}")
        self.stdout.write(f"  Failed: {summary['failed_checks']}")
        self.stdout.write(f"  Warnings: {summary['warnings']}")
        self.stdout.write(f"  Errors: {summary['errors']}")

        if results['errors']:
            self.stdout.write('\nERRORS:')
            for error in results['errors']:
                self.stdout.write(f"  • {self.style.ERROR(error)}")

        if results['warnings']:
            self.stdout.write('\nWARNINGS:')
            for warning in results['warnings']:
                self.stdout.write(f"  • {self.style.WARNING(warning)}")

        self.stdout.write('\n' + '='*80)