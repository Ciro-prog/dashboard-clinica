// Utility functions for generating unique IDs across all entities

// Generate clinic ID
export const generateClinicId = (clinicName: string): string => {
  const nameSlug = clinicName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Only letters and numbers
    .substring(0, 12); // Max 12 characters
  
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5);
  
  return `clinica-${nameSlug}-${timestamp}${random}`;
};

// Generate professional ID
export const generateProfessionalId = (firstName: string, lastName: string, clinicId: string): string => {
  const nameSlug = `${firstName}${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);
  
  const clinicSuffix = clinicId.split('-').pop()?.substring(0, 4) || 'xxxx';
  const timestamp = Date.now().toString().slice(-4);
  
  return `prof-${nameSlug}-${clinicSuffix}-${timestamp}`;
};

// Generate patient ID
export const generatePatientId = (firstName: string, lastName: string, clinicId: string): string => {
  const nameSlug = `${firstName}${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);
  
  const clinicSuffix = clinicId.split('-').pop()?.substring(0, 4) || 'xxxx';
  const timestamp = Date.now().toString().slice(-4);
  
  return `pac-${nameSlug}-${clinicSuffix}-${timestamp}`;
};

// Generate appointment ID
export const generateAppointmentId = (clinicId: string, date: string): string => {
  const clinicSuffix = clinicId.split('-').pop()?.substring(0, 4) || 'xxxx';
  const dateSlug = date.replace(/[^0-9]/g, '').substring(0, 8); // YYYYMMDD
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.random().toString(36).substring(2, 4);
  
  return `apt-${clinicSuffix}-${dateSlug}-${timestamp}${random}`;
};

// Generate general unique ID with prefix
export const generateUniqueId = (prefix: string, context?: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  const contextSlug = context
    ? context.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6)
    : '';
  
  return `${prefix}-${contextSlug ? contextSlug + '-' : ''}${timestamp}-${random}`;
};

// Validate ID format
export const validateId = (id: string, expectedPrefix: string): boolean => {
  return id.startsWith(expectedPrefix) && id.length >= 10;
};

// Extract information from ID
export const parseId = (id: string) => {
  const parts = id.split('-');
  return {
    prefix: parts[0],
    context: parts.length > 3 ? parts[1] : null,
    timestamp: parts[parts.length - 2],
    random: parts[parts.length - 1]
  };
};