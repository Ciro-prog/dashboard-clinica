import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, date, timedelta
import json

# Page configuration
st.set_page_config(
    page_title="ClínicaAdmin - Panel Administrativo",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API Configuration
API_BASE_URL = "http://localhost:8000"

# Custom CSS
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 4px solid #667eea;
    }
    
    .success-box {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        padding: 10px;
        margin: 10px 0;
        color: #155724;
    }
    
    .error-box {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        padding: 10px;
        margin: 10px 0;
        color: #721c24;
    }
    
    .sidebar .sidebar-content {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'token' not in st.session_state:
    st.session_state.token = None
if 'user_data' not in st.session_state:
    st.session_state.user_data = None

def make_api_request(endpoint, method="GET", data=None, headers=None):
    """Make API request with error handling"""
    if headers is None:
        headers = {}
    
    # Temporarily disable authentication for debugging
    # if st.session_state.token:
    #     headers["Authorization"] = f"Bearer {st.session_state.token}"
    
    url = f"{API_BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "PATCH":
            response = requests.patch(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        if response.status_code == 401:
            st.session_state.authenticated = False
            st.session_state.token = None
            st.session_state.user_data = None
            st.error("Sesión expirada. Por favor, inicie sesión nuevamente.")
            st.experimental_rerun()
        
        return response
    except requests.exceptions.RequestException as e:
        st.error(f"Error de conexión: {e}")
        return None

def login_page():
    """Login page"""
    st.markdown('<div class="main-header"><h1>🏥 ClínicaAdmin</h1><p>Panel de Administración</p></div>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown("### 🔐 Iniciar Sesión")
        
        with st.form("login_form"):
            username = st.text_input("👤 Usuario", placeholder="Ingrese su usuario")
            password = st.text_input("🔒 Contraseña", type="password", placeholder="Ingrese su contraseña")
            
            submit_button = st.form_submit_button("🚀 Iniciar Sesión", use_container_width=True)
            
            if submit_button:
                if username and password:
                    # Make login request
                    login_data = {
                        "username": username,
                        "password": password,
                        "user_type": "admin"
                    }
                    
                    response = make_api_request("/api/auth/login", "POST", login_data)
                    
                    if response and response.status_code == 200:
                        token_data = response.json()
                        st.session_state.authenticated = True
                        st.session_state.token = token_data["access_token"]
                        st.session_state.user_data = token_data["user_data"]
                        st.success("✅ Inicio de sesión exitoso")
                        st.experimental_rerun()
                    else:
                        st.error("❌ Credenciales incorrectas")
                else:
                    st.error("⚠️ Por favor complete todos los campos")

def dashboard_page():
    """Main dashboard page"""
    st.markdown('<div class="main-header"><h1>📊 Dashboard Principal</h1></div>', unsafe_allow_html=True)
    
    # Get stats (temporary endpoint without auth)
    response = make_api_request("/temp/admin/dashboard/stats")
    if response and response.status_code == 200:
        stats = response.json()
        
        # Metrics row
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                label="🏥 Total Clínicas",
                value=stats["total_clinics"],
                delta=None
            )
        
        with col2:
            st.metric(
                label="✅ Activas",
                value=stats["active_clinics"],
                delta=f"{(stats['active_clinics']/max(stats['total_clinics'], 1)*100):.1f}%"
            )
        
        with col3:
            st.metric(
                label="🆓 En Prueba",
                value=stats["trial_clinics"]
            )
        
        with col4:
            st.metric(
                label="💰 Ingresos Mensuales",
                value=f"${stats['revenue_monthly']:.2f}"
            )
        
        st.markdown("---")
        
        # Charts
        col1, col2 = st.columns(2)
        
        with col1:
            # Subscription status pie chart
            fig_subscription = px.pie(
                values=[stats["active_clinics"], stats["trial_clinics"], stats["expired_clinics"]],
                names=["Activas", "Prueba", "Expiradas"],
                title="Estado de Suscripciones",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            st.plotly_chart(fig_subscription, use_container_width=True)
        
        with col2:
            # Activity chart (placeholder)
            dates = pd.date_range(start=datetime.now() - timedelta(days=30), end=datetime.now(), freq='D')
            activity_data = pd.DataFrame({
                'date': dates,
                'new_clinics': [np.random.randint(0, 5) for _ in range(len(dates))],
                'active_sessions': [np.random.randint(10, 50) for _ in range(len(dates))]
            })
            
            fig_activity = px.line(
                activity_data, 
                x='date', 
                y=['new_clinics', 'active_sessions'],
                title="Actividad de los Últimos 30 Días",
                labels={'value': 'Cantidad', 'date': 'Fecha'}
            )
            st.plotly_chart(fig_activity, use_container_width=True)

def clinics_page():
    """Clinics management page"""
    st.markdown('<div class="main-header"><h1>🏥 Gestión de Clínicas</h1></div>', unsafe_allow_html=True)
    
    # Filters
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        status_filter = st.selectbox(
            "Estado", 
            ["Todos", "active", "inactive", "suspended"],
            key="clinic_status_filter"
        )
    
    with col2:
        subscription_filter = st.selectbox(
            "Suscripción",
            ["Todos", "trial", "active", "expired", "cancelled"],
            key="clinic_subscription_filter"
        )
    
    with col3:
        search_term = st.text_input("🔍 Buscar", placeholder="Nombre, email, ID...", key="clinic_search")
    
    with col4:
        if st.button("🔄 Actualizar", key="refresh_clinics"):
            st.experimental_rerun()
    
    # Build query parameters
    params = {}
    if status_filter != "Todos":
        params["status"] = status_filter
    if subscription_filter != "Todos":
        params["subscription_status"] = subscription_filter
    if search_term:
        params["search"] = search_term
    
    # Get clinics (temporary endpoint without auth)
    endpoint = "/temp/admin/clinics"
    if params:
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/temp/admin/clinics?{query_string}"
    
    response = make_api_request(endpoint)
    
    if response and response.status_code == 200:
        clinics = response.json()
        
        if clinics:
            # Create DataFrame
            df = pd.DataFrame(clinics)
            df['created_at'] = pd.to_datetime(df['created_at']).dt.strftime('%Y-%m-%d')
            
            # Display table
            st.markdown("### 📋 Lista de Clínicas")
            
            # Custom column display
            display_columns = [
                'clinic_id', 'name_clinic', 'suscriber', 'email', 
                'status_clinic', 'subscription_status', 'subscription_plan', 'created_at'
            ]
            
            for i, clinic in enumerate(clinics):
                with st.expander(f"🏥 {clinic['name_clinic']} ({clinic['clinic_id']})"):
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.write("**Información Básica:**")
                        st.write(f"ID: {clinic['clinic_id']}")
                        st.write(f"Responsable: {clinic['suscriber']}")
                        st.write(f"Email: {clinic['email']}")
                        st.write(f"Teléfono: {clinic['cell_phone']}")
                    
                    with col2:
                        st.write("**Estado & Suscripción:**")
                        status_color = "🟢" if clinic['status_clinic'] == 'active' else "🔴"
                        st.write(f"Estado: {status_color} {clinic['status_clinic']}")
                        
                        sub_color = "🟢" if clinic['subscription_status'] == 'active' else "🟡" if clinic['subscription_status'] == 'trial' else "🔴"
                        st.write(f"Suscripción: {sub_color} {clinic['subscription_status']}")
                        st.write(f"Plan: {clinic['subscription_plan']}")
                        
                        if clinic.get('subscription_expires'):
                            st.write(f"Expira: {clinic['subscription_expires']}")
                    
                    with col3:
                        st.write("**Acciones:**")
                        
                        # Toggle status
                        if clinic['status_clinic'] == 'active':
                            if st.button(f"🔴 Suspender", key=f"suspend_{clinic['id']}"):
                                toggle_response = make_api_request(
                                    f"/clinics/{clinic['clinic_id']}/status?status_clinic=suspended",
                                    "PATCH"
                                )
                                if toggle_response and toggle_response.status_code == 200:
                                    st.success("Clínica suspendida")
                                    st.experimental_rerun()
                        else:
                            if st.button(f"🟢 Activar", key=f"activate_{clinic['id']}"):
                                toggle_response = make_api_request(
                                    f"/clinics/{clinic['clinic_id']}/status?status_clinic=active",
                                    "PATCH"
                                )
                                if toggle_response and toggle_response.status_code == 200:
                                    st.success("Clínica activada")
                                    st.experimental_rerun()
                        
                        # Edit subscription
                        if st.button(f"✏️ Editar Suscripción", key=f"edit_sub_{clinic['id']}"):
                            st.session_state[f"editing_subscription_{clinic['id']}"] = True
                        
                        # Show subscription edit form
                        if st.session_state.get(f"editing_subscription_{clinic['id']}", False):
                            with st.form(f"subscription_form_{clinic['id']}"):
                                new_status = st.selectbox(
                                    "Estado Suscripción",
                                    ["trial", "active", "expired", "cancelled"],
                                    index=["trial", "active", "expired", "cancelled"].index(clinic['subscription_status'])
                                )
                                new_plan = st.selectbox(
                                    "Plan",
                                    ["trial", "basic", "premium", "enterprise"],
                                    index=["trial", "basic", "premium", "enterprise"].index(clinic['subscription_plan'])
                                )
                                new_expires = st.date_input("Fecha de Expiración")
                                
                                col_save, col_cancel = st.columns(2)
                                with col_save:
                                    if st.form_submit_button("💾 Guardar"):
                                        subscription_data = {
                                            "subscription_status": new_status,
                                            "subscription_plan": new_plan,
                                            "subscription_expires": new_expires.isoformat() if new_expires else None
                                        }
                                        
                                        sub_response = make_api_request(
                                            f"/clinics/{clinic['clinic_id']}/subscription",
                                            "PATCH",
                                            subscription_data
                                        )
                                        
                                        if sub_response and sub_response.status_code == 200:
                                            st.success("Suscripción actualizada")
                                            st.session_state[f"editing_subscription_{clinic['id']}"] = False
                                            st.experimental_rerun()
                                
                                with col_cancel:
                                    if st.form_submit_button("❌ Cancelar"):
                                        st.session_state[f"editing_subscription_{clinic['id']}"] = False
                                        st.experimental_rerun()
        else:
            st.info("No se encontraron clínicas con los filtros aplicados")
    else:
        st.error("Error al cargar las clínicas")

def create_clinic_page():
    """Create new clinic page"""
    st.markdown('<div class="main-header"><h1>➕ Crear Nueva Clínica</h1></div>', unsafe_allow_html=True)
    
    with st.form("create_clinic_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 🏥 Información de la Clínica")
            clinic_id = st.text_input("ID de Clínica *", placeholder="clinic-001")
            name_clinic = st.text_input("Nombre de la Clínica *", placeholder="Clínica Ejemplo")
            suscriber = st.text_input("Responsable *", placeholder="Dr. Juan Pérez")
            email = st.text_input("Email *", placeholder="admin@clinica.com")
            password = st.text_input("Contraseña *", type="password", placeholder="Mínimo 8 caracteres")
        
        with col2:
            st.markdown("#### 📞 Contacto y Configuración")
            cell_phone = st.text_input("Teléfono *", placeholder="+54 9 11 1234-5678")
            address = st.text_area("Dirección *", placeholder="Av. Corrientes 1234, Buenos Aires")
            
            st.markdown("#### 📋 Suscripción")
            subscription_plan = st.selectbox("Plan", ["trial", "basic", "premium", "enterprise"])
            subscription_expires = st.date_input("Fecha de Expiración", value=date.today() + timedelta(days=30))
            
            max_professionals = st.number_input("Máximo Profesionales", min_value=1, max_value=100, value=5)
            max_patients = st.number_input("Máximo Pacientes", min_value=1, max_value=10000, value=100)
        
        submitted = st.form_submit_button("🚀 Crear Clínica", use_container_width=True)
        
        if submitted:
            # Validate required fields
            required_fields = [clinic_id, name_clinic, suscriber, email, password, cell_phone, address]
            if all(required_fields):
                clinic_data = {
                    "clinic_id": clinic_id,
                    "name_clinic": name_clinic,
                    "suscriber": suscriber,
                    "email": email,
                    "password": password,
                    "cell_phone": cell_phone,
                    "address": address,
                    "subscription_plan": subscription_plan,
                    "subscription_status": "trial" if subscription_plan == "trial" else "active",
                    "subscription_expires": subscription_expires.isoformat(),
                    "max_professionals": max_professionals,
                    "max_patients": max_patients
                }
                
                response = make_api_request("/api/admin/clinics", "POST", clinic_data)
                
                if response and response.status_code == 201:
                    st.success("✅ Clínica creada exitosamente")
                    st.balloons()
                elif response:
                    error_data = response.json()
                    st.error(f"❌ Error: {error_data.get('detail', 'Error desconocido')}")
                else:
                    st.error("❌ Error de conexión")
            else:
                st.error("⚠️ Por favor complete todos los campos obligatorios")

def main():
    """Main application"""
    # Temporarily skip authentication for debugging
    # if not st.session_state.authenticated:
    #     login_page()
    #     return
    
    # Sidebar navigation
    st.sidebar.markdown("### 🧭 Navegación")
    st.sidebar.markdown(f"👤 **admin** (demo)")
    st.sidebar.markdown(f"🎭 *super_admin* (demo)")
    st.sidebar.markdown("---")
    
    # Navigation menu
    pages = {
        "📊 Dashboard": dashboard_page,
        "🏥 Gestión de Clínicas": clinics_page,
        "➕ Crear Clínica": create_clinic_page,
    }
    
    selected_page = st.sidebar.selectbox("Seleccionar Página", list(pages.keys()))
    
    # Logout button
    if st.sidebar.button("🚪 Cerrar Sesión"):
        st.session_state.authenticated = False
        st.session_state.token = None
        st.session_state.user_data = None
        st.experimental_rerun()
    
    # Show selected page
    pages[selected_page]()

if __name__ == "__main__":
    import numpy as np  # For charts
    main()