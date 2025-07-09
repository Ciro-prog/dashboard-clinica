// Versión simple y directa para testing
const API_URL = 'http://localhost:1337';

// Función simple para obtener datos
export async function fetchClinics() {
  try {
    const response = await fetch(`${API_URL}/api/clinics`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Clínicas obtenidas:', data);
    return data;
  } catch (error) {
    console.error('Error fetching clinics:', error);
    throw error;
  }
}

export async function fetchPatients() {
  try {
    const response = await fetch(`${API_URL}/api/patients`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Pacientes obtenidos:', data);
    return data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
}

export async function fetchAppointments() {
  try {
    const response = await fetch(`${API_URL}/api/appointments`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Turnos obtenidos:', data);
    return data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

export async function fetchProfessionals() {
  try {
    const response = await fetch(`${API_URL}/api/professionals`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Profesionales obtenidos:', data);
    return data;
  } catch (error) {
    console.error('Error fetching professionals:', error);
    throw error;
  }
}

export async function fetchMetrics() {
  try {
    const response = await fetch(`${API_URL}/api/metrics`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Métricas obtenidas:', data);
    return data;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }
}

// Función para testear todas las APIs
export async function testAllApis() {
  console.log('🧪 Testing todas las APIs...');
  
  try {
    await fetchClinics();
    await fetchPatients();
    await fetchAppointments();
    await fetchProfessionals();
    await fetchMetrics();
    console.log('✅ Todas las APIs funcionan correctamente!');
  } catch (error) {
    console.error('❌ Error en las APIs:', error);
  }
}