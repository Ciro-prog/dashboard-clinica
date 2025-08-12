#!/usr/bin/env python3
"""
Fix all .dict() calls to .model_dump() for Pydantic v2 compatibility
"""
import os
import re

def fix_pydantic_dict_calls():
    """Replace all .dict() calls with .model_dump()"""
    
    # Files to fix
    files_to_fix = [
        "app/api/professionals.py",
        "app/api/patients.py", 
        "app/api/documents.py",
        "app/api/subscription_plans.py",
        "app/api/clinics.py",
        "app/api/admin_dashboard.py"
    ]
    
    total_replacements = 0
    
    for file_path in files_to_fix:
        if not os.path.exists(file_path):
            print(f"SKIP: {file_path} not found")
            continue
            
        print(f"Fixing: {file_path}")
        
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Count occurrences
        original_count = len(re.findall(r'\.dict\(\)', content))
        
        # Replace .dict() with .model_dump()
        new_content = re.sub(r'\.dict\(\)', '.model_dump()', content)
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print(f"   Replaced {original_count} occurrences")
        total_replacements += original_count
    
    print(f"\nTOTAL: {total_replacements} .dict() calls replaced with .model_dump()")
    print("Pydantic v2 compatibility fix completed!")

if __name__ == "__main__":
    fix_pydantic_dict_calls()