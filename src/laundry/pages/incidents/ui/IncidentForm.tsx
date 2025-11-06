import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Input, Button } from '@/components/common';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { CreateIncidentDto, IncidentType, IncidentStatus, ActionTaken } from '@/laundry/interfaces/incidents/incidents.interface';
import { useAuthStore } from '@/auth/store/auth.store';
import { useGuides, useGarmentsByRfidCodes } from '@/laundry/hooks/guides';
import { useGetRfidScanByGuide } from '@/laundry/hooks/guides/rfid-scan';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { GuideSelectionModal, GarmentSelectionModal } from '@/laundry/components';
import { guidesApi } from '@/laundry/api/guides/guides.api';

interface IncidentFormProps {
  initialValues?: any;
  submitting?: boolean;
  onSubmit: (data: CreateIncidentDto & { status?: IncidentStatus }) => Promise<void> | void;
  onCancel?: () => void;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();
  
  // Obtener la sucursal del usuario logueado (igual que en GuideForm)
  const branchOfficeId = user?.branch_office_id || user?.sucursalId || '';
  
  // Buscar el nombre de la sucursal en la lista de sucursales
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';

  const [formData, setFormData] = useState({
    guide_id: initialValues?.guide_id || '',
    guide_number: initialValues?.guide_number || '',
    rfid_code: initialValues?.rfid_code || '',
    incident_type: initialValues?.incident_type || ('' as IncidentType | ''),
    description: initialValues?.description || '',
    responsible: initialValues?.responsible || '',
    action_taken: initialValues?.action_taken || ('' as ActionTaken | ''),
    compensation_amount: initialValues?.compensation_amount?.toString() || '0.00',
    status: initialValues?.status || ('OPEN' as IncidentStatus),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showGarmentModal, setShowGarmentModal] = useState(false);
  const [showIncidentTypeDropdown, setShowIncidentTypeDropdown] = useState(false);
  const [showActionTakenDropdown, setShowActionTakenDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Cargar guías igual que en GuidesPage (paginación normal)
  const { guides, isLoading: isLoadingGuides } = useGuides({ page: 1, limit: 10 });
  
  // Estado para almacenar el total de códigos RFID escaneados por guía
  const [scannedCountsByGuide, setScannedCountsByGuide] = useState<Record<string, number>>({});
  
  // Obtener los totales de códigos RFID escaneados para todas las guías
  useEffect(() => {
    if (!guides || guides.length === 0) return;
    
    const fetchScannedCounts = async () => {
      const counts: Record<string, number> = {};
      
      // Obtener los RFID scans de todas las guías en paralelo
      const promises = guides.map(async (guide) => {
        try {
          const { data } = await guidesApi.get(`/get-rfid-scan-by-guide/${guide.id}`);
          if (data?.data) {
            // Usar scanned_quantity o la longitud de scanned_rfid_codes
            counts[guide.id] = data.data.scanned_quantity || data.data.scanned_rfid_codes?.length || 0;
          }
        } catch (error: any) {
          // Si es 404, significa que no hay RFID scan para esta guía
          if (error.response?.status === 404) {
            counts[guide.id] = 0;
          }
        }
      });
      
      await Promise.all(promises);
      setScannedCountsByGuide(counts);
    };
    
    fetchScannedCounts();
  }, [guides]);
  
  // Obtener los RFIDs escaneados de la guía seleccionada
  const { rfidScan, isLoading: isLoadingRfidScan } = useGetRfidScanByGuide(
    formData.guide_id || '',
    !!formData.guide_id
  );
  
  // Crear lista de prendas directamente desde los códigos RFID del escaneo
  // Las prendas vienen de la tabla de escaneo RFID asociada a la guía
  const rfidCodes = rfidScan?.scanned_rfid_codes || [];
  const { data: garmentsData, isLoading: isLoadingGarments } = useGarmentsByRfidCodes(
    rfidCodes,
    rfidCodes.length > 0 && !!formData.guide_id
  );
  
  // Crear lista de prendas: usar los datos si están disponibles, pero asegurar que todas las prendas del escaneo se muestren
  const garmentsFromGuide = useMemo(() => {
    if (!rfidCodes || rfidCodes.length === 0) {
      return [];
    }

    // Crear un mapa de prendas por código RFID
    const garmentsMap = new Map();
    if (garmentsData?.data && garmentsData.data.length > 0) {
      garmentsData.data.forEach((garment: any) => {
        if (garment.rfid_code) {
          garmentsMap.set(garment.rfid_code, garment);
        }
      });
    }

    // Crear la lista final asegurando que todos los códigos RFID del escaneo estén incluidos
    return rfidCodes.map(rfidCode => {
      // Si existe la prenda en la tabla, usarla; si no, crear un objeto básico
      const existingGarment = garmentsMap.get(rfidCode);
      if (existingGarment) {
        return existingGarment;
      }
      return {
        id: rfidCode, // Usar el RFID como ID temporal
        rfid_code: rfidCode,
        description: '',
        color: '',
      };
    });
  }, [garmentsData?.data, rfidCodes]);


  // Catálogos dinámicos (frescos)
  const { data: incidentTypeCatalog } = useCatalogValuesByType('incident_type', true, { forceFresh: true });
  const { data: actionTakenCatalog } = useCatalogValuesByType('action_taken', true, { forceFresh: true });
  const { data: incidentStatusCatalog } = useCatalogValuesByType('incident_status', true, { forceFresh: true });

  const incidentTypes: { label: string; value: IncidentType }[] = useMemo(() => {
    const opts = (incidentTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a,b) => (a.display_order||0) - (b.display_order||0))
      .map(v => ({ label: v.label, value: v.code as IncidentType }));
    if (opts.length > 0) return opts;
    return [
      { label: 'Retraso', value: 'DELAY' },
      { label: 'Problema de Calidad', value: 'QUALITY_ISSUE' },
      { label: 'Daño', value: 'DAMAGE' },
      { label: 'Pérdida', value: 'LOSS' },
      { label: 'Otro', value: 'OTHER' },
    ];
  }, [incidentTypeCatalog]);

  const actionTakenOptions: { label: string; value: ActionTaken }[] = useMemo(() => {
    const opts = (actionTakenCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a,b) => (a.display_order||0) - (b.display_order||0))
      .map(v => ({ label: v.label, value: v.code as ActionTaken }));
    if (opts.length > 0) return opts;
    return [
      { label: 'Ninguna', value: 'NONE' as ActionTaken },
      { label: 'Reparar', value: 'REPAIR' },
      { label: 'Reemplazar', value: 'REPLACE' },
      { label: 'Compensar', value: 'COMPENSATE' },
      { label: 'Reembolsar', value: 'REFUND' },
      { label: 'Otro', value: 'OTHER' },
    ];
  }, [actionTakenCatalog]);

