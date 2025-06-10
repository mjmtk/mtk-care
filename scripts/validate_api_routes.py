#!/usr/bin/env python3
"""
API Route Validation Script
Validates that all Django Ninja router definitions follow consistent patterns.
"""

import os
import re
import sys
from pathlib import Path

# Define the patterns we're checking for
ROUTE_PATTERNS = {
    'empty_string_route': re.compile(r'@router\.(get|post|put|patch|delete)\s*\(\s*["\'][\s]*["\']'),
    'collection_route': re.compile(r'@router\.(get|post)\s*\(\s*["\'][\/][\s]*["\']'),
    'individual_route': re.compile(r'@router\.(get|put|patch|delete)\s*\(\s*["\'][\/]\{[^}]+\}[^\/]*["\']'),
    'special_route': re.compile(r'@router\.(get|post|put|patch|delete)\s*\(\s*["\'][\/][a-zA-Z][^{}]*["\']'),
}

def find_api_files(backend_path):
    """Find all Python files that likely contain API route definitions."""
    api_files = []
    
    for root, dirs, files in os.walk(backend_path):
        for file in files:
            if file.endswith('.py') and ('api' in file or 'views' in file):
                file_path = Path(root) / file
                api_files.append(file_path)
    
    return api_files

def validate_route_patterns(file_path):
    """Validate route patterns in a single file."""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.splitlines()
    except Exception as e:
        return [f"Error reading file: {e}"]
    
    # Check for empty string routes (CRITICAL ERROR)
    empty_string_matches = ROUTE_PATTERNS['empty_string_route'].finditer(content)
    for match in empty_string_matches:
        line_num = content[:match.start()].count('\n') + 1
        line_content = lines[line_num - 1].strip()
        issues.append({
            'type': 'CRITICAL',
            'line': line_num,
            'content': line_content,
            'message': 'Empty string route detected - use "/" instead'
        })
    
    # Check for router definitions to ensure we're looking at API files
    router_imports = re.search(r'from ninja import.*Router|Router\s*\(', content)
    router_decorators = re.search(r'@router\.(get|post|put|patch|delete)', content)
    
    if router_imports and router_decorators:
        # This is an API file, validate patterns
        collection_routes = ROUTE_PATTERNS['collection_route'].findall(content)
        individual_routes = ROUTE_PATTERNS['individual_route'].findall(content)
        special_routes = ROUTE_PATTERNS['special_route'].findall(content)
        
        # Count different types of routes for informational purposes
        if collection_routes or individual_routes or special_routes:
            issues.append({
                'type': 'INFO',
                'line': 0,
                'content': '',
                'message': f'Found {len(collection_routes)} collection, {len(individual_routes)} individual, {len(special_routes)} special routes'
            })
    
    return issues

def main():
    """Main validation function."""
    # Find backend directory
    script_dir = Path(__file__).parent
    backend_path = script_dir.parent / 'backend'
    
    if not backend_path.exists():
        print(f"❌ Backend directory not found: {backend_path}")
        sys.exit(1)
    
    print("🔍 Validating API route patterns...")
    print(f"📁 Scanning: {backend_path}")
    print()
    
    # Find all API files
    api_files = find_api_files(backend_path)
    print(f"📄 Found {len(api_files)} potential API files")
    print()
    
    # Validate each file
    total_issues = 0
    critical_issues = 0
    
    for file_path in api_files:
        relative_path = file_path.relative_to(backend_path)
        issues = validate_route_patterns(file_path)
        
        if issues:
            print(f"📝 {relative_path}")
            for issue in issues:
                if issue['type'] == 'CRITICAL':
                    print(f"   ❌ Line {issue['line']}: {issue['message']}")
                    print(f"      {issue['content']}")
                    critical_issues += 1
                elif issue['type'] == 'INFO':
                    print(f"   ℹ️  {issue['message']}")
                total_issues += len([i for i in issues if i['type'] != 'INFO'])
            print()
    
    # Summary
    print("=" * 50)
    if critical_issues > 0:
        print(f"❌ VALIDATION FAILED: {critical_issues} critical issues found")
        print()
        print("🔧 To fix empty string routes:")
        print("   Replace: @router.get('') with @router.get('/')")
        print("   Replace: @router.post('') with @router.post('/')")
        sys.exit(1)
    else:
        print("✅ VALIDATION PASSED: No critical issues found")
        print(f"📊 Scanned {len(api_files)} files")
        if total_issues > 0:
            print(f"⚠️  {total_issues} minor issues found")
    
    print()
    print("📚 For API standards, see:")
    print("   docs/04-development/backend/django-ninja-best-practices.md")

if __name__ == "__main__":
    main()