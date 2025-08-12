export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

export interface DashboardStats {
  total_clinics: number;
  active_clinics: number;
  trial_clinics: number;
  inactive_clinics: number;
  monthly_revenue: number;
  total_patients: number;
  total_professionals: number;
  plan_distribution: Record<string, number>;
  growth_this_month: number;
}

export interface SubscriptionFeatures {
  whatsapp_integration: boolean;
  patient_history: boolean;
  appointment_scheduling: boolean;
  medical_records: boolean;
  analytics_dashboard: boolean;
  custom_branding: boolean;
  api_access: boolean;
  priority_support: boolean;
}

export interface SubscriptionPlan {
  name: string;
  price: number;
  duration_days: number;
  features: SubscriptionFeatures;
  max_professionals: number;
  max_patients: number;
}

export interface ClinicBranding {
  clinic_title: string;
  clinic_subtitle: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'phone' | 'email';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: string;
}

export interface ClinicData {
  id: string;
  clinic_id: string;
  name_clinic: string;
  suscriber: string;
  email: string;
  cell_phone: string;
  address: string;
  status_clinic: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires?: string;
  subscription_features: SubscriptionFeatures;
  max_professionals: number;
  max_patients: number;
  branding?: ClinicBranding;
  n8n_folder_name?: string;
  patient_form_fields?: string[];
  custom_patient_fields?: CustomField[];
  created_at: string;
  updated_at: string;
  last_login?: string;
}