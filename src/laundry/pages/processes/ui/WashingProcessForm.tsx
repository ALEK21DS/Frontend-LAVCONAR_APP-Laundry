import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button, Input, Dropdown } from '@/components/common';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/auth/store/auth.store';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { useCatalogLabelMap } from '@/laundry/hooks';
import { useMachines, Machine } from '@/laundry/hooks/machines';
import { useCreateWashingProcess, useUpdateWashingProcess, useWashingProcessByGuide } from '@/laundry/hooks/washing-processes';
import { useUpdateRfidScan } from '@/laundry/hooks/guides/rfid-scan';
import { useGarmentsByRfidCodes } from '@/laundry/hooks/guides/garments';
import { safeParseFloat, safeParseInt } from '@/helpers/validators.helper';
import { MachineSelectionModal, DatePickerModal, TimePickerModal } from '@/laundry/components';
import { guidesApi } from '@/laundry/api/guides/guides.api';

interface WashingProcessFormProps {
  visible: boolean;
  guideId: string;
  guideNumber: string;
  branchOfficeId: string;
  branchOfficeName: string;
  processType: string;
  rfidScanId?: string;
  rfidScan?: any;
  pendingScanTypeUpdate?: string;
  rfidScanUpdateData?: any; // Datos del RFID scan actualizado desde ScanForm
  onSuccess: () => void;
  onCancel: () => void;
  initialProcess?: any;
}

const padNumber = (value: number) => value.toString().padStart(2, '0');

const formatDateForInput = (value?: string | Date | null) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  const hours = padNumber(date.getHours());
  const minutes = padNumber(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const normalizeDateInput = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const toStringOrEmpty = (value?: number | null) =>
  value !== undefined && value !== null && !Number.isNaN(value)
    ? String(value)
    : '';

const formatWeight = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '';
  }
  return Number(value).toFixed(2);
};

