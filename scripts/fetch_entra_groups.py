#!/usr/bin/env python3
"""
Fetch Azure AD (Entra ID) groups starting with MC_ for role mapping setup.
This script is designed to run as a pre-deployment hook to ensure role mappings
are current with the actual groups in Entra ID.

Usage:
    python scripts/fetch_entra_groups.py --output role_mappings.json
    python scripts/fetch_entra_groups.py --dry-run
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime
from typing import List, Dict, Optional

class EntraGroupFetcher:
    def __init__(self, tenant_id: str, client_id: str, client_secret: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token: Optional[str] = None
        
    def get_access_token(self) -> str:
        """Get access token for Microsoft Graph API"""
        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://graph.microsoft.com/.default'
        }
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.access_token = token_data['access_token']
        return self.access_token
    
    def fetch_mc_groups(self) -> List[Dict]:
        """Fetch all groups starting with MC_ from Entra ID"""
        if not self.access_token:
            self.get_access_token()
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        # Filter groups that start with MC_
        url = "https://graph.microsoft.com/v1.0/groups"
        params = {
            '$filter': "startswith(displayName,'MC_')",
            '$select': 'id,displayName,description'
        }
        
        all_groups = []
        
        while url:
            response = requests.get(url, headers=headers, params=params if url == "https://graph.microsoft.com/v1.0/groups" else None)
            response.raise_for_status()
            
            data = response.json()
            all_groups.extend(data.get('value', []))
            
            # Handle pagination
            url = data.get('@odata.nextLink')
            params = None  # Only use params for the first request
        
        return all_groups
    
    def map_groups_to_roles(self, groups: List[Dict]) -> List[Dict]:
        """Map MC_ groups to application roles based on naming convention"""
        role_mappings = []
        
        # Define role mapping based on group naming patterns
        role_mapping_patterns = {
            'MC_Administrators': 'Administrator',
            'MC_Managers': 'Manager', 
            'MC_Program_Managers': 'Program Manager',
            'MC_Supervisors': 'Supervisor',
            'MC_Team_Leads': 'Team Lead',
            'MC_Practitioners': 'Practitioner',
            'MC_Volunteers': 'Volunteer'
        }
        
        for group in groups:
            display_name = group['displayName']
            group_id = group['id']
            description = group.get('description', '')
            
            # Try to match exact patterns first
            role_name = role_mapping_patterns.get(display_name)
            
            # If no exact match, try pattern matching
            if not role_name:
                if 'Administrator' in display_name or 'Admin' in display_name:
                    role_name = 'Administrator'
                elif 'Manager' in display_name and 'Program' in display_name:
                    role_name = 'Program Manager'
                elif 'Manager' in display_name:
                    role_name = 'Manager'
                elif 'Supervisor' in display_name:
                    role_name = 'Supervisor'
                elif 'Lead' in display_name:
                    role_name = 'Team Lead'
                elif 'Practitioner' in display_name:
                    role_name = 'Practitioner'
                elif 'Volunteer' in display_name:
                    role_name = 'Volunteer'
                else:
                    # Default to Practitioner for unknown MC_ groups
                    role_name = 'Practitioner'
                    print(f"Warning: No role mapping found for '{display_name}', defaulting to 'Practitioner'")
            
            role_mappings.append({
                'group_id': group_id,
                'group_name': display_name,
                'role_name': role_name,
                'description': description,
                'fetched_at': datetime.utcnow().isoformat()
            })
        
        return role_mappings

def main():
    parser = argparse.ArgumentParser(description='Fetch MC_ groups from Entra ID for role mappings')
    parser.add_argument('--output', '-o', help='Output file path for role mappings JSON')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be fetched without saving')
    parser.add_argument('--tenant-id', help='Azure tenant ID (or use AZURE_TENANT_ID env var)')
    parser.add_argument('--client-id', help='Azure client ID (or use AZURE_CLIENT_ID env var)')
    parser.add_argument('--client-secret', help='Azure client secret (or use AZURE_CLIENT_SECRET env var)')
    
    args = parser.parse_args()
    
    # Get credentials from args or environment
    tenant_id = args.tenant_id or os.getenv('AZURE_TENANT_ID')
    client_id = args.client_id or os.getenv('AZURE_CLIENT_ID')
    client_secret = args.client_secret or os.getenv('AZURE_CLIENT_SECRET')
    
    if not all([tenant_id, client_id, client_secret]):
        print("Error: Missing required credentials. Provide via arguments or environment variables:")
        print("  AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET")
        sys.exit(1)
    
    try:
        # Initialize fetcher and get groups
        fetcher = EntraGroupFetcher(tenant_id, client_id, client_secret)
        print("Fetching groups from Entra ID...")
        
        groups = fetcher.fetch_mc_groups()
        print(f"Found {len(groups)} groups starting with 'MC_'")
        
        # Map to roles
        role_mappings = fetcher.map_groups_to_roles(groups)
        
        # Display results
        if args.dry_run or not args.output:
            print("\nFetched role mappings:")
            print("-" * 80)
            for mapping in role_mappings:
                print(f"Group: {mapping['group_name']}")
                print(f"  ID: {mapping['group_id']}")
                print(f"  Role: {mapping['role_name']}")
                print(f"  Description: {mapping['description']}")
                print()
        
        # Save to file if requested
        if args.output and not args.dry_run:
            output_data = {
                'fetched_at': datetime.utcnow().isoformat(),
                'total_groups': len(groups),
                'mappings': role_mappings
            }
            
            with open(args.output, 'w') as f:
                json.dump(output_data, f, indent=2)
            
            print(f"Role mappings saved to {args.output}")
            
            # Also create environment variable format
            env_format = json.dumps(role_mappings)
            env_file = args.output.replace('.json', '_env.json')
            with open(env_file, 'w') as f:
                json.dump({'AZURE_AD_ROLE_MAPPINGS': env_format}, f, indent=2)
            
            print(f"Environment variable format saved to {env_file}")
    
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Microsoft Graph API: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()