#!/usr/bin/env python3
"""
Fix all models to use from_mongo method for ObjectId compatibility
"""
import os
import re

def add_from_mongo_method():
    """Add from_mongo method to all InDB models"""
    
    models = [
        "app/models/clinic.py",
        "app/models/patient.py", 
        "app/models/professional.py",
        "app/models/document.py"
    ]
    
    from_mongo_method = '''
    @classmethod
    def from_mongo(cls, data):
        """Convert MongoDB document to model"""
        if data is None:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        return cls(**data)'''
    
    for model_file in models:
        if not os.path.exists(model_file):
            print(f"SKIP: {model_file} not found")
            continue
            
        print(f"Updating: {model_file}")
        
        # Read file
        with open(model_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find InDB classes and add from_mongo method
        if "InDB" in content and "from_mongo" not in content:
            # Find class definition pattern
            class_pattern = r'(class \w+InDB\([^:]+\):[^}]+?)(\n\n|\nclass|\Z)'
            
            def add_method(match):
                class_def = match.group(1)
                end_marker = match.group(2)
                return class_def + from_mongo_method + end_marker
            
            new_content = re.sub(class_pattern, add_method, content, flags=re.DOTALL)
            
            # Update model_config if present
            if 'class Config:' in new_content:
                new_content = new_content.replace('class Config:', 'model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}\n\n    # Deprecated Config class for compatibility\n    class Config:')
            elif 'json_encoders = {ObjectId: str}' in new_content:
                new_content = new_content.replace('json_encoders = {ObjectId: str}', 'model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}')
            
            # Write back
            with open(model_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            print(f"   Added from_mongo method")
        else:
            print(f"   Skipped (already has from_mongo or no InDB class)")
    
    print("\nModel fixes completed!")

if __name__ == "__main__":
    add_from_mongo_method()