export const WashingProcessForm: React.FC<WashingProcessFormProps> = ({
  visible,
  guideId,
  guideNumber,
  branchOfficeId,
  branchOfficeName,
  processType,
  rfidScanId,
  rfidScan,
  pendingScanTypeUpdate,
  rfidScanUpdateData,
  onSuccess,
  onCancel,
  initialProcess,
}) => {
  const { user } = useAuthStore();
  const { createWashingProcessAsync, isCreating } = useCreateWashingProcess();
  const { updateWashingProcessAsync, isUpdating } = useUpdateWashingProcess();
  const { updateRfidScanAsync } = useUpdateRfidScan();

  // Buscar proceso existente por tipo
  const {
    processByStatus,
    latestProcess,
    isLoading: isLoadingProcess,
    error: processError,
    refetch: refetchProcess,
  } = useWashingProcessByGuide(guideId, visible);

  const existingProcess = useMemo(() => {
    if (!processType) return null;
    return processByStatus?.[processType] ?? null;
  }, [processByStatus, processType]);

  const sourceProcess = useMemo(() => {
    if (existingProcess) return existingProcess;
    if (latestProcess) return latestProcess;
    return null;
  }, [existingProcess, latestProcess]);

  useEffect(() => {
    if (visible) {
      refetchProcess();
    }
  }, [visible, refetchProcess]);

  // Catálogos
  const { data: specialTreatmentCatalog } = useCatalogValuesByType('special_treatment', true, { forceFresh: true });
  const { data: washTemperatureCatalog } = useCatalogValuesByType('wash_temperature', true, { forceFresh: true });
  const { getLabel: getProcessTypeLabel, isLoading: isLoadingProcessTypeLabel } = useCatalogLabelMap('process_type', { forceFresh: true });
  
  // Mapa de fallback para tipos de proceso (usar cuando el catálogo no esté disponible)
  const processTypeFallbackMap: Record<string, string> = useMemo(() => ({
    'WASHING': 'Proceso de Lavado',
    'DRYING': 'Proceso de Secado',
    'IRONING': 'Proceso de Planchado',
    'FOLDING': 'Proceso de Doblado',
    'IN_PROCESS': 'Recepción en Almacén',
    'PACKAGING': 'Proceso de Empaque',
    'SHIPPING': 'Proceso de Embarque',
    'LOADING': 'Proceso de Carga',
    'DELIVERY': 'Proceso de Entrega',
  }), []);
  
  // Obtener etiqueta del tipo de proceso (usar fallback por defecto, actualizar con catálogo si está disponible)
  const processTypeLabel = useMemo(() => {
    if (!processType) return 'Proceso';
  
    // Usar el mapa de fallback como valor por defecto (siempre funciona)
    const fallbackLabel = processTypeFallbackMap[processType] || processType;
    
    // Si el catálogo está cargado, intentar obtener la etiqueta del catálogo
    if (!isLoadingProcessTypeLabel) {
      const catalogLabel = getProcessTypeLabel(processType, fallbackLabel);
      // Si el catálogo devuelve una etiqueta válida (diferente del código y no vacía), usarla
      if (catalogLabel && catalogLabel !== processType && catalogLabel !== '' && catalogLabel !== '—') {
        return catalogLabel;
      }
    }
    
    // Usar el mapa de fallback
    return fallbackLabel;
  }, [processType, getProcessTypeLabel, isLoadingProcessTypeLabel, processTypeFallbackMap]);
  
  // Obtener prendas por códigos RFID escaneados para calcular el peso
  const scannedRfidCodes = useMemo(() => {
    return rfidScanUpdateData?.data?.scanned_rfid_codes || rfidScan?.scanned_rfid_codes || [];
  }, [rfidScanUpdateData, rfidScan]);
  
  const { data: garmentsData } = useGarmentsByRfidCodes(
    Array.isArray(scannedRfidCodes) ? scannedRfidCodes : [],
    visible && scannedRfidCodes.length > 0
  );
  
  // Calcular peso total desde las prendas escaneadas
  const calculatedWeight = useMemo(() => {
    if (!garmentsData?.data || !Array.isArray(garmentsData.data)) return 0;
    return garmentsData.data.reduce((total: number, garment: any) => {
      return total + (garment.weight || 0);
    }, 0);
  }, [garmentsData]);

  // Máquinas: mostrar todas las máquinas disponibles sin filtrar por tipo
  // Para SUPERADMIN, si branchOfficeId está vacío, no pasar el parámetro para obtener todas las máquinas
  const { data: machines, isLoading: isLoadingMachines } = useMachines(
    branchOfficeId && branchOfficeId.trim() !== '' ? branchOfficeId : undefined,
    undefined,
    true // Siempre habilitado, el hook manejará la validación internamente
  );

  // Estado del formulario
  // Siempre usar fecha/hora actual al abrir el formulario (tanto para crear como para editar)
  const nowFormatted = formatDateForInput(new Date());
  const [formData, setFormData] = useState({
    machine_code: initialProcess?.machine_code || '',
    start_time: nowFormatted, // Siempre usar fecha/hora actual
    end_time: nowFormatted, // Siempre usar fecha/hora actual
    load_weight: initialProcess?.load_weight !== undefined && initialProcess.load_weight !== null ? formatWeight(initialProcess.load_weight) : '',
    garment_quantity: toStringOrEmpty(initialProcess?.garment_quantity),
    special_treatment: initialProcess?.special_treatment || '',
    wash_temperature: initialProcess?.wash_temperature || '',
    detergent_type: initialProcess?.detergent_type || '',
    softener_used: initialProcess?.softener_used || false,
    bleach_used: initialProcess?.bleach_used || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [guideDetails, setGuideDetails] = useState<any | null>(null);
  const [isLoadingGuideDetails, setIsLoadingGuideDetails] = useState(false);

  // Estado para modales de fecha/hora
  const [datePickerState, setDatePickerState] = useState<{
    visible: boolean;
    mode: 'start' | 'end' | null;
  }>({ visible: false, mode: null });

  const [timePickerState, setTimePickerState] = useState<{
    visible: boolean;
    mode: 'start' | 'end' | null;
  }>({ visible: false, mode: null });

  // Indicadores de carga para los iconos de calendario
  const [isOpeningStartDate, setIsOpeningStartDate] = useState(false);
  const [isOpeningEndDate, setIsOpeningEndDate] = useState(false);
  const startDateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endDateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar fechas a fecha/hora actual cada vez que se abre el formulario (tanto para crear como para editar)
  useEffect(() => {
    if (visible) {
      const currentDateTime = formatDateForInput(new Date());
      setFormData(prev => ({
        ...prev,
        start_time: currentDateTime,
        end_time: currentDateTime,
      }));
    }
  }, [visible]);

  const applyDateToField = (mode: 'start' | 'end', day: number, month: number, year: number) => {
    const currentValue = mode === 'start' ? formData.start_time : formData.end_time;
    // Extraer hora/minuto actuales si existen
    let hours = 0;
    let minutes = 0;
    if (currentValue && currentValue.includes(' ')) {
      const timePart = currentValue.split(' ')[1];
      const [h, m] = timePart.split(':');
      hours = Number(h) || 0;
      minutes = Number(m) || 0;
    }
    const newDate = new Date(year, month - 1, day, hours, minutes);
    const formatted = formatDateForInput(newDate);
    setFormData(prev => ({
      ...prev,
      [mode === 'start' ? 'start_time' : 'end_time']: formatted,
    }));
  };

  const handleDatePickerConfirm = (day: number, month: number, year: number) => {
    if (!datePickerState.mode) return;
    applyDateToField(datePickerState.mode, day, month, year);
    setDatePickerState({ visible: false, mode: null });
  };

  const applyTimeToField = (mode: 'start' | 'end', time: string) => {
    const [hStr, mStr] = time.split(':');
    const hours = Number(hStr) || 0;
    const minutes = Number(mStr) || 0;

    const currentValue = mode === 'start' ? formData.start_time : formData.end_time;
    // Si no hay fecha aún, usar la fecha actual
    let baseDate: Date;
    if (currentValue && currentValue.includes(' ')) {
      const [datePart] = currentValue.split(' ');
      const [yearStr, monthStr, dayStr] = datePart.split('-');
      baseDate = new Date(
        Number(yearStr) || new Date().getFullYear(),
        (Number(monthStr) || 1) - 1,
        Number(dayStr) || new Date().getDate(),
      );
    } else {
      baseDate = new Date();
    }

    baseDate.setHours(hours, minutes, 0, 0);
    const formatted = formatDateForInput(baseDate);
    setFormData(prev => ({
      ...prev,
      [mode === 'start' ? 'start_time' : 'end_time']: formatted,
    }));
  };

  const renderBooleanToggle = (
    label: string,
    value: boolean,
    onChange: (nextValue: boolean) => void
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      <View className="flex-row bg-gray-100 rounded-xl p-1">
        {[
          { label: 'Sí', val: true },
          { label: 'No', val: false },
        ].map(option => {
          const isActive = value === option.val;
          const activeBg = option.val ? 'bg-purple-500' : 'bg-gray-200';
          const activeTextColor = option.val ? 'text-white' : 'text-gray-900';
          return (
            <TouchableOpacity
              key={option.label}
              activeOpacity={0.85}
              onPress={() => onChange(option.val)}
              className={`flex-1 py-2 rounded-lg items-center ${isActive ? `${activeBg} shadow-sm` : ''}`}
            >
              <Text className={`text-sm font-semibold ${isActive ? activeTextColor : 'text-gray-700'}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Opciones de catálogos
  const specialTreatmentOptions = useMemo(() => {
    const catalogOptions = (specialTreatmentCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));

    return catalogOptions.length > 0 ? catalogOptions : [
      { label: 'Ninguno', value: 'NONE' },
      { label: 'Remoción de manchas', value: 'STAIN_REMOVAL' },
      { label: 'Delicado', value: 'DELICATE' },
      { label: 'Uso pesado', value: 'HEAVY_DUTY' },
      { label: 'Desinfección', value: 'DISINFECTION' },
    ];
  }, [specialTreatmentCatalog]);

  useEffect(() => {
    if (!visible || !guideId) return;

    let isMounted = true;
    const fetchGuideDetails = async () => {
      try {
        setIsLoadingGuideDetails(true);
        const { data } = await guidesApi.get(`/get-guide/${guideId}`);
        if (isMounted) {
          setGuideDetails(data.data || null);
        }
      } catch (error: any) {
        if (__DEV__) {
          console.warn('No se pudo obtener detalles de la guía:', error?.message || error);
        }
        if (isMounted) {
          setGuideDetails(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGuideDetails(false);
        }
      }
    };

    fetchGuideDetails();

    return () => {
      isMounted = false;
    };
  }, [visible, guideId]);

  const washTemperatureOptions = useMemo(() => {
    const catalogOptions = (washTemperatureCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));

    return catalogOptions.length > 0 ? catalogOptions : [
      { label: 'Frío (20°C)', value: 'COLD' },
      { label: 'Tibio (40°C)', value: 'WARM' },
      { label: 'Caliente (60°C)', value: 'HOT' },
      { label: 'Muy Caliente (90°C)', value: 'VERY_HOT' },
    ];
  }, [washTemperatureCatalog]);

  useEffect(() => {
    if (!visible) return;

    if (sourceProcess) {
      setFormData({
        machine_code: sourceProcess.machine_code || '',
        start_time: formatDateForInput(sourceProcess.start_time),
        end_time:
          formatDateForInput(sourceProcess.end_time) ||
          formatDateForInput(sourceProcess.start_time),
        load_weight: sourceProcess.load_weight !== undefined && sourceProcess.load_weight !== null ? formatWeight(sourceProcess.load_weight) : '',
        garment_quantity: toStringOrEmpty(sourceProcess.garment_quantity),
        special_treatment: sourceProcess.special_treatment || '',
        wash_temperature: sourceProcess.wash_temperature || '',
        detergent_type: sourceProcess.detergent_type || '',
        softener_used: sourceProcess.softener_used ?? false,
        bleach_used: sourceProcess.bleach_used ?? false,
      });
    } else {
      const current = formatDateForInput(new Date());
      setFormData({
        machine_code: '',
        start_time: current,
        end_time: current,
        load_weight: '',
        garment_quantity: '',
        special_treatment: '',
        wash_temperature: '',
        detergent_type: '',
        softener_used: false,
        bleach_used: false,
      });
    }
  }, [sourceProcess, visible]);

  useEffect(() => {
    if (!visible) return;
    
    // Si hay un proceso existente, no actualizar desde el escaneo
    if (existingProcess || latestProcess) return;

    const quantityFromScan = rfidScanUpdateData?.data?.scanned_quantity ?? rfidScan?.scanned_quantity;
    const weightFromScan = rfidScanUpdateData?.data?.load_weight;

    // Determinar el peso a usar (priorizar el del escaneo, luego el calculado)
    let weightToSet = '';
    if (weightFromScan !== undefined) {
      weightToSet = formatWeight(weightFromScan);
    } else if (calculatedWeight > 0) {
      weightToSet = formatWeight(calculatedWeight);
    }

    setFormData(prev => ({
      ...prev,
      load_weight: prev.load_weight || weightToSet,
      garment_quantity:
        prev.garment_quantity ||
        (quantityFromScan !== undefined 
          ? String(quantityFromScan) 
          : scannedRfidCodes.length > 0 
          ? String(scannedRfidCodes.length) 
          : ''),
    }));
  }, [visible, existingProcess, latestProcess, rfidScan, rfidScanUpdateData, scannedRfidCodes, calculatedWeight]);

  // Actualizar peso cuando se calcula desde las prendas escaneadas (si aún no hay peso)
  useEffect(() => {
    if (!visible) return;
    
    // Si hay un proceso existente, no actualizar desde el escaneo
    if (existingProcess || latestProcess) return;
    
    // Si ya hay un peso (del escaneo o manual), no sobrescribir
    if (formData.load_weight) return;
    
    // Si se calculó el peso desde las prendas, actualizarlo
    if (calculatedWeight > 0) {
      setFormData(prev => ({
        ...prev,
        load_weight: formatWeight(calculatedWeight),
      }));
    }
  }, [visible, existingProcess, latestProcess, calculatedWeight, formData.load_weight]);

  // Filtrar máquinas activas (is_active y status_machine === 'ACTIVE')
  const availableMachines = useMemo(() => {
    if (!machines || !Array.isArray(machines)) return [];
    return machines.filter((m: Machine) => m.is_active && m.status_machine === 'ACTIVE');
  }, [machines]);

  // Obtener máquina seleccionada por código
  const selectedMachineByCode = useMemo(() => {
    if (!formData.machine_code && sourceProcess?.machine_code) {
      return availableMachines.find((m: Machine) => m.code === sourceProcess.machine_code) || null;
    }
    if (!formData.machine_code) return null;
    return availableMachines.find((m: Machine) => m.code === formData.machine_code) || null;
  }, [formData.machine_code, availableMachines, sourceProcess]);

  useEffect(() => {
    if (formData.machine_code && availableMachines.length > 0) {
      const machine = availableMachines.find((m: Machine) => m.code === formData.machine_code);
      setSelectedMachine(machine || null);
    } else if (!formData.machine_code) {
      setSelectedMachine(null);
    }
  }, [formData.machine_code, availableMachines]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const normalizedStart = normalizeDateInput(formData.start_time);
    if (!normalizedStart) {
      newErrors.start_time = 'La fecha de inicio es requerida (formato AAAA-MM-DD HH:mm)';
    }

    if (formData.end_time) {
      const normalizedEnd = normalizeDateInput(formData.end_time);
      if (!normalizedEnd) {
        newErrors.end_time = 'La fecha de fin debe tener el formato AAAA-MM-DD HH:mm';
      }
    }

    if (formData.load_weight) {
      const weight = safeParseFloat(formData.load_weight);
      if (weight !== undefined && weight < 0) {
        newErrors.load_weight = 'El peso debe ser mayor o igual a 0';
      }
    }

    if (formData.garment_quantity) {
      const quantity = safeParseInt(formData.garment_quantity);
      if (quantity !== undefined && quantity < 0) {
        newErrors.garment_quantity = 'La cantidad debe ser mayor o igual a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const startTimeIso = normalizeDateInput(formData.start_time);
      const endTimeIso = normalizeDateInput(formData.end_time);

      if (!startTimeIso) {
        throw new Error('La fecha de inicio no tiene un formato válido. Usa AAAA-MM-DD HH:mm');
      }

      const loadWeight = formData.load_weight ? safeParseFloat(formData.load_weight) : undefined;
      const garmentQty = formData.garment_quantity ? safeParseInt(formData.garment_quantity) : undefined;

      const baseProcessData = {
        guide_id: guideId,
        branch_offices_id: branchOfficeId,
        machine_code: formData.machine_code || undefined,
        start_time: startTimeIso,
        end_time: endTimeIso,
        load_weight: loadWeight,
        garment_quantity: garmentQty,
        special_treatment: formData.special_treatment || undefined,
        wash_temperature: formData.wash_temperature || undefined,
        detergent_type: formData.detergent_type || undefined,
        softener_used: formData.softener_used,
        bleach_used: formData.bleach_used,
        status: processType,
      };

      const processToUpdateId = existingProcess?.id || latestProcess?.id;

      if (processToUpdateId) {
        await updateWashingProcessAsync({ id: processToUpdateId, data: baseProcessData });
      } else {
        await createWashingProcessAsync(baseProcessData);
      }

      // Actualizar el RFID scan si hay datos pendientes
      // Esto se hace DESPUÉS de guardar el proceso para que solo se actualice si todo fue exitoso
      const rfidScanIdToUpdate = rfidScanUpdateData?.id || rfidScanId;
      if (rfidScanIdToUpdate) {
        try {
          let rfidScanDataToUpdate: any = null;
          
          // Si hay rfidScanUpdateData (viene del ScanForm), usar esos datos
          if (rfidScanUpdateData?.data) {
            rfidScanDataToUpdate = rfidScanUpdateData.data;
          }
          // Si hay pendingScanTypeUpdate (viene de "No escanear"), usar esos datos
          else if (pendingScanTypeUpdate && rfidScan) {
            rfidScanDataToUpdate = {
              guide_id: rfidScan.guide_id,
              branch_offices_id: rfidScan.branch_offices_id,
              scan_type: pendingScanTypeUpdate,
              scanned_quantity: rfidScan.scanned_quantity,
              scanned_rfid_codes: rfidScan.scanned_rfid_codes,
              unexpected_codes: rfidScan.unexpected_codes || [],
              differences_detected: rfidScan.differences_detected,
            };
          }
          
          if (rfidScanDataToUpdate) {
            await updateRfidScanAsync({
              id: rfidScanIdToUpdate,
              data: rfidScanDataToUpdate,
            });
          }
        } catch (rfidError: any) {
          // Si falla la actualización del RFID scan, mostrar error pero no revertir el proceso
          Alert.alert('Advertencia', 'El proceso se guardó correctamente, pero no se pudo actualizar el estado del escaneo RFID: ' + (rfidError.message || 'Error desconocido'));
        }
      }

      Alert.alert('Éxito', 'Proceso guardado correctamente');
      onSuccess();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(error?.response?.data?.errors)
        ? error.response.data.errors.join('\n')
        : undefined;
      Alert.alert('Error', backendMessage || detailedMessage || error.message || 'No se pudo guardar el proceso');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/40">
          <View className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl" style={{ elevation: 8 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  {processTypeLabel || 'Proceso'}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Complete los datos del proceso.
                </Text>
              </View>
              <TouchableOpacity
                onPress={onCancel}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="p-4">
                {isLoadingProcess || isLoadingGuideDetails ? (
                  <View className="py-12 items-center justify-center">
                    <ActivityIndicator size="large" color="#8EB021" />
                    <Text className="text-sm text-gray-500 mt-3">Cargando datos del proceso…</Text>
                  </View>
                ) : (
                  <>
          <View className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <View className="flex-row items-center">
              <Icon name="information-circle-outline" size={20} color="#7C3AED" />
              <Text className="text-sm font-semibold text-purple-800 ml-2">
                Estado asignado
              </Text>
            </View>
            <Text className="text-xs text-purple-700 mt-2">
              Al guardar, el proceso quedará en "{processTypeLabel}". Puedes ajustar la información antes de confirmar.
            </Text>
          </View>
 
          {/* Guía */}
          <View className="mb-4">
            <Input
              label="Guía"
              value={guideNumber}
              editable={false}
              className="bg-gray-50"
              icon="document-text-outline"
            />
          </View>

          {/* Sucursal */}
          <View className="mb-4">
            <Input
              label="Sucursal"
              value={branchOfficeName}
              editable={false}
              className="bg-gray-50"
              icon="business-outline"
            />
          </View>

          {/* Fecha y hora de inicio */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Fecha y hora de inicio *</Text>
            <View className="flex-row items-center border rounded-lg px-3 py-2 bg-white" style={{ borderColor: errors.start_time ? '#EF4444' : '#D1D5DB', minHeight: 44 }}>
              <TouchableOpacity
                onPress={() => {
                  if (isOpeningStartDate) return;
                  setIsOpeningStartDate(true);
                  startDateTimeoutRef.current = setTimeout(() => {
                    setDatePickerState({ visible: true, mode: 'start' });
                  }, 0.05);
                }}
                activeOpacity={0.8}
                className="mr-3 items-center justify-center"
                style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: '#DBEAFE' }}
              >
                {isOpeningStartDate ? (
                  <ActivityIndicator size="small" color="#1D4ED8" />
                ) : (
                  <Icon name="calendar-outline" size={20} color="#1D4ED8" />
                )}
              </TouchableOpacity>
              <TextInput
                value={formData.start_time}
                editable={false}
                placeholder="AAAA-MM-DD HH:mm"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-sm text-gray-900"
              />
            </View>

            {/* Hora de inicio como botón pequeño */}
            <View className="mt-1 flex-row items-center">
              <Text className="text-xs text-gray-500 mr-2">Hora inicio:</Text>
              <TouchableOpacity
                onPress={() => setTimePickerState({ visible: true, mode: 'start' })}
                className="flex-row items-center px-2 py-1 rounded-full bg-gray-50 border border-gray-200"
                activeOpacity={0.8}
              >
                <Icon name="time-outline" size={14} color="#1D4ED8" />
                <Text className="text-xs text-gray-800 ml-1">
                  {formData.start_time.split(' ')[1] || '--:--'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.start_time && (
              <Text className="text-xs mt-1" style={{ color: '#EF4444' }}>
                {errors.start_time}
              </Text>
            )}
          </View>

          {/* Fecha y hora de fin */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Fecha y hora de fin</Text>
            <View className="flex-row items-center border rounded-lg px-3 py-2 bg-white" style={{ borderColor: '#D1D5DB', minHeight: 44 }}>
              <TouchableOpacity
                onPress={() => {
                  if (isOpeningEndDate) return;
                  setIsOpeningEndDate(true);
                  endDateTimeoutRef.current = setTimeout(() => {
                    setDatePickerState({ visible: true, mode: 'end' });
                  }, 0.05);
                }}
                activeOpacity={0.8}
                className="mr-3 items-center justify-center"
                style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: '#DBEAFE' }}
              >
                {isOpeningEndDate ? (
                  <ActivityIndicator size="small" color="#1D4ED8" />
                ) : (
                  <Icon name="calendar-outline" size={20} color="#1D4ED8" />
                )}
              </TouchableOpacity>
              <TextInput
                value={formData.end_time}
                editable={false}
                placeholder="AAAA-MM-DD HH:mm"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-sm text-gray-900"
              />
            </View>

            {/* Hora de fin como botón pequeño */}
            <View className="mt-1 flex-row items-center">
              <Text className="text-xs text-gray-500 mr-2">Hora fin:</Text>
              <TouchableOpacity
                onPress={() => setTimePickerState({ visible: true, mode: 'end' })}
                className="flex-row items-center px-2 py-1 rounded-full bg-gray-50 border border-gray-200"
                activeOpacity={0.8}
              >
                <Icon name="time-outline" size={14} color="#1D4ED8" />
                <Text className="text-xs text-gray-800 ml-1">
                  {formData.end_time.split(' ')[1] || '--:--'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Máquina (opcional para todos los procesos) */}
            <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Máquina (Opcional)</Text>
              <TouchableOpacity
                onPress={() => setMachineModalOpen(true)}
                className="bg-purple-500 p-4 rounded-lg flex-row items-center justify-between"
                disabled={isLoadingMachines}
              >
                {selectedMachineByCode ? (
                  <>
                    <View className="flex-row items-center flex-1">
                      <Icon name="construct-outline" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2 text-base">
                        {selectedMachineByCode.code}
                      </Text>
                    </View>
                    <Icon name="create-outline" size={20} color="white" />
                  </>
                ) : (
                  <>
                    <View className="flex-row items-center flex-1">
                      <Icon name="construct-outline" size={20} color="white" />
                      <Text className="text-white font-medium ml-2">
                        Seleccionar Máquina
                      </Text>
                    </View>
                    <Icon name="qr-code-outline" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>

          {/* Peso de la carga */}
          <View className="mb-4">
            <Input
              label="Peso de la carga (lb)"
              value={formData.load_weight}
              onChangeText={(text) => setFormData(prev => ({ ...prev, load_weight: text }))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              icon="scale-outline"
              error={errors.load_weight}
            />
            {(rfidScanUpdateData?.data?.load_weight !== undefined || calculatedWeight > 0) && !sourceProcess && (
              <Text className="text-xs text-gray-500 mt-1">
                {calculatedWeight > 0 && !rfidScanUpdateData?.data?.load_weight ? 'Calculado desde el escaneo' : 'Capturado desde el escaneo'}
              </Text>
            )}
          </View>

          {/* Cantidad de prendas */}
          <View className="mb-4">
            <Input
              label="Cantidad de prendas"
              value={formData.garment_quantity}
              onChangeText={(text) => setFormData(prev => ({ ...prev, garment_quantity: text }))}
              placeholder="0"
              keyboardType="number-pad"
              icon="shirt-outline"
              error={errors.garment_quantity}
            />
            {rfidScanUpdateData?.data?.scanned_quantity !== undefined && !sourceProcess && (
              <Text className="text-xs text-gray-500 mt-1">
                Capturado desde el escaneo
              </Text>
            )}
          </View>

          {/* Campos específicos solo para Lavado */}
          {processType === 'WASHING' && (
            <>
              {/* Tratamiento especial */}
              <View className="mb-4">
                <Dropdown
                  label="Tratamiento especial"
                  options={specialTreatmentOptions}
                  value={formData.special_treatment}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, special_treatment: value }))}
                  placeholder="Seleccionar tratamiento"
                  icon="medical-outline"
                />
              </View>

              {/* Temperatura de lavado */}
              <View className="mb-4">
                <Dropdown
                  label="Temperatura de lavado"
                  options={washTemperatureOptions}
                  value={formData.wash_temperature}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, wash_temperature: value }))}
                  placeholder="Seleccionar temperatura"
                  icon="thermometer-outline"
                />
              </View>

              {/* Tipo de detergente */}
              <View className="mb-4">
                <Input
                  label="Tipo de detergente"
                  value={formData.detergent_type}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, detergent_type: text }))}
                  placeholder="Ej: Detergente industrial concentrado"
                  icon="flask-outline"
                />
              </View>

              {renderBooleanToggle('Suavizante usado', formData.softener_used, (value) =>
                setFormData(prev => ({ ...prev, softener_used: value }))
              )}

              {renderBooleanToggle('Blanqueador usado', formData.bleach_used, (value) =>
                setFormData(prev => ({ ...prev, bleach_used: value }))
              )}
            </>
          )}

          {/* Botones */}
          <View className="flex-row space-x-2 mb-4">
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onCancel}
              className="flex-1"
            />
            <Button
              title="Guardar"
              variant="primary"
              onPress={handleSubmit}
              isLoading={isCreating || isUpdating}
              className="flex-1"
            />
              </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Selección de Máquinas */}
      <MachineSelectionModal
        visible={machineModalOpen}
        onClose={() => setMachineModalOpen(false)}
        onSelectMachine={(machine) => {
          setSelectedMachine(machine);
          setFormData(prev => ({ ...prev, machine_code: machine.code }));
          setMachineModalOpen(false);
        }}
        machines={availableMachines}
      />

      {/* Modal de selección de fecha (inicio / fin) */}
      <DatePickerModal
        visible={datePickerState.visible}
        onClose={() => {
          setDatePickerState({ visible: false, mode: null });
          if (startDateTimeoutRef.current) {
            clearTimeout(startDateTimeoutRef.current);
            startDateTimeoutRef.current = null;
          }
          if (endDateTimeoutRef.current) {
            clearTimeout(endDateTimeoutRef.current);
            endDateTimeoutRef.current = null;
          }
          setIsOpeningStartDate(false);
          setIsOpeningEndDate(false);
        }}
        onConfirm={handleDatePickerConfirm}
        initialDate={
          datePickerState.mode === 'start'
            ? formData.start_time.split(' ')[0]?.replace(/-/g, '-') // AAAA-MM-DD
            : datePickerState.mode === 'end'
            ? formData.end_time.split(' ')[0]?.replace(/-/g, '-')
            : undefined
        }
      />

      {/* Modal de selección de hora (inicio / fin) */}
      <TimePickerModal
        visible={timePickerState.visible}
        onClose={() => setTimePickerState({ visible: false, mode: null })}
        initialTime={
          timePickerState.mode === 'start'
            ? formData.start_time.split(' ')[1]
            : timePickerState.mode === 'end'
            ? formData.end_time.split(' ')[1]
            : undefined
        }
        title={
          timePickerState.mode === 'start'
            ? 'Hora de inicio'
            : timePickerState.mode === 'end'
            ? 'Hora de fin'
            : 'Seleccionar hora'
        }
        onConfirm={(time) => {
          if (!timePickerState.mode) return;
          applyTimeToField(timePickerState.mode, time);
          setTimePickerState({ visible: false, mode: null });
        }}
      />
    </Modal>
  );
};

