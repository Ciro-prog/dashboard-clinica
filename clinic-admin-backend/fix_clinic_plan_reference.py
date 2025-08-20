#!/usr/bin/env python3
"""
Script to fix clinic plan reference mismatch.
Updates clinic subscription_plan from 'trial' to 'trial-1932db' to match actual plan ID.
"""

import asyncio
import os
import sys
from pymongo import MongoClient
from datetime import datetime

# Add the parent directory to sys.path to import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

async def fix_clinic_plan_reference():
    """Fix the clinic plan reference mismatch"""
    print("Fixing clinic plan reference...")
    
    # Connect to production MongoDB
    mongodb_url = "mongodb://192.168.1.23:60516"  # Production MongoDB
    database_name = "clinica-dashboard"
    
    print(f"Connecting to {mongodb_url}/{database_name}")
    
    try:
        client = MongoClient(mongodb_url, serverSelectionTimeoutMS=5000)
        db = client[database_name]
        
        # Test connection
        client.admin.command('ping')
        print("Connected to MongoDB")
        
        clinics_collection = db["clinics"]
        plans_collection = db["subscription_plans"]
        
        # Find clinic with broken plan reference
        clinic = clinics_collection.find_one({"clinic_id": "clinicademo123"})
        if not clinic:
            print("Clinic not found")
            return
        
        print(f"Found clinic: {clinic['name_clinic']}")
        print(f"   Current plan: {clinic.get('subscription_plan', 'Not set')}")
        
        # Find the actual trial plan in the database
        trial_plans = list(plans_collection.find({"name": {"$regex": "trial", "$options": "i"}}))
        print(f"Found {len(trial_plans)} trial-like plans:")
        
        for plan in trial_plans:
            print(f"   - {plan.get('plan_id', 'No ID')}: {plan.get('name', 'No name')} (${plan.get('price', 0)})")
        
        # Find the trial plan with price 0
        trial_plan = None
        for plan in trial_plans:
            if plan.get('price', 0) == 0:
                trial_plan = plan
                break
        
        if not trial_plan:
            print("No trial plan found with price 0")
            return
        
        correct_plan_id = trial_plan['plan_id']
        print(f"Found correct trial plan ID: {correct_plan_id}")
        
        # Update clinic plan reference
        if clinic.get('subscription_plan') != correct_plan_id:
            result = clinics_collection.update_one(
                {"_id": clinic["_id"]},
                {"$set": {
                    "subscription_plan": correct_plan_id,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            if result.modified_count > 0:
                print(f"Updated clinic plan reference: 'trial' -> '{correct_plan_id}'")
            else:
                print("Failed to update clinic plan reference")
        else:
            print(f"Clinic plan reference is already correct: {correct_plan_id}")
        
        # Verify the fix
        updated_clinic = clinics_collection.find_one({"clinic_id": "clinicademo123"})
        print(f"Verification - Clinic plan: {updated_clinic.get('subscription_plan')}")
        
        client.close()
        print("Fix completed successfully")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_clinic_plan_reference())