  const statusOptions: { label: string; value: IncidentStatus }[] = useMemo(() => {
    const opts = (incidentStatusCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a,b) => (a.display_order||0) - (b.display_order||0))
      .map(v => ({ label: v.label, value: v.code as IncidentStatus }));
    if (opts.length > 0) return opts;
    return [
      { label: 'Abierto', value: 'OPEN' },
      { label: 'En Progreso', value: 'IN_PROGRESS' },
      { label: 'Resuelto', value: 'RESOLVED' },
      { label: 'Cerrado', value: 'CLOSED' },
    ];
  }, [incidentStatusCatalog]);

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'guide_id':
        if (!value) {
          newErrors.guide_id = 'La guía es requerida';
        } else {
          delete newErrors.guide_id;
        }
        break;
      case 'incident_type':
        if (!value) {
          newErrors.incident_type = 'El tipo de incidente es requerido';
        } else {
          delete newErrors.incident_type;
        }
        break;
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'La descripción es requerida';
        } else {
          delete newErrors.description;
        }
        break;
      case 'compensation_amount':
        const amount = parseFloat(value);
        if (value && (isNaN(amount) || amount < 0)) {
          newErrors.compensation_amount = 'El monto debe ser un número válido mayor o igual a 0';
        } else {
          delete newErrors.compensation_amount;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    const tempErrors: Record<string, string> = {};
    
    if (!formData.guide_id) {
      tempErrors.guide_id = 'La guía es requerida';
    }
    if (!formData.incident_type) {
      tempErrors.incident_type = 'El tipo de incidente es requerido';
    }
    if (!formData.description.trim()) {
      tempErrors.description = 'La descripción es requerida';
    }

    const compensationAmount = formData.compensation_amount ? parseFloat(formData.compensation_amount) : undefined;
    if (formData.compensation_amount && (isNaN(compensationAmount!) || compensationAmount! < 0)) {
      tempErrors.compensation_amount = 'El monto debe ser un número válido mayor o igual a 0';
    }

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) {
      return;
    }

    await onSubmit({
      guide_id: formData.guide_id,
      branch_offices_id: branchOfficeId,
      rfid_code: formData.rfid_code || undefined,
      incident_type: formData.incident_type as IncidentType,
      description: formData.description,
      responsible: formData.responsible || undefined,
      action_taken: formData.action_taken || undefined,
      compensation_amount: compensationAmount,
      status: formData.status,
    });
  };

  // Mapear las guías al formato esperado por el modal
  // Usar el total de códigos RFID escaneados en lugar de total_garments
  const guideOptions = guides?.map(g => ({
    id: g.id,
    guide_number: g.guide_number,
    client_name: g.client_name || '',
    status: g.status,
    created_at: g.created_at,
    total_garments: scannedCountsByGuide[g.id] ?? 0, // Total de códigos RFID escaneados
  })) || [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Sucursal (solo lectura) */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Sucursal *</Text>
          <View className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-300">
            <Text className="text-gray-900">
              {branchOfficeName}
            </Text>
          </View>
        </View>

        {/* Guía */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Guía * *</Text>
          <TouchableOpacity
            onPress={() => setShowGuideModal(true)}
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between"
          >
            <View className="flex-1">
              {formData.guide_number ? (
                <Text className="text-gray-900">{formData.guide_number}</Text>
              ) : (
                <Text className="text-gray-400">Buscar guía por número...</Text>
              )}
            </View>
            <IonIcon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {errors.guide_id && (
            <Text className="text-red-500 text-xs mt-1">{errors.guide_id}</Text>
          )}
        </View>

        {/* RFID (opcional) */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">RFID (opcional)</Text>
          <TouchableOpacity
            onPress={() => {
              if (formData.guide_id) {
                setShowGarmentModal(true);
              }
            }}
            disabled={!formData.guide_id}
            className={`bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between ${
              !formData.guide_id ? 'opacity-50' : ''
            }`}
          >
            <View className="flex-1">
              {formData.rfid_code ? (
                <Text className="text-gray-900 font-mono">{formData.rfid_code}</Text>
              ) : (
                <Text className={formData.guide_id ? 'text-gray-400' : 'text-gray-300'}>
                  {formData.guide_id ? 'Seleccionar prenda...' : 'Primero selecciona una guía'}
                </Text>
              )}
            </View>
            <IonIcon 
              name="chevron-down" 
              size={20} 
              color={formData.guide_id ? "#6B7280" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        </View>

        {/* Tipo de Incidente */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Tipo de Incidente *</Text>
          <TouchableOpacity
            onPress={() => setShowIncidentTypeDropdown(!showIncidentTypeDropdown)}
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between"
          >
            <Text className={formData.incident_type ? 'text-gray-900' : 'text-gray-400'}>
              {formData.incident_type 
                ? incidentTypes.find(t => t.value === formData.incident_type)?.label || 'Selecciona el tipo'
                : 'Selecciona el tipo'}
            </Text>
            <IonIcon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showIncidentTypeDropdown && (
            <View className="bg-white rounded-lg border border-gray-300 mt-1" style={{ maxHeight: 200 }}>
              <ScrollView nestedScrollEnabled>
                {incidentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, incident_type: type.value }));
                      validateField('incident_type', type.value);
                      setShowIncidentTypeDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-gray-200 last:border-b-0 flex-row items-center justify-between ${
                      formData.incident_type === type.value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Text className={`${formData.incident_type === type.value ? 'text-blue-600 font-semibold' : 'text-gray-900'}`}>
                      {type.label}
                    </Text>
                    {formData.incident_type === type.value && (
                      <IonIcon name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {errors.incident_type && (
            <Text className="text-red-500 text-xs mt-1">{errors.incident_type}</Text>
          )}
        </View>

        {/* Descripción */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Descripción *</Text>
            <Input
              value={formData.description}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, description: text }));
                validateField('description', text);
              }}
              placeholder="Describe el incidente detalladamente..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[100px]"
              style={{ textAlignVertical: 'top' }}
            />
          {errors.description && (
            <Text className="text-red-500 text-xs mt-1">{errors.description}</Text>
          )}
        </View>

        

        {/* Responsable (opcional) */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Responsable (opcional)</Text>
          <Input
            value={formData.responsible}
            onChangeText={(text) => setFormData(prev => ({ ...prev, responsible: text }))}
            placeholder="Nombre del responsable"
          />
        </View>

        {/* Acción Tomada (opcional) */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Acción Tomada (opcional)</Text>
          <TouchableOpacity
            onPress={() => setShowActionTakenDropdown(!showActionTakenDropdown)}
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between"
          >
            <Text className={formData.action_taken ? 'text-gray-900' : 'text-gray-400'}>
              {formData.action_taken 
                ? actionTakenOptions.find(a => a.value === formData.action_taken)?.label || 'Selecciona la acción'
                : 'Selecciona la acción'}
            </Text>
            <IonIcon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showActionTakenDropdown && (
            <View className="bg-white rounded-lg border border-gray-300 mt-1" style={{ maxHeight: 200 }}>
              <ScrollView nestedScrollEnabled>
                {actionTakenOptions.map((action) => (
                  <TouchableOpacity
                    key={action.value}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, action_taken: action.value }));
                      setShowActionTakenDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-gray-200 last:border-b-0 flex-row items-center justify-between ${
                      formData.action_taken === action.value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Text className={formData.action_taken === action.value ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                      {action.label}
                    </Text>
                    {formData.action_taken === action.value && (
                      <IonIcon name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Monto de Compensación (opcional) */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Monto de Compensación (opcional)</Text>
          <Input
            value={formData.compensation_amount}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, compensation_amount: text }));
              validateField('compensation_amount', text);
            }}
            placeholder="0.00"
            keyboardType="numeric"
          />
          {errors.compensation_amount && (
            <Text className="text-red-500 text-xs mt-1">{errors.compensation_amount}</Text>
          )}
        </View>

        {/* Estado (opcional) */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Estado (opcional)</Text>
          <TouchableOpacity
            onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between"
          >
            <Text className="text-gray-900">
              {statusOptions.find(s => s.value === formData.status)?.label || 'Abierto'}
            </Text>
            <IonIcon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showStatusDropdown && (
            <View className="bg-white rounded-lg border border-gray-300 mt-1" style={{ maxHeight: 200 }}>
              <ScrollView nestedScrollEnabled>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, status: status.value }));
                      setShowStatusDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-gray-200 last:border-b-0 flex-row items-center justify-between ${
                      formData.status === status.value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Text className={`${formData.status === status.value ? 'text-blue-600 font-semibold' : 'text-gray-900'}`}>
                      {status.label}
                    </Text>
                    {formData.status === status.value && (
                      <IonIcon name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Botones */}
        <View className="flex-row space-x-2 mt-4 mb-8">
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onCancel}
            className="flex-1"
          />
          <Button
            title={submitting ? 'Guardando...' : 'Guardar'}
            variant="primary"
            onPress={handleSubmit}
            isLoading={submitting}
            disabled={submitting}
            className="flex-1"
          />
        </View>
      </ScrollView>

      {/* Modal de Selección de Guía */}
      <GuideSelectionModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onSelectGuide={(guideId) => {
          const selectedGuide = guides.find(g => g.id === guideId);
          setFormData(prev => ({
            ...prev,
            guide_id: guideId,
            guide_number: selectedGuide?.guide_number || '',
            rfid_code: '', // Limpiar RFID cuando se cambia de guía
          }));
          validateField('guide_id', guideId);
          setShowGuideModal(false);
        }}
        processType=""
        guides={guideOptions}
        isLoading={isLoadingGuides}
      />

      {/* Modal de Selección de Prenda - Solo prendas de la guía seleccionada */}
      <GarmentSelectionModal
        visible={showGarmentModal}
        onClose={() => setShowGarmentModal(false)}
        onSelectGarment={(rfidCode) => {
          setFormData(prev => ({ ...prev, rfid_code: rfidCode }));
          setShowGarmentModal(false);
        }}
        garments={garmentsFromGuide.map(g => ({
          id: g.id || '',
          rfid_code: g.rfid_code || '',
          description: g.description || '',
          color: g.color || '',
        }))}
        isLoading={isLoadingGarments || isLoadingRfidScan}
      />
    </KeyboardAvoidingView>
  );
};

