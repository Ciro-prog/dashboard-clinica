"""
Email generator utilities for professionals
"""
import re
from typing import Tuple
from unidecode import unidecode

def normalize_name(name: str) -> str:
    """
    Normalize a name for email generation.
    
    Args:
        name: Raw name string
        
    Returns:
        Normalized name suitable for email
    """
    # Remove accents and special characters
    normalized = unidecode(name.lower())
    # Remove non-alphanumeric characters except spaces
    normalized = re.sub(r'[^a-zA-Z0-9\s]', '', normalized)
    # Replace multiple spaces with single space
    normalized = re.sub(r'\s+', ' ', normalized)
    # Strip whitespace
    normalized = normalized.strip()
    # Replace spaces with dots
    normalized = normalized.replace(' ', '.')
    
    return normalized

def generate_professional_email(first_name: str, last_name: str, clinic_domain: str) -> str:
    """
    Generate professional email in format: first_name.last_name@clinic_domain.com
    
    Args:
        first_name: Professional's first name
        last_name: Professional's last name  
        clinic_domain: Clinic's domain name (e.g., "clinicamedica")
        
    Returns:
        Generated email address
        
    Examples:
        >>> generate_professional_email("Juan Carlos", "García López", "clinicamedica")
        'juan.carlos.garcia.lopez@clinicamedica.com'
        >>> generate_professional_email("María José", "Rodríguez", "centromedico")  
        'maria.jose.rodriguez@centromedico.com'
    """
    # Normalize names
    norm_first = normalize_name(first_name)
    norm_last = normalize_name(last_name)
    
    # Ensure clinic domain is clean
    clean_domain = normalize_name(clinic_domain).replace('.', '')
    
    # Generate email
    email = f"{norm_first}.{norm_last}@{clean_domain}.com"
    
    return email

def generate_clinic_email_domain(clinic_name: str, suscriber: str = None) -> str:
    """
    Generate a clean domain name for clinic emails.
    
    Args:
        clinic_name: Clinic's name
        suscriber: Suscriber field (optional fallback)
        
    Returns:
        Clean domain name without .com
        
    Examples:
        >>> generate_clinic_email_domain("Clínica Médica San Juan")
        'clinicamedicasanjuan'
        >>> generate_clinic_email_domain("Centro de Salud María")
        'centrodesaludmaria'
    """
    # Use clinic_name primarily, fallback to suscriber
    source_name = clinic_name or suscriber or "clinica"
    
    # Normalize the name
    normalized = normalize_name(source_name)
    # Remove dots for domain
    domain = normalized.replace('.', '')
    
    # Ensure it's not empty and has reasonable length
    if not domain or len(domain) < 3:
        domain = "clinica"
    
    # Limit length for practical use
    if len(domain) > 50:
        domain = domain[:50]
    
    return domain

def validate_email_uniqueness(email: str, existing_emails: list) -> Tuple[bool, str]:
    """
    Check if email is unique and suggest alternative if not.
    
    Args:
        email: Proposed email address
        existing_emails: List of existing email addresses
        
    Returns:
        Tuple of (is_unique, suggested_email)
    """
    if email not in existing_emails:
        return True, email
    
    # Generate alternatives
    base_email = email.split('@')[0]
    domain = email.split('@')[1]
    
    for i in range(1, 100):
        alternative = f"{base_email}{i}@{domain}"
        if alternative not in existing_emails:
            return False, alternative
    
    # If we can't find a unique one after 99 attempts, use timestamp
    import time
    timestamp = str(int(time.time()))[-4:]  # Last 4 digits of timestamp
    fallback = f"{base_email}{timestamp}@{domain}"
    
    return False, fallback

def get_n8n_folder_name(suscriber: str, clinic_name: str = None) -> str:
    """
    Generate N8N folder name in format: "{suscriber} - Operativa"
    
    Args:
        suscriber: Suscriber field
        clinic_name: Optional clinic name as fallback
        
    Returns:
        N8N folder name
    """
    base_name = suscriber or clinic_name or "Clinica"
    return f"{base_name} - Operativa"