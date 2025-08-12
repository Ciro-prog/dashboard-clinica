import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Users, Upload, Download, CheckCircle, AlertTriangle, Mail } from 'lucide-react';

interface ProfessionalData {
  first_name: string;
  last_name: string;
  speciality: string;
  phone: string;
  license_number: string;
  password: string;
  email_preview?: string;
}

interface BulkProfessionalCreatorProps {
  clinicId: string;
  clinicDomain: string;
  maxProfessionals: number;
  currentCount: number;
  onClose: () => void;
  onSuccess: (professionals: any[]) => void;
}

const BulkProfessionalCreator: React.FC<BulkProfessionalCreatorProps> = ({
  clinicId,
  clinicDomain,
  maxProfessionals,
  currentCount,
  onClose,
  onSuccess
}) => {
  const [professionals, setProfessionals] = useState<ProfessionalData[]>([
    { first_name: '', last_name: '', speciality: '', phone: '', license_number: '', password: '' }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<{success: any[], errors: any[]}>({ success: [], errors: [] });
  const [showResults, setShowResults] = useState(false);

  const availableSlots = maxProfessionals - currentCount;

  const generateEmailPreview = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return '';
    
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '.'); // Replace spaces with dots
    };
    
    const normalizedFirst = normalizeText(firstName);
    const normalizedLast = normalizeText(lastName);
    
    return `${normalizedFirst}.${normalizedLast}@${clinicDomain}.com`;
  };

  const updateProfessional = (index: number, field: keyof ProfessionalData, value: string) => {
    setProfessionals(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Update email preview if name fields changed
      if (field === 'first_name' || field === 'last_name') {
        updated[index].email_preview = generateEmailPreview(
          updated[index].first_name,
          updated[index].last_name
        );
      }
      
      return updated;
    });
  };

  const addProfessional = () => {
    if (professionals.length < availableSlots) {
      setProfessionals(prev => [
        ...prev,
        { first_name: '', last_name: '', speciality: '', phone: '', license_number: '', password: '' }
      ]);
    }
  };

  const removeProfessional = (index: number) => {
    if (professionals.length > 1) {
      setProfessionals(prev => prev.filter((_, i) => i !== index));
    }
  };

  const duplicateProfessional = (index: number) => {
    if (professionals.length < availableSlots) {
      const original = professionals[index];
      setProfessionals(prev => [
        ...prev,
        { ...original, first_name: '', last_name: '', email_preview: '' }
      ]);
    }
  };

  const generatePassword = (index: number) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    updateProfessional(index, 'password', password);
  };

  const validateProfessional = (professional: ProfessionalData) => {
    const errors = [];
    
    if (!professional.first_name.trim()) errors.push('Nombre requerido');
    if (!professional.last_name.trim()) errors.push('Apellido requerido');
    if (!professional.speciality.trim()) errors.push('Especialidad requerida');
    if (!professional.phone.trim()) errors.push('Teléfono requerido');
    if (!professional.password.trim()) errors.push('Contraseña requerida');
    if (professional.password.length < 8) errors.push('Contraseña debe tener al menos 8 caracteres');
    
    return errors;
  };

  const validateAll = () => {
    const allErrors: string[][] = [];
    let hasErrors = false;
    
    professionals.forEach((prof, index) => {
      const errors = validateProfessional(prof);
      allErrors[index] = errors;
      if (errors.length > 0) hasErrors = true;
    });
    
    return { hasErrors, allErrors };
  };

  const handleBulkCreate = async () => {
    const { hasErrors, allErrors } = validateAll();
    
    if (hasErrors) {
      alert('Por favor corrige los errores de validación antes de continuar.');
      return;
    }

    setIsCreating(true);
    const results = { success: [], errors: [] };

    try {
      const token = localStorage.getItem('admin_token');
      
      for (let i = 0; i < professionals.length; i++) {
        const professional = professionals[i];
        
        try {
          const response = await fetch(`/api/admin/clinics/${clinicId}/professionals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              first_name: professional.first_name,
              last_name: professional.last_name,
              speciality: professional.speciality,
              phone: professional.phone,
              license_number: professional.license_number,
              password: professional.password
            })
          });

          if (response.ok) {
            const createdProfessional = await response.json();
            results.success.push({
              index: i + 1,
              name: `${professional.first_name} ${professional.last_name}`,
              email: createdProfessional.email,
              professional: createdProfessional
            });
          } else {
            const errorData = await response.json();
            results.errors.push({
              index: i + 1,
              name: `${professional.first_name} ${professional.last_name}`,
              error: errorData.detail || 'Error desconocido'
            });
          }
        } catch (error) {
          results.errors.push({
            index: i + 1,
            name: `${professional.first_name} ${professional.last_name}`,
            error: `Error de conexión: ${error}`
          });
        }
      }

      setResults(results);
      setShowResults(true);

      if (results.success.length > 0) {
        // Call success callback with created professionals
        onSuccess(results.success.map(r => r.professional));
      }

    } catch (error) {
      alert(`Error general: ${error}`);
    } finally {
      setIsCreating(false);
    }
  };

  const exportTemplate = () => {
    const csvContent = [
      'first_name,last_name,speciality,phone,license_number,password',
      'Juan,Pérez,Cardiología,+54911234567,MP-12345,password123',
      'María,García,Pediatría,+54911234568,MP-12346,password124',
      'Carlos,López,Traumatología,+54911234569,MP-12347,password125'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_profesionales.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Resultados de Creación</h3>
              <button
                onClick={() => {
                  setShowResults(false);
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Results */}
            {results.success.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Profesionales Creados Exitosamente ({results.success.length})
                </h4>
                <div className="space-y-2">
                  {results.success.map((result, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-800">{result.name}</span>
                        <div className="flex items-center text-sm text-green-600">
                          <Mail className="w-3 h-3 mr-1" />
                          {result.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Results */}
            {results.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-red-800 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Errores en la Creación ({results.errors.length})
                </h4>
                <div className="space-y-2">
                  {results.errors.map((result, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="font-medium text-red-800">{result.name}</div>
                      <div className="text-sm text-red-600">{result.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResults(false);
                  onClose();
                }}
                className="px-4 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Crear Múltiples Profesionales</h3>
              <p className="text-sm text-gray-600">
                Disponibles: {availableSlots} de {maxProfessionals} profesionales
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportTemplate}
                className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {professionals.map((professional, index) => {
              const validationErrors = validateProfessional(professional);
              const hasErrors = validationErrors.length > 0;

              return (
                <div key={index} className={`border rounded-lg p-4 ${hasErrors ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Profesional #{index + 1}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => duplicateProfessional(index)}
                        disabled={professionals.length >= availableSlots}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        Duplicar
                      </button>
                      {professionals.length > 1 && (
                        <button
                          onClick={() => removeProfessional(index)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={professional.first_name}
                        onChange={(e) => updateProfessional(index, 'first_name', e.target.value)}
                        placeholder="Juan Carlos"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 ${
                          hasErrors ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={professional.last_name}
                        onChange={(e) => updateProfessional(index, 'last_name', e.target.value)}
                        placeholder="García López"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 ${
                          hasErrors ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Especialidad *
                      </label>
                      <input
                        type="text"
                        value={professional.speciality}
                        onChange={(e) => updateProfessional(index, 'speciality', e.target.value)}
                        placeholder="Cardiología"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 ${
                          hasErrors ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={professional.phone}
                        onChange={(e) => updateProfessional(index, 'phone', e.target.value)}
                        placeholder="+54911234567"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 ${
                          hasErrors ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nº Matrícula
                      </label>
                      <input
                        type="text"
                        value={professional.license_number}
                        onChange={(e) => updateProfessional(index, 'license_number', e.target.value)}
                        placeholder="MP-12345"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña *
                      </label>
                      <div className="flex space-x-1">
                        <input
                          type="password"
                          value={professional.password}
                          onChange={(e) => updateProfessional(index, 'password', e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 ${
                            hasErrors ? 'border-red-300' : 'border-gray-300'
                          }`}
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => generatePassword(index)}
                          className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          title="Generar contraseña aleatoria"
                        >
                          Gen
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Preview */}
                  {professional.email_preview && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-blue-600" />
                        <strong>Email generado:</strong> <span className="ml-1 text-blue-800">{professional.email_preview}</span>
                      </div>
                    </div>
                  )}

                  {/* Validation Errors */}
                  {hasErrors && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-sm text-red-800">
                        <strong>Errores de validación:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {validationErrors.map((error, errorIndex) => (
                            <li key={errorIndex}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Professional Button */}
          {professionals.length < availableSlots && (
            <div className="mt-6 text-center">
              <button
                onClick={addProfessional}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Otro Profesional ({professionals.length}/{availableSlots})
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkCreate}
              disabled={isCreating || professionals.length === 0}
              className="px-6 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Crear {professionals.length} Profesional{professionals.length !== 1 ? 'es' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkProfessionalCreator;