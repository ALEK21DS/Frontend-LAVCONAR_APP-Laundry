import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Card, Dropdown, Input } from '@/components/common';
import { GuideItem } from '@/laundry/interfaces/guides/guides.interface';
import { useAuthStore } from '@/auth/store/auth.store';
import { SUCURSALES } from '@/constants';
import { GUIDE_STATUS, GUIDE_STATUS_LABELS, SERVICE_PRIORITIES, WASHING_TYPES } from '@/constants/processes';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { ClientForm } from '@/laundry/pages/clients/ui/ClientForm';
import { useCreateClient } from '@/laundry/hooks/clients';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useGuideGarmentsByGuide } from '@/laundry/hooks/guides/guide-garments';
import { useGetRfidScanByGuide } from '@/laundry/hooks/guides/rfid-scan';
// Detalle de guía eliminado del flujo
import { isValidDate, sanitizeNumericInput, isNonNegative, safeParseInt, safeParseFloat } from '@/helpers/validators.helper';
import { useVehicles } from '@/laundry/hooks/vehicles';
import { VehicleSelectionModal } from '@/laundry/components';
import { isSuperAdminUser } from '@/helpers/user.helper';

type Option = { label: string; value: string; serviceType?: string; acronym?: string };

interface GuideFormProps {
  clientOptions: Option[];
  selectedClientId?: string;
  onChangeClient: (id: string) => void;
  guideItems: GuideItem[];
  onRemoveItem: (epc: string) => void;
  onScan: () => void;
  onSubmit: (result: { guideData: any; guide?: any; draftValues: any }) => void;
  onCancel?: () => void;
  submitting?: boolean;
  showScanButton?: boolean;
  isScanning?: boolean;
  onNavigate?: (route: string, params?: any) => void;
  // Valores iniciales opcionales
  initialServiceType?: string;
  initialTotalWeight?: number;
  unregisteredCount?: number;
  // Datos de la guía para modo edición
  guideToEdit?: any;
  draftValues?: any;
}

