from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from ..core.database import get_collection
from ..auth.dependencies import get_current_admin, get_super_admin, get_current_admin_hybrid, get_super_admin_hybrid
from ..models.admin import AdminInDB
from ..models.clinic import (
    ClinicCreate, ClinicUpdate, ClinicResponse, ClinicInDB,
    SubscriptionFeatures, ClinicBranding
)
from ..models.professional import (
    ProfessionalCreate, ProfessionalUpdate, ProfessionalResponse, ProfessionalInDB,
    ProfessionalCredentialsUpdate
)
from ..models.subscription_plan import SubscriptionPlanInDB
from ..utils.email_generator import (
    generate_professional_email, generate_clinic_email_domain, 
    validate_email_uniqueness, get_n8n_folder_name
)
from ..auth.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/test")
async def test_admin_api():
    """Test endpoint to verify admin API is working"""
    return {"message": "Admin API is working", "status": "ok"}


async def get_subscription_plans():
    """Get subscription plans from database"""
    try:
        print(f"[PLANS] Getting subscription plans...")
        plans_collection = await get_collection("subscription_plans")
        print(f"[PLANS] Got collection")
        
        # Check total count
        total_count = await plans_collection.count_documents({})
        active_count = await plans_collection.count_documents({"is_active": True})
        print(f"[PLANS] Total plans: {total_count}, Active: {active_count}")
        
        cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
        
        plans = {}
        plan_counter = 0
        async for plan_doc in cursor:
            try:
                print(f"[PLANS] Processing plan: {plan_doc.get('plan_id', 'NO_ID')}")
                plan = SubscriptionPlanInDB.from_mongo(plan_doc)
                print(f"[PLANS] Parsed plan data: {plan.plan_id}")
                
                plans[plan.plan_id] = {
                    "name": plan.name,
                    "price": plan.price,
                    "duration_days": plan.duration_days,
                    "features": plan.features.model_dump(),
                    "max_professionals": plan.max_professionals,
                    "max_patients": plan.max_patients
                }
                plan_counter += 1
                print(f"[PLANS] Added plan to response")
                
            except Exception as plan_error:
                print(f"[PLANS] Error processing plan {plan_doc.get('plan_id')}: {plan_error}")
                import traceback
                traceback.print_exc()
        
        print(f"[PLANS] Returning {plan_counter} plans")
        return plans
        
    except Exception as e:
        print(f"[PLANS] CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {}


@router.get("/dashboard/stats")
async def get_admin_dashboard_stats(current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Get admin dashboard statistics"""
    clinics_collection = await get_collection("clinics")
    patients_collection = await get_collection("patients")
    professionals_collection = await get_collection("professionals")
    
    # Get clinic stats
    total_clinics = await clinics_collection.count_documents({})
    active_clinics = await clinics_collection.count_documents({"status_clinic": "active"})
    trial_clinics = await clinics_collection.count_documents({"subscription_status": "trial"})
    
    # Get revenue stats
    pipeline = [
        {"$match": {"subscription_status": "active"}},
        {"$group": {
            "_id": "$subscription_plan",
            "count": {"$sum": 1}
        }}
    ]
    
    # Get subscription plans from database
    subscription_plans = await get_subscription_plans()
    
    monthly_revenue = 0.0
    plan_distribution = {}
    
    async for plan_data in clinics_collection.aggregate(pipeline):
        plan_name = plan_data["_id"]
        count = plan_data["count"]
        plan_distribution[plan_name] = count
        
        if plan_name in subscription_plans:
            monthly_revenue += subscription_plans[plan_name]["price"] * count
    
    # Get total users
    total_patients = await patients_collection.count_documents({})
    total_professionals = await professionals_collection.count_documents({})
    
    return {
        "total_clinics": total_clinics,
        "active_clinics": active_clinics,
        "trial_clinics": trial_clinics,
        "inactive_clinics": total_clinics - active_clinics,
        "monthly_revenue": monthly_revenue,
        "total_patients": total_patients,
        "total_professionals": total_professionals,
        "plan_distribution": plan_distribution,
        "growth_this_month": 0  # TODO: Implement actual growth calculation
    }


@router.get("/subscription-plans")
async def get_subscription_plans_endpoint(current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Get available subscription plans"""
    try:
        print(f"[PLANS_ENDPOINT] Request from admin: {current_admin.username}")
        
        plans = await get_subscription_plans()
        print(f"[PLANS_ENDPOINT] Got {len(plans)} plans")
        
        if not plans:
            print(f"[PLANS_ENDPOINT] WARNING: No plans found")
        
        return plans
        
    except Exception as e:
        print(f"[PLANS_ENDPOINT] CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Subscription plans error: {str(e)}")


@router.get("/clinics")
async def list_clinics(current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Get list of all clinics"""
    try:
        print(f"[CLINICS] Request from admin: {current_admin.username}")
        
        clinics_collection = await get_collection("clinics")
        print(f"[CLINICS] Got collection")
        
        # Check total count
        total_count = await clinics_collection.count_documents({})
        print(f"[CLINICS] Total clinics in DB: {total_count}")
        
        cursor = clinics_collection.find({}).sort("created_at", -1)
        clinics = []
        
        async for clinic in cursor:
            try:
                print(f"[CLINICS] Processing clinic: {clinic.get('clinic_id', 'NO_ID')}")
                clinic_data = ClinicInDB.from_mongo(clinic)
                print(f"[CLINICS] Parsed clinic data: {clinic_data.clinic_id}")
                
                response_data = ClinicResponse(**clinic_data.model_dump())
                clinics.append(response_data)
                print(f"[CLINICS] Added clinic to response")
                
            except Exception as clinic_error:
                print(f"[CLINICS] Error processing clinic {clinic.get('clinic_id')}: {clinic_error}")
                import traceback
                traceback.print_exc()
        
        print(f"[CLINICS] Returning {len(clinics)} clinics")
        return clinics
        
    except Exception as e:
        print(f"[CLINICS] CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/clinics/{clinic_id}")
async def get_clinic_admin(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Get specific clinic details"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic by ID or clinic_id field
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    clinic_data = ClinicInDB.from_mongo(clinic)
    return ClinicResponse(**clinic_data.model_dump())


@router.post("/clinics", response_model=ClinicResponse, status_code=status.HTTP_201_CREATED)
async def create_clinic_admin(
    clinic_data: dict,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Create new clinic with full admin capabilities"""
    clinics_collection = await get_collection("clinics")
    
    # Check if clinic_id or email already exists
    existing = await clinics_collection.find_one({
        "$or": [
            {"clinic_id": clinic_data["clinic_id"]},
            {"email": clinic_data["email"]}
        ]
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clinic ID or email already exists"
        )
    
    # Set subscription plan features
    plan_name = clinic_data.get("subscription_plan", "trial")
    subscription_plans = await get_subscription_plans()
    
    if plan_name in subscription_plans:
        plan_config = subscription_plans[plan_name]
        clinic_data["subscription_features"] = plan_config["features"]
        clinic_data["max_professionals"] = plan_config["max_professionals"]
        clinic_data["max_patients"] = plan_config["max_patients"]
        
        # Set expiration date for paid plans
        if plan_name != "trial":
            clinic_data["subscription_expires"] = (
                date.today() + timedelta(days=plan_config["duration_days"])
            ).isoformat()
    
    # Set default branding if not provided
    if "branding" not in clinic_data:
        clinic_data["branding"] = {
            "clinic_title": f"{clinic_data['name_clinic']} Admin",
            "clinic_subtitle": "Sistema de Gestión Médica",
            "logo_url": None,
            "primary_color": "#3B82F6",
            "secondary_color": "#1E40AF"
        }
    
    # Set default N8N folder name
    if not clinic_data.get("n8n_folder_name"):
        clinic_data["n8n_folder_name"] = f"{clinic_data['suscriber']} - Operativa"
    
    # Hash password
    from ..auth.security import get_password_hash
    clinic_data["password_hash"] = get_password_hash(clinic_data.pop("password"))
    
    # Set timestamps
    clinic_data["created_at"] = datetime.utcnow()
    clinic_data["updated_at"] = datetime.utcnow()
    
    result = await clinics_collection.insert_one(clinic_data)
    clinic_data["_id"] = result.inserted_id
    
    clinic_db = ClinicInDB.from_mongo(clinic_data)
    return ClinicResponse(**clinic_db.model_dump())


@router.put("/clinics/{clinic_id}/branding")
async def update_clinic_branding(
    clinic_id: str,
    branding_data: dict,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update clinic branding configuration"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Update branding
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {
            "$set": {
                "branding": branding_data,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Branding updated successfully"}


@router.put("/clinics/{clinic_id}/subscription")
async def update_clinic_subscription(
    clinic_id: str,
    subscription_data: dict,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update clinic subscription plan"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    plan_name = subscription_data.get("subscription_plan")
    subscription_plans = await get_subscription_plans()
    
    if plan_name not in subscription_plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription plan"
        )
    
    plan_config = subscription_plans[plan_name]
    
    # Calculate new expiration date
    new_expiration = None
    if plan_name != "trial":
        if subscription_data.get("extend_current", False) and clinic.get("subscription_expires"):
            # Extend from current expiration date
            current_exp = datetime.fromisoformat(clinic["subscription_expires"]).date()
            new_expiration = current_exp + timedelta(days=plan_config["duration_days"])
        else:
            # Start from today
            new_expiration = date.today() + timedelta(days=plan_config["duration_days"])
    
    update_data = {
        "subscription_plan": plan_name,
        "subscription_status": "active" if plan_name != "trial" else "trial",
        "subscription_features": plan_config["features"],
        "max_professionals": plan_config["max_professionals"],
        "max_patients": plan_config["max_patients"],
        "updated_at": datetime.utcnow()
    }
    
    if new_expiration:
        update_data["subscription_expires"] = new_expiration
    
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": update_data}
    )
    
    return {
        "message": "Subscription updated successfully",
        "plan": plan_name,
        "expires": new_expiration.isoformat() if new_expiration else None,
        "monthly_cost": plan_config["price"]
    }


@router.put("/clinics/{clinic_id}")
async def update_clinic(
    clinic_id: str,
    clinic_data: dict,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update general clinic information"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Prepare update data (only allow specific fields)
    allowed_fields = [
        "name_clinic", "suscriber", "email", "cell_phone", "address", 
        "subscription_plan", "status_clinic"
    ]
    
    update_data = {}
    for field in allowed_fields:
        if field in clinic_data and clinic_data[field] is not None:
            update_data[field] = clinic_data[field]
    
    # Handle password change if provided
    if "password" in clinic_data and clinic_data["password"]:
        update_data["password_hash"] = get_password_hash(clinic_data["password"])
    
    # Add timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Update clinic
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": update_data}
    )
    
    # Return updated clinic data
    updated_clinic = await clinics_collection.find_one({"_id": clinic["_id"]})
    
    # Apply the same datetime conversion fix for the response
    if "subscription_expires" in updated_clinic and isinstance(updated_clinic["subscription_expires"], datetime):
        updated_clinic["subscription_expires"] = updated_clinic["subscription_expires"].date()
    
    clinic_db = ClinicInDB.from_mongo(updated_clinic)
    return ClinicResponse(**clinic_db.model_dump())


@router.put("/clinics/{clinic_id}/patient-fields")
async def update_patient_form_fields(
    clinic_id: str,
    fields_data: dict,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update clinic patient form fields configuration"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Update patient form fields
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {
            "$set": {
                "patient_form_fields": fields_data.get("patient_form_fields", []),
                "custom_patient_fields": fields_data.get("custom_patient_fields", []),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Patient form fields updated successfully"}


@router.get("/clinics/expiring-soon")
async def get_expiring_clinics(
    days: int = Query(7, ge=1, le=30),
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Get clinics with subscriptions expiring soon"""
    clinics_collection = await get_collection("clinics")
    
    # Calculate expiration threshold
    threshold_date = date.today() + timedelta(days=days)
    
    cursor = clinics_collection.find({
        "subscription_status": "active",
        "subscription_expires": {"$lte": threshold_date.isoformat()}
    })
    
    expiring_clinics = []
    async for clinic in cursor:
        clinic_data = ClinicInDB.from_mongo(clinic)
        expiring_clinics.append({
            "clinic_id": clinic_data.clinic_id,
            "name_clinic": clinic_data.name_clinic,
            "email": clinic_data.email,
            "subscription_plan": clinic_data.subscription_plan,
            "subscription_expires": clinic_data.subscription_expires,
            "days_until_expiration": (
                datetime.fromisoformat(str(clinic_data.subscription_expires)).date() - date.today()
            ).days if clinic_data.subscription_expires else None
        })
    
    return expiring_clinics


@router.post("/clinics/{clinic_id}/extend-trial")
async def extend_trial_period(
    clinic_id: str,
    extension_days: int = Query(30, ge=1, le=90),
    current_admin: AdminInDB = Depends(get_super_admin_hybrid)
):
    """Extend trial period for a clinic (super admin only)"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Extend trial
    new_expiration = date.today() + timedelta(days=extension_days)
    
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {
            "$set": {
                "subscription_expires": new_expiration,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"Trial extended by {extension_days} days",
        "new_expiration": new_expiration.isoformat()
    }


# Payment Management APIs

@router.get("/clinics/{clinic_id}/payments")
async def get_clinic_payments(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Get payment history for a specific clinic"""
    payments_collection = await get_collection("payments")
    
    # Find all payments for this clinic
    cursor = payments_collection.find({"clinic_id": clinic_id}).sort("payment_date", -1)
    payments = []
    
    async for payment in cursor:
        # Convert MongoDB document to dict and handle ObjectId
        payment_dict = dict(payment)
        payment_dict["id"] = str(payment_dict.pop("_id"))
        payments.append(payment_dict)
    
    return payments


@router.post("/clinics/{clinic_id}/payments")
async def record_clinic_payment(
    clinic_id: str,
    payment_data: dict,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Record a new payment for a clinic"""
    payments_collection = await get_collection("payments")
    clinics_collection = await get_collection("clinics")
    
    # Find clinic to validate it exists
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Prepare payment record
    payment_record = {
        "clinic_id": clinic_id,
        "amount": payment_data.get("amount", 0),
        "payment_method": payment_data.get("payment_method", ""),
        "description": payment_data.get("description", ""),
        "reference_number": payment_data.get("reference_number"),
        "payment_date": datetime.utcnow().isoformat(),
        "status": "completed",  # Assume payment is completed when recorded
        "subscription_updated": False,
        "subscription_extended_days": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Handle subscription update if requested
    if payment_data.get("update_subscription", False):
        selected_plan = payment_data.get("selected_plan")
        extension_days = payment_data.get("extension_days", 30)
        
        if selected_plan:
            # Get subscription plans
            subscription_plans = await get_subscription_plans()
            
            if selected_plan in subscription_plans:
                plan_config = subscription_plans[selected_plan]
                
                # Calculate new expiration date
                current_exp = clinic.get("subscription_expires")
                if current_exp:
                    if isinstance(current_exp, datetime):
                        current_exp_date = current_exp.date()
                    elif isinstance(current_exp, date):
                        current_exp_date = current_exp
                    elif isinstance(current_exp, str):
                        try:
                            current_exp_date = datetime.fromisoformat(current_exp).date()
                        except (ValueError, TypeError):
                            current_exp_date = date.today()
                    else:
                        current_exp_date = date.today()
                else:
                    current_exp_date = date.today()
                
                new_expiration = current_exp_date + timedelta(days=extension_days)
                
                print(f"[DEBUG] new_expiration type: {type(new_expiration)}, value: {new_expiration}")
                print(f"[DEBUG] isoformat result: {new_expiration.isoformat()}")
                print(f"[DEBUG] plan_config features: {plan_config['features']}")
                
                # Update clinic subscription
                try:
                    # Convert the date object to ISO string format for MongoDB storage
                    expiration_str = new_expiration.isoformat() if isinstance(new_expiration, date) else str(new_expiration)
                    print(f"[DEBUG] Final expiration string: {expiration_str}")
                    
                    await clinics_collection.update_one(
                        {"_id": clinic["_id"]},
                        {
                            "$set": {
                                "subscription_plan": selected_plan,
                                "subscription_status": "active" if selected_plan != "trial" else "trial",
                                "subscription_features": plan_config["features"],
                                "max_professionals": plan_config["max_professionals"],
                                "max_patients": plan_config["max_patients"],
                                "subscription_expires": expiration_str,
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                    print("[DEBUG] MongoDB update successful")
                except Exception as e:
                    print(f"[DEBUG] MongoDB update failed: {e}")
                    raise
                
                # Update payment record
                payment_record["subscription_updated"] = True
                payment_record["subscription_extended_days"] = extension_days
    
    # Insert payment record
    result = await payments_collection.insert_one(payment_record)
    payment_record["id"] = str(result.inserted_id)
    payment_record.pop("_id", None)
    
    return {
        "message": "Payment recorded successfully",
        "payment": payment_record
    }


# Professional Management APIs

@router.get("/clinics/{clinic_id}/professionals")
async def get_clinic_professionals(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Get all professionals for a specific clinic"""
    professionals_collection = await get_collection("professionals")
    
    # Find all professionals for this clinic
    cursor = professionals_collection.find({"clinic_id": clinic_id}).sort("created_at", -1)
    professionals = []
    
    async for professional in cursor:
        prof_data = ProfessionalInDB.from_mongo(professional)
        professionals.append(ProfessionalResponse(**prof_data.model_dump()))
    
    return professionals


@router.post("/clinics/{clinic_id}/professionals")
async def create_clinic_professional(
    clinic_id: str,
    professional_data: ProfessionalCreate,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Create a new professional for a clinic"""
    clinics_collection = await get_collection("clinics")
    professionals_collection = await get_collection("professionals")
    
    # Find clinic to get domain info and validate limits
    clinic = await clinics_collection.find_one({
        "$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]
    } if ObjectId.is_valid(clinic_id) else {"clinic_id": clinic_id})
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Check professional limit
    current_count = await professionals_collection.count_documents({"clinic_id": clinic_id})
    max_allowed = clinic.get("max_professionals_allowed", clinic.get("max_professionals", 5))
    
    if current_count >= max_allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Professional limit reached ({max_allowed}). Upgrade subscription plan."
        )
    
    # Generate email domain if not exists
    clinic_domain = clinic.get("email_domain") or clinic.get("domain_name", "")
    if not clinic_domain:
        clinic_domain = generate_clinic_email_domain(
            clinic.get("name_clinic", ""), 
            clinic.get("suscriber", "")
        )
        # Update clinic with generated domain
        await clinics_collection.update_one(
            {"_id": clinic["_id"]},
            {"$set": {"email_domain": f"{clinic_domain}.com", "domain_name": clinic_domain}}
        )
    
    # Generate professional email
    professional_email = generate_professional_email(
        professional_data.first_name,
        professional_data.last_name,
        clinic_domain
    )
    
    # Check email uniqueness
    existing_professionals = await professionals_collection.find({}, {"email": 1}).to_list(1000)
    existing_emails = [prof["email"] for prof in existing_professionals]
    
    is_unique, final_email = validate_email_uniqueness(professional_email, existing_emails)
    if not is_unique:
        professional_email = final_email
    
    # Check if license number already exists (if provided and not empty)
    if professional_data.license_number and professional_data.license_number.strip():
        existing_license = await professionals_collection.find_one({
            "license_number": professional_data.license_number.strip()
        })
        
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professional with this license number already exists"
            )
    
    # Create professional record
    professional_dict = professional_data.model_dump()
    
    # Remove license_number field completely if empty to avoid unique constraint issues
    if not professional_dict.get("license_number") or not professional_dict["license_number"].strip():
        professional_dict.pop("license_number", None)  # Remove field completely
    else:
        professional_dict["license_number"] = professional_dict["license_number"].strip()
    
    professional_dict.update({
        "clinic_id": clinic_id,
        "email": professional_email,
        "password_hash": get_password_hash(professional_dict.pop("password")),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await professionals_collection.insert_one(professional_dict)
    professional_dict["_id"] = result.inserted_id
    
    # Update clinic professional count
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {
            "$set": {
                "professionals_count": current_count + 1,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    professional_db = ProfessionalInDB.from_mongo(professional_dict)
    return ProfessionalResponse(**professional_db.model_dump())


@router.put("/clinics/{clinic_id}/professionals/{professional_id}")
async def update_clinic_professional(
    clinic_id: str,
    professional_id: str,
    professional_data: ProfessionalUpdate,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update a professional"""
    professionals_collection = await get_collection("professionals")
    
    # Find professional
    filter_dict = {}
    if ObjectId.is_valid(professional_id):
        filter_dict = {
            "$and": [
                {"$or": [{"_id": ObjectId(professional_id)}, {"id": professional_id}]},
                {"clinic_id": clinic_id}
            ]
        }
    else:
        filter_dict = {"id": professional_id, "clinic_id": clinic_id}
    
    professional = await professionals_collection.find_one(filter_dict)
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )
    
    # Check if license number is being updated and doesn't conflict (only for non-empty values)
    if professional_data.license_number and professional_data.license_number.strip():
        existing_license = await professionals_collection.find_one({
            "license_number": professional_data.license_number.strip(),
            "_id": {"$ne": professional["_id"]}
        })
        
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professional with this license number already exists"
            )
    
    # Update professional
    update_data = {k: v for k, v in professional_data.model_dump().items() if v is not None}
    
    # Handle license_number field properly to avoid unique constraint issues
    if "license_number" in update_data:
        if not update_data["license_number"] or not update_data["license_number"].strip():
            # Remove the field completely if empty, and unset it in the database
            update_data.pop("license_number", None)
            # Add $unset operation to remove the field from the document
            unset_data = {"license_number": ""}
        else:
            update_data["license_number"] = update_data["license_number"].strip()
            unset_data = None
    else:
        unset_data = None
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Build update operation
    update_operation = {"$set": update_data}
    if unset_data:
        update_operation["$unset"] = unset_data
    
    await professionals_collection.update_one(
        {"_id": professional["_id"]},
        update_operation
    )
    
    return {"message": "Professional updated successfully"}


@router.put("/professionals/{professional_id}/credentials")
async def update_professional_credentials(
    professional_id: str,
    credentials_data: ProfessionalCredentialsUpdate,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update professional login credentials"""
    professionals_collection = await get_collection("professionals")
    
    # Find professional
    filter_dict = {}
    if ObjectId.is_valid(professional_id):
        filter_dict = {"$or": [{"_id": ObjectId(professional_id)}, {"id": professional_id}]}
    else:
        filter_dict = {"id": professional_id}
    
    professional = await professionals_collection.find_one(filter_dict)
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )
    
    # Update password
    update_data = {
        "password_hash": get_password_hash(credentials_data.password),
        "updated_at": datetime.utcnow()
    }
    
    if credentials_data.force_password_change:
        update_data["must_change_password"] = True
        update_data["last_login"] = None  # Force re-login
    
    await professionals_collection.update_one(
        {"_id": professional["_id"]},
        {"$set": update_data}
    )
    
    return {"message": "Professional credentials updated successfully"}


@router.delete("/clinics/{clinic_id}/professionals/{professional_id}")
async def delete_clinic_professional(
    clinic_id: str,
    professional_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Delete (deactivate) a professional"""
    professionals_collection = await get_collection("professionals")
    clinics_collection = await get_collection("clinics")
    
    # Find and deactivate professional
    filter_dict = {}
    if ObjectId.is_valid(professional_id):
        filter_dict = {
            "$and": [
                {"$or": [{"_id": ObjectId(professional_id)}, {"id": professional_id}]},
                {"clinic_id": clinic_id}
            ]
        }
    else:
        filter_dict = {"id": professional_id, "clinic_id": clinic_id}
    
    professional = await professionals_collection.find_one(filter_dict)
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )
    
    # Soft delete - mark as inactive
    await professionals_collection.update_one(
        {"_id": professional["_id"]},
        {
            "$set": {
                "status_professional": "inactive",
                "is_active": False,
                "can_login": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update clinic professional count
    current_count = await professionals_collection.count_documents({
        "clinic_id": clinic_id,
        "status_professional": "active"
    })
    
    clinic = await clinics_collection.find_one({
        "$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]
    } if ObjectId.is_valid(clinic_id) else {"clinic_id": clinic_id})
    
    if clinic:
        await clinics_collection.update_one(
            {"_id": clinic["_id"]},
            {
                "$set": {
                    "professionals_count": current_count,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    return {"message": "Professional deactivated successfully"}