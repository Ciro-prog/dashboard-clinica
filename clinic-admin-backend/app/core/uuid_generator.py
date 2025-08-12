import uuid
import time
from typing import Optional
from ..core.database import get_collection


class UUIDGenerator:
    """Sistema centralizado de generación de UUIDs únicos"""
    
    @staticmethod
    def generate_clinic_id(base_name: str) -> str:
        """Genera ID único para clínica"""
        # Sanitizar nombre base
        clean_name = base_name.lower()
        clean_name = clean_name.replace(" ", "-")
        clean_name = ''.join(c for c in clean_name if c.isalnum() or c == '-')
        
        # Generar UUID corto
        short_uuid = str(uuid.uuid4())[:8]
        return f"{clean_name}-{short_uuid}"
    
    @staticmethod
    def generate_plan_id(base_name: str) -> str:
        """Genera ID único para plan de suscripción"""
        clean_name = base_name.lower().replace(" ", "-")
        clean_name = ''.join(c for c in clean_name if c.isalnum() or c == '-')
        
        short_uuid = str(uuid.uuid4())[:6]
        return f"{clean_name}-{short_uuid}"
    
    @staticmethod
    async def ensure_unique_clinic_id(proposed_id: str) -> str:
        """Garantiza que el clinic_id sea único"""
        clinics_collection = await get_collection("clinics")
        
        original_id = proposed_id
        counter = 1
        
        while await clinics_collection.find_one({"clinic_id": proposed_id}):
            proposed_id = f"{original_id}-{counter}"
            counter += 1
            
        return proposed_id
    
    @staticmethod
    async def ensure_unique_plan_id(proposed_id: str) -> str:
        """Garantiza que el plan_id sea único"""
        plans_collection = await get_collection("subscription_plans")
        
        original_id = proposed_id
        counter = 1
        
        while await plans_collection.find_one({"plan_id": proposed_id}):
            proposed_id = f"{original_id}-{counter}"
            counter += 1
            
        return proposed_id