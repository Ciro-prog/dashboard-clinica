#!/usr/bin/env python3
"""
Fix Pydantic Config vs model_config conflict
"""
import os
import re

def fix_config_conflict():
    """Remove old Config classes where model_config is present"""
    
    model_files = [
        "app/models/clinic.py",
        "app/models/patient.py", 
        "app/models/professional.py",
        "app/models/document.py",
        "app/models/subscription_plan.py",
        "app/models/admin.py"
    ]
    
    for file_path in model_files:
        if not os.path.exists(file_path):
            print(f"SKIP: {file_path} not found")
            continue
            
        print(f"Fixing: {file_path}")
        
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # If file has both model_config and class Config, remove Config
        if "model_config" in content and "class Config:" in content:
            
            # Remove class Config blocks (including content until next class/function/end)
            config_pattern = r'\n    class Config:\s*\n(?:        [^\n]*\n)*(?=\n(?:\S|\Z)|\n    [a-zA-Z_]|\Z)'
            
            new_content = re.sub(config_pattern, '', content)
            
            # Count removals
            original_configs = len(re.findall(r'class Config:', content))
            remaining_configs = len(re.findall(r'class Config:', new_content))
            removed = original_configs - remaining_configs
            
            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            print(f"   Removed {removed} Config classes")
        else:
            print(f"   No conflict detected")
    
    print("\nConfig conflict fixes completed!")

if __name__ == "__main__":
    fix_config_conflict()