export const GuideForm: React.FC<GuideFormProps> = ({
  clientOptions,
  selectedClientId,
  onChangeClient,
  guideItems,
  onRemoveItem,
  onScan,
  onSubmit,
  onCancel,
  submitting,
  showScanButton = true,
  isScanning = false,
  onNavigate,
  initialServiceType = '',
  initialTotalWeight = 0,
  unregisteredCount = 0,
  guideToEdit,
  draftValues,
}) => {
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();

  // Obtener la sucursal del usuario logueado
  const branchOfficeId = user?.branch_office_id || (user as any)?.sucursalId;

  // Buscar el nombre de la sucursal en la lista de sucursales
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';
  const isSuperAdmin = isSuperAdminUser(user);

  // Estado local para campos del servicio y fechas
  const resolvedInitialServiceType = initialServiceType || 'INDUSTRIAL';
  const [serviceType, setServiceType] = useState<string>(draftValues?.serviceType || resolvedInitialServiceType);
  const [condition, setCondition] = useState<string>(draftValues?.condition || 'REGULAR');
  const [personalEmployee, setPersonalEmployee] = useState<string>(draftValues?.personalEmployee || '');
  const [transportEmployee, setTransportEmployee] = useState<string>(draftValues?.transportEmployee || '');
  const [packageManager, setPackageManager] = useState<string>(draftValues?.packageManager || '');
  const [departureTime, setDepartureTime] = useState<string>(draftValues?.departureTime || '');
  const [arrivalTime, setArrivalTime] = useState<string>(draftValues?.arrivalTime || '');
  const [sealNumber1, setSealNumber1] = useState<string>(draftValues?.sealNumber1 || '');
  const [sealNumber2, setSealNumber2] = useState<string>(draftValues?.sealNumber2 || '');
  const [shift, setShift] = useState<string>(draftValues?.shift || guideToEdit?.shift || '');
  // Formatear fecha actual a dd/mm/yyyy
  const formatDateToDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [collectionDate, setCollectionDate] = useState<string>(draftValues?.collectionDate || formatDateToDisplay(new Date()));
  const [deliveryDate, setDeliveryDate] = useState<string>(draftValues?.deliveryDate || formatDateToDisplay(new Date()));
  const [totalWeight, setTotalWeight] = useState<string>(
    draftValues?.totalWeight ?? (initialTotalWeight > 0 ? initialTotalWeight.toFixed(2) : '')
  );
  const [missingGarments, setMissingGarments] = useState<string>(
    draftValues?.missingGarments ??
    (guideToEdit?.missing_garments !== undefined && guideToEdit?.missing_garments !== null
      ? String(guideToEdit.missing_garments)
      : '')
  );
  // Estado inicial: COLLECTED para ambos tipos de servicio (PERSONAL e INDUSTRIAL)
  const getInitialStatus = () => {
    return GUIDE_STATUS.COLLECTED;
  };
  const [status, setStatus] = useState<string>(draftValues?.status || getInitialStatus());
  // Catálogos dinámicos (frescos) para condiciones, estados y tipos de servicio
  const { data: generalConditionCatalog } = useCatalogValuesByType('general_condition', true, { forceFresh: true });
  const { data: guideStatusCatalog } = useCatalogValuesByType('guide_status', true, { forceFresh: true });
  const { data: serviceTypeCatalog } = useCatalogValuesByType('service_type', true, { forceFresh: true });
  const { data: servicePriorityCatalog } = useCatalogValuesByType('service_priority', true, { forceFresh: true });
  const { data: washingTypeCatalog } = useCatalogValuesByType('washing_type', true, { forceFresh: true });
  const { data: shiftCatalog } = useCatalogValuesByType('shift', true, { forceFresh: true });
  const { data: requestedServicesCatalog } = useCatalogValuesByType('requested_services', true, { forceFresh: true });

  const GENERAL_CONDITION_OPTIONS = useMemo(() => {
    return (generalConditionCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [generalConditionCatalog]);

  const SERVICE_TYPE_OPTIONS = useMemo(() => {
    return (serviceTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [serviceTypeCatalog]);

  const statusLabelFromCatalog = useMemo(() => {
    const found = (guideStatusCatalog?.data || []).find(v => v.code === status);
    return found?.label || (GUIDE_STATUS_LABELS[status as keyof typeof GUIDE_STATUS_LABELS] || 'Recibida');
  }, [guideStatusCatalog, status]);

  const SERVICE_PRIORITY_OPTIONS_DYNAMIC = useMemo(() => {
    return (servicePriorityCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [servicePriorityCatalog]);

  const WASHING_TYPE_OPTIONS_DYNAMIC = useMemo(() => {
    return (washingTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [washingTypeCatalog]);

  const SHIFT_OPTIONS = useMemo(() => {
    return (shiftCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [shiftCatalog]);

  const selectedClientOption = useMemo(() => {
    if (!selectedClientId) return undefined;
    return clientOptions.find(option => option.value === selectedClientId);
  }, [clientOptions, selectedClientId]);

  const selectedClientServiceLabel = useMemo(() => {
    const type = (selectedClientOption?.serviceType || serviceType || '').toUpperCase();
    if (!type) return null;
    return type === 'INDUSTRIAL' ? 'Servicio Industrial' : 'Servicio Personal';
  }, [selectedClientOption?.serviceType, serviceType]);

  const REQUESTED_SERVICES_OPTIONS = useMemo(() => {
    return (requestedServicesCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [requestedServicesCatalog]);
  const [notes, setNotes] = useState<string>(draftValues?.notes || '');
  const [supplierGuideNumber, setSupplierGuideNumber] = useState<string>(draftValues?.supplierGuideNumber || '');
  const [requestedServices, setRequestedServices] = useState<string[]>(draftValues?.requestedServices || []);
  const [showRequestedServices, setShowRequestedServices] = useState<boolean>(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  // Detalle de guía eliminado del flujo

  // Nuevos campos basados en las imágenes y schema
  const [servicePriority, setServicePriority] = useState<string>(draftValues?.servicePriority || 'NORMAL');
  const [washingType, setWashingType] = useState<string>(draftValues?.washingType || '');

  // Personal involucrado
  const [deliveredBy, setDeliveredBy] = useState<string>(draftValues?.deliveredBy || '');
  // Campos adicionales de transporte removidos del UI actual

  // Gestión de paquetes
  const [totalBundlesReceived, setTotalBundlesReceived] = useState<string>(draftValues?.totalBundlesReceived || '');
  // Discrepancia/esperados removidos del UI actual
  const [vehiclePlate, setVehiclePlate] = useState<string>(draftValues?.vehiclePlate || '');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleUnitNumber, setVehicleUnitNumber] = useState<string>(
    draftValues?.vehicleUnitNumber || guideToEdit?.vehicle_unit_number || ''
  );
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const { createClientAsync, isCreating } = useCreateClient();

  // Obtener lista de vehículos (solo para servicio industrial)
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles({
    limit: 50,
    enabled: serviceType === 'INDUSTRIAL'
  });

  // Obtener detalles de las prendas de la guía en modo edición (para mostrar info)
  const { data: guideGarmentsData, isLoading: isLoadingGarments } = useGuideGarmentsByGuide(
    guideToEdit?.id || '',
    !!guideToEdit?.id
  );

  // Obtener los RFIDs escaneados de la guía en modo edición
  const { rfidScan } = useGetRfidScanByGuide(
    guideToEdit?.id || '',
    !!guideToEdit?.id
  );

  // El backend puede devolver un objeto único o un array de garments, normalizarlo a array
  const existingGarments = useMemo(() => {
    if (!guideGarmentsData?.data) return [];
    return Array.isArray(guideGarmentsData.data)
      ? guideGarmentsData.data
      : [guideGarmentsData.data];
  }, [guideGarmentsData]);

  // Extraer los RFIDs escaneados del rfid_scan
  const existingRfids = useMemo(() => {
    if (!rfidScan) return [];
    return rfidScan.scanned_rfid_codes || [];
  }, [rfidScan]);

  // En modo edición, usar el número de RFIDs existentes; en creación, usar guideItems
  const totalGarments = useMemo(() => {
    return guideToEdit ? existingRfids.length : guideItems.length;
  }, [guideToEdit, existingRfids.length, guideItems.length]);

  // Cargar borrador cuando no estamos en modo edición
  useEffect(() => {
    if (!guideToEdit && draftValues) {
      if (draftValues.serviceType) setServiceType(draftValues.serviceType);
      if (draftValues.condition) setCondition(draftValues.condition);
      if (draftValues.collectionDate) setCollectionDate(draftValues.collectionDate);
      if (draftValues.deliveryDate) setDeliveryDate(draftValues.deliveryDate);
      if (draftValues.totalWeight !== undefined) setTotalWeight(draftValues.totalWeight);
      if (draftValues.status) setStatus(draftValues.status);
      if (draftValues.notes !== undefined) setNotes(draftValues.notes);
      if (draftValues.servicePriority) setServicePriority(draftValues.servicePriority);
      if (draftValues.washingType) setWashingType(draftValues.washingType);
      if (draftValues.deliveredBy) setDeliveredBy(draftValues.deliveredBy);
      if (draftValues.personalEmployee) setPersonalEmployee(draftValues.personalEmployee);
      if (draftValues.transportEmployee) setTransportEmployee(draftValues.transportEmployee);
      if (draftValues.packageManager) setPackageManager(draftValues.packageManager);
      if (draftValues.departureTime) setDepartureTime(draftValues.departureTime);
      if (draftValues.arrivalTime) setArrivalTime(draftValues.arrivalTime);
      if (draftValues.totalBundlesReceived !== undefined) setTotalBundlesReceived(draftValues.totalBundlesReceived);
      if (draftValues.vehiclePlate) setVehiclePlate(draftValues.vehiclePlate);
      if (Array.isArray(draftValues.requestedServices)) setRequestedServices(draftValues.requestedServices);
      if (draftValues.supplierGuideNumber !== undefined) setSupplierGuideNumber(draftValues.supplierGuideNumber);
      if (draftValues.sealNumber1 !== undefined) setSealNumber1(draftValues.sealNumber1);
      if (draftValues.sealNumber2 !== undefined) setSealNumber2(draftValues.sealNumber2);
      if (draftValues.shift) setShift(draftValues.shift);
      if (draftValues.missingGarments !== undefined) setMissingGarments(String(draftValues.missingGarments));
      if (draftValues.vehicleUnitNumber) setVehicleUnitNumber(draftValues.vehicleUnitNumber);
    }
  }, [draftValues, guideToEdit]);

  // Cargar datos de la guía en modo edición
  useEffect(() => {
    if (guideToEdit) {

      // Convertir fecha ISO a formato dd/mm/yyyy
      const formatISOToDisplay = (isoDate: string): string => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      setServiceType(guideToEdit.service_type || '');
      // charge_type no aplica a guides
      setCondition(guideToEdit.general_condition || 'REGULAR');
      setCollectionDate(formatISOToDisplay(guideToEdit.collection_date));
      setDeliveryDate(formatISOToDisplay(guideToEdit.delivery_date));
      setTotalWeight(guideToEdit.total_weight ? parseFloat(guideToEdit.total_weight).toFixed(2) : '');
      setStatus(guideToEdit.status || '');
      setNotes(guideToEdit.notes || '');
      // Cargar los dos números de precinto por separado
      setSealNumber1(guideToEdit.precinct_number || '');
      setSealNumber2(guideToEdit.precinct_number_2 || '');
      setServicePriority(guideToEdit.service_priority || 'NORMAL');
      setWashingType(guideToEdit.washing_type || '');
      setDeliveredBy(guideToEdit.delivered_by || '');
      setVehiclePlate(guideToEdit.vehicle_plate || '');
      setTotalBundlesReceived(guideToEdit.total_bundles_received?.toString() || '');
      setDepartureTime(guideToEdit.departure_time || '');
      setArrivalTime(guideToEdit.arrival_time || '');
      // Cargar servicios solicitados si existen
      if (guideToEdit.requested_services && Array.isArray(guideToEdit.requested_services)) {
        setRequestedServices(guideToEdit.requested_services);
      }
      setShift(guideToEdit.shift || '');
      if (guideToEdit.missing_garments !== undefined && guideToEdit.missing_garments !== null) {
        setMissingGarments(String(guideToEdit.missing_garments));
      }
      setVehicleUnitNumber(guideToEdit.vehicle_unit_number || '');
    }
  }, [guideToEdit]);

  // Función para formatear fecha mientras se escribe (dd/mm/yyyy)
  const formatDateInput = (text: string): string => {
    // Remover todo lo que no sea número
    const numbers = text.replace(/\D/g, '');

    // Limitar a 8 dígitos (ddmmyyyy)
    const limited = numbers.slice(0, 8);

    // Agregar slashes automáticamente
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  // Función para convertir dd/mm/yyyy a Date para validación
  const parseDateFromDisplay = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length < 10) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Función para formatear peso con máximo 2 decimales
  const formatWeightInput = (text: string): string => {
    // Permitir solo números y un punto decimal
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Si hay más de un punto, quedarse solo con el primero
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join('')}`;
    }

    // Limitar a 2 decimales
    if (parts.length === 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }

    return cleaned;
  };

  // Función para convertir dd/mm/yyyy a ISO string para el backend
  // Usa la hora actual para la fecha de recolección
  const formatDateToISO = (dateStr: string, useCurrentTime: boolean = true): string => {
    const dateObj = parseDateFromDisplay(dateStr);
    if (!dateObj) return '';

    if (useCurrentTime) {
      // Usar la hora actual para la fecha
      const now = new Date();
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }

    return dateObj.toISOString();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Advertencia para servicio industrial con prendas no registradas */}
        {unregisteredCount > 0 && (
          <View className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-start">
              <Icon name="warning-outline" size={20} color="#F97316" />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-orange-900">
                  {unregisteredCount} {unregisteredCount === 1 ? 'código no registrado' : 'códigos no registrados'}
                </Text>
                <Text className="text-xs text-orange-700 mt-1">
                  Registre las prendas o coloque el peso manualmente
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Cliente primero */}
        <View className="mb-4">
          <Dropdown
            label="Cliente *"
            placeholder="Selecciona un cliente"
            options={clientOptions}
            value={selectedClientId || ''}
            onValueChange={onChangeClient}
            icon="person-outline"
            searchable
          />
          {selectedClientOption && selectedClientServiceLabel && (
            <View className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 flex-row items-center">
              <Icon name="information-circle-outline" size={16} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-2">
                Cliente de {selectedClientServiceLabel.toLowerCase()}
              </Text>
            </View>
          )}
          <View className="mt-2">
            <Button
              title="Registrar Nuevo Cliente"
              variant="outline"
              size="sm"
              onPress={() => setClientModalOpen(true)}
            />
          </View>
        </View>

        {/* Información Básica */}
        <View className="mb-4">
          <Text className="text-base text-gray-700 font-semibold mb-2">Información Básica</Text>
          {serviceType === 'INDUSTRIAL' && (
            <>
              <Input
                label="Número de Guía del Proveedor"
                placeholder="Ej: 123-0001-0002"
                value={supplierGuideNumber}
                onChangeText={setSupplierGuideNumber}
              />
              <View className="mt-3">
                <Dropdown
                  label="Turno"
                  placeholder="Selecciona un turno"
                  options={SHIFT_OPTIONS}
                  value={shift}
                  onValueChange={setShift}
                  icon="time-outline"
                />
              </View>
            </>
          )}
          <Input label="Sucursal" value={branchOfficeName} editable={false} className="mt-1" />
          <View className="flex-row mt-1 -mx-1">
            <View className="flex-1 px-1">
              <Input
                label="Fecha Recolección *"
                placeholder="dd/mm/aaaa"
                value={collectionDate}
                onChangeText={(text) => setCollectionDate(formatDateInput(text))}
                keyboardType="numeric"
                maxLength={10}
                editable={isSuperAdmin}
                className={isSuperAdmin ? undefined : "bg-gray-50"}
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Fecha Entrega"
                placeholder="dd/mm/aaaa"
                value={deliveryDate}
                onChangeText={(text) => setDeliveryDate(formatDateInput(text))}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
        </View>



        <View className="mb-4">
          <Text className="text-base text-gray-700 font-semibold mb-2">Información del Servicio</Text>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Tipo de Servicio</Text>
            <View className="px-3 py-2 rounded-lg bg-gray-100 flex-row items-center">
              <Icon name="cog-outline" size={16} color="#4B5563" />
              <Text className="text-sm text-gray-800 ml-2">
                {serviceType === 'PERSONAL' ? 'Servicio Personal' : 'Servicio Industrial'}
              </Text>
            </View>
          </View>

          {/* Servicios Solicitados - Solo para servicio personal */}
          {serviceType === 'PERSONAL' && (
            <View className="mt-2">
              <Text className="text-sm font-medium text-gray-700 mb-2">Servicios Solicitados</Text>
              <TouchableOpacity
                className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-3"
                onPress={() => setShowRequestedServices(prev => !prev)}
              >
                <Text className="text-gray-800">
                  {requestedServices.length > 0 ? requestedServices.join(', ') : 'Seleccionar servicios'}
                </Text>
              </TouchableOpacity>
              {showRequestedServices && (
                <View className="mt-2 bg-white border border-gray-200 rounded-lg p-3">
                  {REQUESTED_SERVICES_OPTIONS.length > 0 ? (
                    REQUESTED_SERVICES_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        className="flex-row items-center py-2"
                        onPress={() => {
                          setRequestedServices(prev => prev.includes(opt.value)
                            ? prev.filter(v => v !== opt.value)
                            : [...prev, opt.value]);
                        }}
                      >
                        <View className={`w-5 h-5 mr-3 rounded border ${requestedServices.includes(opt.value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                        <Text className="text-gray-800">{opt.label}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    // Fallback si el catálogo no está disponible
                    [
                      { label: 'Lavado', value: 'WASH' },
                      { label: 'Secado', value: 'DRY' },
                      { label: 'Planchado', value: 'IRON' },
                      { label: 'Limpieza en Seco', value: 'DRY_CLEAN' },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        className="flex-row items-center py-2"
                        onPress={() => {
                          setRequestedServices(prev => prev.includes(opt.value)
                            ? prev.filter(v => v !== opt.value)
                            : [...prev, opt.value]);
                        }}
                      >
                        <View className={`w-5 h-5 mr-3 rounded border ${requestedServices.includes(opt.value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                        <Text className="text-gray-800">{opt.label}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          )}

          <View className="mt-2">
            <Dropdown
              label="Condición General"
              placeholder="Selecciona la condición"
              options={GENERAL_CONDITION_OPTIONS}
              value={condition}
              onValueChange={setCondition}
              icon="checkmark-circle-outline"
            />
          </View>

          <View className="flex-row -mx-1 mt-2">
            <View className="flex-1 px-1">
              <Input label="Total Prendas" value={String(totalGarments)} editable={false} />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Peso Total (lb)"
                placeholder="0.00"
                value={totalWeight}
                onChangeText={(text) => setTotalWeight(formatWeightInput(text))}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View className="mt-2">
            <Input
              label="Prendas Faltantes"
              placeholder="0"
              value={missingGarments}
              onChangeText={(text) => setMissingGarments(sanitizeNumericInput(text))}
              keyboardType="numeric"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Prendas sin código RFID para escanear.
            </Text>
          </View>
          <View className="mt-2">
            <Input
              label="Estado"
              value={statusLabelFromCatalog}
              editable={false}
              className="bg-gray-50"
            />
          </View>
        </View>

        {showScanButton && (
          <View className="mb-4">
            <Button
              title={guideToEdit ? 'Editar Prendas' : (isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo')}
              onPress={() => {
                // Si estamos en modo edición, SIEMPRE navegar a la página de escaneo
                if (guideToEdit && onNavigate) {
                  onNavigate('ScanClothes', {
                    mode: 'guide',
                    serviceType: serviceType === 'PERSONAL' ? 'personal' : 'industrial',
                    guideId: guideToEdit.id,
                    initialRfids: existingRfids, // Usar los RFIDs del rfid_scan
                    guideToEdit, // pasar toda la guía para prefills de edición
                    isEditMode: true,
                  });
                } else {
                  // Comportamiento normal de escaneo para creación de guía
                  onScan();
                }
              }}
              icon={<Icon name={guideToEdit ? 'create-outline' : (isScanning ? 'stop-circle-outline' : 'scan-outline')} size={18} color="white" />}
              fullWidth
              size="sm"
              disabled={!selectedClientId}
              style={{ backgroundColor: '#0b1f36' }}
            />
            {!selectedClientId && !guideToEdit && (
              <Text className="text-sm text-gray-500 mt-2 text-center">Selecciona un cliente para continuar</Text>
            )}
          </View>
        )}

        {/* Prendas Registradas en la Guía (Modo Edición) */}
        {guideToEdit && (
          <View className="mb-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <View className="flex-row items-center mb-3">
              <Icon name="shirt-outline" size={20} color="#F59E0B" />
              <Text className="text-base text-amber-800 font-semibold ml-2">
                Códigos RFID Escaneados ({existingRfids.length})
              </Text>
            </View>

            {existingRfids.length === 0 ? (
              <View className="items-center py-3">
                <Icon name="information-circle-outline" size={40} color="#F59E0B" />
                <Text className="text-amber-800 font-medium mt-2 text-center text-sm">
                  No hay códigos RFID
                </Text>
                <Text className="text-amber-700 text-xs mt-1 text-center px-2">
                  Presiona "Editar Prendas" para escanear
                </Text>
              </View>
            ) : (

              <ScrollView className="max-h-40">
                {existingRfids.map((rfid: string, index: number) => (
                  <View
                    key={rfid}
                    className="bg-white rounded-lg p-3 mb-2 flex-row items-center justify-between border border-amber-300"
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-mono text-gray-900">
                        {rfid}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        Código RFID #{index + 1}
                      </Text>
                    </View>
                    <View className="bg-green-500 w-8 h-8 rounded-full items-center justify-center">
                      <Icon name="checkmark" size={20} color="#FFFFFF" />
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text className="text-xs text-amber-700 mt-3">
              💡 Puedes escanear más prendas para agregarlas a esta guía
            </Text>
          </View>
        )}

        {/* Detalles de Servicio (solo servicio personal) */}
        {serviceType === 'PERSONAL' && (
          <View className="mb-6 bg-blue-50 p-4 rounded-lg">
            <Text className="text-base text-blue-800 font-semibold mb-3">Detalles de Servicio</Text>
            <Dropdown
              label="Prioridad"
              placeholder="Seleccionar prioridad"
              options={SERVICE_PRIORITY_OPTIONS_DYNAMIC.length > 0 ? SERVICE_PRIORITY_OPTIONS_DYNAMIC : SERVICE_PRIORITIES}
              value={servicePriority}
              onValueChange={setServicePriority}
              icon="flag-outline"
            />
          </View>
        )}

        {/* Campos para Servicio Industrial - Personal de Transporte */}
        {serviceType === 'INDUSTRIAL' && (
          <View className="mb-4 bg-green-50 p-4 rounded-lg">
            <Text className="text-base text-green-800 font-semibold mb-3">Personal de Transporte (Servicio Industrial)</Text>
            <Input
              label="Entregado por"
              placeholder="Nombre del transportista"
              value={deliveredBy}
              onChangeText={setDeliveredBy}
            />
          </View>
        )}

        {/* Campos para Servicio Industrial - Gestión de Paquetes */}
        {serviceType === 'INDUSTRIAL' && (
          <View className="mb-4 bg-purple-50 p-4 rounded-lg">
            <Text className="text-base text-purple-800 font-semibold mb-3">Gestión de Paquetes (Servicio Industrial)</Text>
            <View className="flex-row -mx-1 mb-3">
              <View className="flex-1 px-1">
                <Input
                  label="Bultos Recibidos"
                  placeholder="0"
                  value={totalBundlesReceived}
                  onChangeText={(text) => setTotalBundlesReceived(sanitizeNumericInput(text))}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View className="flex-row -mx-1 mb-3">
              <View className="flex-1 px-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Placa del Vehículo</Text>
                <TouchableOpacity
                  onPress={() => setVehicleModalOpen(true)}
                  className="bg-purple-500 p-4 rounded-lg flex-row items-center justify-between"
                >
                  {vehiclePlate ? (
                    <>
                      <View className="flex-row items-center flex-1">
                        <Icon name="car-outline" size={20} color="white" />
                        <View className="ml-2">
                          <Text className="text-white font-semibold text-base">
                            {vehicleUnitNumber || vehiclePlate}
                          </Text>
                          <Text className="text-white/80 text-xs mt-0.5">
                            Placa: {vehiclePlate}
                            {selectedVehicle?.brand ? ` • ${selectedVehicle.brand} ${selectedVehicle.model}` : ''}
                          </Text>
                        </View>
                      </View>
                      <Icon name="create-outline" size={20} color="white" />
                    </>
                  ) : (
                    <>
                      <View className="flex-row items-center flex-1">
                        <Icon name="car-outline" size={20} color="white" />
                        <Text className="text-white font-medium ml-2">
                          Seleccionar Vehículo
                        </Text>
                      </View>
                      <Icon name="qr-code-outline" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Contenedor de tiempos de transporte removido por requerimiento */}

        {/* Campos para Servicio Personal - Personal de Atención */}
        {serviceType === 'PERSONAL' && (
          <View className="mb-4">
            <Card padding="md" className="bg-green-50 border-green-200">
              <Text className="text-base text-green-800 font-semibold mb-3">Personal de Atención (Servicio Personal)</Text>
              <Input
                label="Entregado por"
                placeholder="Empleado que entrega al cliente"
                value={personalEmployee}
                onChangeText={setPersonalEmployee}
                icon="person-outline"
              />
            </Card>
          </View>
        )}



        {/* Secciones de servicio antiguo removidas para que los nuevos campos 
          dependientes del dropdown se muestren debajo de Detalles de Servicio */}

        {serviceType === 'INDUSTRIAL' && (
          <View className="mt-4">
            <Text className="text-base text-gray-700 font-semibold mb-2">Números de Precinto (Opcional)</Text>
            <View className="flex-row -mx-1">
              <View className="flex-1 px-1">
                <Input
                  label="Número de Precinto 1"
                  placeholder="Ej: 123-0001-0002"
                  value={sealNumber1}
                  onChangeText={setSealNumber1}
                />
              </View>
              <View className="flex-1 px-1">
                <Input
                  label="Número de Precinto 2"
                  placeholder="Ej: 123-0001-0003"
                  value={sealNumber2}
                  onChangeText={setSealNumber2}
                />
              </View>
            </View>
          </View>
        )}

        <Input
          label="Notas"
          placeholder="Notas adicionales sobre la guía..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View className="h-3" />
        <Button
          title={guideToEdit ? 'Editar Guía' : 'Crear Guía'}
          onPress={async () => {
            // Validar campos obligatorios según el esquema de Prisma
            if (!guideToEdit) {
              if (!selectedClientId) {
                Alert.alert('Error', 'Debe seleccionar un cliente');
                return;
              }
            }
            if (!branchOfficeId) {
              Alert.alert('Error', 'No se ha asignado una sucursal al usuario');
              return;
            }
            if (!serviceType) {
              Alert.alert('Error', 'Debe seleccionar un tipo de servicio');
              return;
            }
            // charge_type no aplica a guides en Prisma
            if (!collectionDate) {
              Alert.alert('Error', 'Debe ingresar la fecha de recolección');
              return;
            }

            // Validar que la fecha de recolección sea válida
            if (!isValidDate(collectionDate)) {
              Alert.alert('Error', 'La fecha de recolección no es válida. Use formato dd/mm/aaaa');
              return;
            }

            // Validar fecha de entrega si existe
            if (deliveryDate) {
              if (!isValidDate(deliveryDate)) {
                Alert.alert('Error', 'La fecha de entrega no es válida. Use formato dd/mm/aaaa');
                return;
              }

              const deliveryDateObj = parseDateFromDisplay(deliveryDate);
              const collectionDateObj = parseDateFromDisplay(collectionDate);

              if (deliveryDateObj && collectionDateObj && deliveryDateObj < collectionDateObj) {
                Alert.alert('Error', 'La fecha de entrega no puede ser anterior a la fecha de recolección');
                return;
              }
            }
            if (!guideToEdit) {
              if (guideItems.length === 0) {
                Alert.alert('Error', 'Debe escanear al menos una prenda');
                return;
              }
            }

            // Normalizar campos numéricos antes de validar
            const totalBundlesReceivedClean = sanitizeNumericInput(totalBundlesReceived);
            if (totalBundlesReceived !== totalBundlesReceivedClean) setTotalBundlesReceived(totalBundlesReceivedClean);
            const missingGarmentsClean = sanitizeNumericInput(missingGarments);
            if (missingGarments !== missingGarmentsClean) setMissingGarments(missingGarmentsClean);

            // Validar peso si existe
            if (totalWeight && !isNonNegative(totalWeight)) {
              Alert.alert('Error', 'El peso total debe ser un número válido mayor o igual a 0');
              return;
            }

            // Validar campos numéricos opcionales
            if (totalBundlesReceivedClean && !isNonNegative(totalBundlesReceivedClean)) {
              Alert.alert('Error', 'Los bultos recibidos deben ser un número válido mayor o igual a 0');
              return;
            }
            if (missingGarmentsClean && !isNonNegative(missingGarmentsClean)) {
              Alert.alert('Error', 'Las prendas faltantes deben ser un número válido mayor o igual a 0');
              return;
            }

            // Construir payload y crear guía directamente
            const guideData = {
              client_id: selectedClientId,
              branch_office_id: branchOfficeId || undefined,
              service_type: serviceType as any,
              supplier_guide_number: serviceType === 'INDUSTRIAL' ? (supplierGuideNumber || undefined) : undefined,
              collection_date: formatDateToISO(collectionDate, true),
              delivery_date: deliveryDate ? formatDateToISO(deliveryDate, true) : undefined,
              general_condition: condition as any,
              status: status as any,
              total_weight: safeParseFloat(totalWeight),
              total_garments: totalGarments,
              missing_garments: missingGarmentsClean ? safeParseInt(missingGarmentsClean) : undefined,
              notes: notes || undefined,
              requested_services: requestedServices.length > 0 ? requestedServices : undefined,
              service_priority: servicePriority || undefined,
              washing_type: washingType || undefined,
              total_bundles_received: safeParseInt(totalBundlesReceivedClean),
              delivered_by: serviceType === 'INDUSTRIAL' ? (deliveredBy || undefined) : (personalEmployee || undefined),
              vehicle_plate: vehiclePlate || undefined,
              shift: serviceType === 'INDUSTRIAL' ? (shift || undefined) : undefined,
              // Enviar los dos números de precinto por separado
              precinct_number: serviceType === 'INDUSTRIAL' ? (sealNumber1 || undefined) : undefined,
              precinct_number_2: serviceType === 'INDUSTRIAL' ? (sealNumber2 || undefined) : undefined,
            } as any;

            const draftValuesPayload = {
              serviceType,
              condition,
              collectionDate,
              deliveryDate,
              totalWeight,
              status,
              notes,
              sealNumber1,
              sealNumber2,
              servicePriority,
              washingType,
              deliveredBy,
              personalEmployee,
              transportEmployee,
              packageManager,
              departureTime,
              arrivalTime,
              totalBundlesReceived,
              vehiclePlate,
              vehicleUnitNumber,
              requestedServices,
              supplierGuideNumber,
              shift,
              missingGarments,
            };

            onSubmit({
              guideData,
              guide: guideToEdit,
              draftValues: draftValuesPayload,
            });
          }}
          isLoading={!!submitting}
          fullWidth
          size="md"
          disabled={
            guideToEdit
              ? (!collectionDate || !serviceType || !branchOfficeId)
              : (!selectedClientId || !collectionDate || guideItems.length === 0 || !serviceType || !branchOfficeId)
          }
          icon={<Icon name="checkmark-circle-outline" size={18} color="white" />}
        />

        <Modal transparent visible={clientModalOpen} animationType="slide" onRequestClose={() => setClientModalOpen(false)}>
          <View className="flex-1 bg-black/40" />
          <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
            <View className="flex-row items-center mb-4">
              <Text className="text-xl font-bold text-gray-900 flex-1">Nuevo Cliente</Text>
              <TouchableOpacity onPress={() => setClientModalOpen(false)}>
                <Icon name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <ClientForm
              submitting={isCreating}
              onSubmit={async data => {
                const newClient = await createClientAsync(data);
                if (newClient?.id) {
                  onChangeClient(newClient.id);
                }
                setClientModalOpen(false);
              }}
              onCancel={() => setClientModalOpen(false)}
            />
          </View>
        </Modal>

        {/* Detalle de guía eliminado */}

        {/* Modal de Selección de Vehículos */}
        <VehicleSelectionModal
          visible={vehicleModalOpen}
          onClose={() => setVehicleModalOpen(false)}
          onSelectVehicle={(vehicle) => {
            setSelectedVehicle(vehicle);
            setVehiclePlate(vehicle.plate_number);
            setVehicleUnitNumber(vehicle.unit_number || '');
            setVehicleModalOpen(false);
          }}
          vehicles={vehicles.map(v => ({
            id: v.id,
            unit_number: v.unit_number,
            plate_number: v.plate_number,
            brand: v.brand,
            model: v.model,
            year: v.year,
            status: v.status,
            capacity: v.capacity,
          }))}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
};


