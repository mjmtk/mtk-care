#!/usr/bin/env python3
"""
Frontend URL validation script
Checks that frontend service URLs follow the correct patterns.
"""

import os
import re
from pathlib import Path

def validate_urls_in_file(file_path):
    """Validate URL patterns in a service file."""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.splitlines()
    except Exception as e:
        return [f"Error reading file: {e}"]
    
    # Check for double slashes in URLs
    double_slash_pattern = re.compile(r'["\']v1/[^"\']*//[^"\']*["\']')
    for i, line in enumerate(lines, 1):
        if double_slash_pattern.search(line):
            issues.append({
                'type': 'ERROR',
                'line': i,
                'content': line.strip(),
                'message': 'Double slash found in URL'
            })
    
    # Check for missing v1/ prefix
    missing_v1_pattern = re.compile(r'url:\s*["\'][^"\']*["\']')
    for i, line in enumerate(lines, 1):
        match = missing_v1_pattern.search(line)
        if match and 'v1/' not in match.group():
            # Skip if it's an HTTP URL or other valid pattern
            url_content = match.group()
            if not any(skip in url_content for skip in ['http', 'https', '${', 'BASE_PATH']):
                issues.append({
                    'type': 'WARNING',
                    'line': i,
                    'content': line.strip(),
                    'message': 'URL might be missing v1/ prefix'
                })
    
    return issues

def main():
    """Main validation function."""
    script_dir = Path(__file__).parent
    frontend_services = script_dir.parent / 'frontend' / 'src' / 'services'
    
    if not frontend_services.exists():
        print(f"❌ Frontend services directory not found: {frontend_services}")
        return
    
    print("🔍 Validating frontend URL patterns...")
    print(f"📁 Scanning: {frontend_services}")
    print()
    
    # Find all service files
    service_files = list(frontend_services.glob('*.ts'))
    print(f"📄 Found {len(service_files)} service files")
    print()
    
    total_issues = 0
    critical_issues = 0
    
    for file_path in service_files:
        relative_path = file_path.name
        issues = validate_urls_in_file(file_path)
        
        if issues:
            print(f"📝 {relative_path}")
            for issue in issues:
                if issue['type'] == 'ERROR':
                    print(f"   ❌ Line {issue['line']}: {issue['message']}")
                    print(f"      {issue['content']}")
                    critical_issues += 1
                elif issue['type'] == 'WARNING':
                    print(f"   ⚠️  Line {issue['line']}: {issue['message']}")
                    print(f"      {issue['content']}")
                total_issues += 1
            print()
    
    # Summary
    print("=" * 50)
    if critical_issues > 0:
        print(f"❌ VALIDATION FAILED: {critical_issues} critical issues found")
        print()
        print("🔧 Common fixes:")
        print("   - Remove extra slashes in URL concatenation")
        print("   - Ensure BASE_PATH ends with '/' for collections")
        print("   - Don't add '/' when concatenating with BASE_PATH")
    else:
        print("✅ VALIDATION PASSED: No critical URL issues found")
        if total_issues > 0:
            print(f"⚠️  {total_issues} warnings found")
    
    print(f"📊 Scanned {len(service_files)} files")

if __name__ == "__main__":
    main()