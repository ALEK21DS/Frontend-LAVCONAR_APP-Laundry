import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Card, Dropdown, Input } from '@/components/common';
import { GuideItem } from '@/laundry/interfaces/guides/guides.interface';
import { useAuthStore } from '@/auth/store/auth.store';
import { SUCURSALES } from '@/constants';
// GUIDE_STATUS, GUIDE_STATUS_LABELS, SERVICE_PRIORITIES, WASHING_TYPES ahora vienen de catálogos
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { ClientForm } from '@/laundry/pages/clients/ui/ClientForm';
import { useCreateClient } from '@/laundry/hooks/clients';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useGuideGarmentsByGuide } from '@/laundry/hooks/guides/guide-garments';
import { useGetRfidScanByGuide } from '@/laundry/hooks/guides/rfid-scan';
import { useGarmentsByRfidCodes } from '@/laundry/hooks/guides/garments/useGarmentsByRfidCodes';
// Detalle de guía eliminado del flujo
import { isValidDate, sanitizeNumericInput, isNonNegative, safeParseInt, safeParseFloat } from '@/helpers/validators.helper';
import { useVehicles } from '@/laundry/hooks/vehicles';
import { VehicleSelectionModal, DatePickerModal, TimePickerModal } from '@/laundry/components';
import { isSuperAdminUser } from '@/helpers/user.helper';

type Option = { label: string; value: string; serviceType?: string; acronym?: string };

interface GuideFormProps {
  clientOptions: Option[];
  selectedClientId?: string;
  onChangeClient: (id: string) => void;
  onChangeBranchOffice?: (branchOfficeId: string) => void; // Callback para notificar cambio de sucursal
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
  onChangeBranchOffice,
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
  const userBranchOfficeId = user?.branch_office_id || (user as any)?.sucursalId;
  const isSuperAdmin = isSuperAdminUser(user);
  
  // Estado para sucursal seleccionada (para superadmin puede seleccionar, para admin usa la del usuario)
  const [selectedBranchOfficeId, setSelectedBranchOfficeId] = useState<string>(
    draftValues?.branchOfficeId || guideToEdit?.branch_office_id || userBranchOfficeId || ''
  );
  
  // La sucursal final: para superadmin es la seleccionada, para admin es la del usuario
  const branchOfficeId = isSuperAdmin ? selectedBranchOfficeId : userBranchOfficeId;
  
  // Buscar el nombre de la sucursal en la lista de sucursales
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';
  
  // Opciones de sucursales para el dropdown (solo para superadmin)
  const branchOfficeOptions = useMemo(() => {
    return sucursales.map(branch => ({
      label: branch.name,
      value: branch.id,
    }));
  }, [sucursales]);

  // Estado local para campos del servicio y fechas
  const resolvedInitialServiceType = initialServiceType || guideToEdit?.service_type || 'INDUSTRIAL';
  const [serviceType, setServiceType] = useState<string>(draftValues?.serviceType || resolvedInitialServiceType);
  const [condition, setCondition] = useState<string>(draftValues?.condition || guideToEdit?.general_condition || 'REGULAR');
  const [personalEmployee, setPersonalEmployee] = useState<string>(draftValues?.personalEmployee || guideToEdit?.delivered_by || '');
  const [transportEmployee, setTransportEmployee] = useState<string>(draftValues?.transportEmployee || '');
  const [packageManager, setPackageManager] = useState<string>(draftValues?.packageManager || '');
  const [departureTime, setDepartureTime] = useState<string>(draftValues?.departureTime || '');
  const [arrivalTime, setArrivalTime] = useState<string>(draftValues?.arrivalTime || '');
  const [sealNumber1, setSealNumber1] = useState<string>(draftValues?.sealNumber1 || guideToEdit?.precinct_number || '');
  const [sealNumber2, setSealNumber2] = useState<string>(draftValues?.sealNumber2 || guideToEdit?.precinct_number_2 || '');
  const [shift, setShift] = useState<string>(draftValues?.shift || guideToEdit?.shift || '');
  // Formatear fecha actual a dd/mm/yyyy
  const formatDateToDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para extraer fecha y hora de un ISO string
  const extractDateTimeFromISO = (isoString: string | undefined) => {
    if (!isoString) return { date: '', time: '' };
    try {
      const dateObj = new Date(isoString);
      const date = formatDateToDisplay(dateObj);
      const time = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
      return { date, time };
    } catch {
      return { date: '', time: '' };
    }
  };

  const collectionDateTime = extractDateTimeFromISO(guideToEdit?.collection_date);
  const deliveryDateTime = extractDateTimeFromISO(guideToEdit?.delivery_date);

  const [collectionDate, setCollectionDate] = useState<string>(
    draftValues?.collectionDate || collectionDateTime.date || formatDateToDisplay(new Date())
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    draftValues?.deliveryDate || deliveryDateTime.date || formatDateToDisplay(new Date())
  );
  // Hora asociada a cada fecha (formato HH:mm)
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  const [collectionTime, setCollectionTime] = useState<string>(
    draftValues?.collectionTime || collectionDateTime.time || getCurrentTimeString()
  );
  const [deliveryTime, setDeliveryTime] = useState<string>(
    draftValues?.deliveryTime || deliveryDateTime.time || getCurrentTimeString()
  );
  const [totalWeight, setTotalWeight] = useState<string>(
    draftValues?.totalWeight ?? 
    (guideToEdit?.total_weight !== undefined && guideToEdit?.total_weight !== null
      ? guideToEdit.total_weight.toString()
      : initialTotalWeight > 0 
        ? initialTotalWeight.toFixed(2) 
        : ''
    )
  );
  const [missingGarments, setMissingGarments] = useState<string>(
    draftValues?.missingGarments ??
    (guideToEdit?.missing_garments !== undefined && guideToEdit?.missing_garments !== null
      ? String(guideToEdit.missing_garments)
      : '')
  );
  // Estado inicial: obtener del catálogo (primer estado activo, o 'COLLECTED' como fallback)
  const getInitialStatus = useMemo(() => {
    if (guideStatusCatalog?.data && guideStatusCatalog.data.length > 0) {
      const firstActiveStatus = guideStatusCatalog.data
        .filter(v => v.is_active)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];
      return firstActiveStatus?.code || 'COLLECTED';
    }
    return 'COLLECTED'; // Fallback si no hay catálogo
  }, [guideStatusCatalog]);
  
  const [status, setStatus] = useState<string>(draftValues?.status || guideToEdit?.status || getInitialStatus);
  
  // Actualizar estado inicial cuando el catálogo esté disponible y no haya draftValues
  useEffect(() => {
    if (!draftValues?.status && !guideToEdit?.status && getInitialStatus !== 'COLLECTED') {
      setStatus(getInitialStatus);
    }
  }, [getInitialStatus, draftValues, guideToEdit]);
  // Catálogos dinámicos (frescos) para condiciones, estados y tipos de servicio
  const { data: generalConditionCatalog, isLoading: isLoadingGeneralCondition } = useCatalogValuesByType('general_condition', true, { forceFresh: true });
  const { data: guideStatusCatalog, isLoading: isLoadingGuideStatus } = useCatalogValuesByType('guide_status', true, { forceFresh: true });
  const { data: serviceTypeCatalog, isLoading: isLoadingServiceType } = useCatalogValuesByType('service_type', true, { forceFresh: true });
  const { data: servicePriorityCatalog, isLoading: isLoadingServicePriority } = useCatalogValuesByType('service_priority', true, { forceFresh: true });
  const { data: washingTypeCatalog, isLoading: isLoadingWashingType } = useCatalogValuesByType('washing_type', true, { forceFresh: true });
  const { data: shiftCatalog, isLoading: isLoadingShift } = useCatalogValuesByType('shift', true, { forceFresh: true });
  const { data: requestedServicesCatalog, isLoading: isLoadingRequestedServices } = useCatalogValuesByType('requested_services', true, { forceFresh: true });
  
  const isLoadingCatalogs = isLoadingGeneralCondition || isLoadingGuideStatus || isLoadingServiceType || isLoadingServicePriority || isLoadingWashingType || isLoadingShift || isLoadingRequestedServices;

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
    return found?.label || status || 'Sin estado';
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

  // Filtrar clientes por sucursal seleccionada
  const filteredClientOptions = useMemo(() => {
    // Por ahora retornamos todos los clientes ya que la filtración se hace en GuidesPage
    // TODO: Filtrar por sucursal cuando GuidesPage pase la información de sucursal de cada cliente
    return clientOptions;
  }, [clientOptions, branchOfficeId]);

  const selectedClientOption = useMemo(() => {
    if (!selectedClientId) return undefined;
    return filteredClientOptions.find(option => option.value === selectedClientId);
  }, [filteredClientOptions, selectedClientId]);

  const selectedClientServiceLabel = useMemo(() => {
    const type = (selectedClientOption?.serviceType || serviceType || '').toUpperCase();
    if (!type) return null;
    return type === 'INDUSTRIAL' ? 'Servicio Industrial' : 'Servicio Personal';
  }, [selectedClientOption?.serviceType, serviceType]);
  
  // Limpiar cliente cuando cambia la sucursal (para superadmin)
  useEffect(() => {
    if (isSuperAdmin && selectedBranchOfficeId && selectedClientId) {
      // Verificar si el cliente seleccionado pertenece a la nueva sucursal
      // Si no, limpiar la selección
      const clientBelongsToBranch = filteredClientOptions.some(opt => opt.value === selectedClientId);
      if (!clientBelongsToBranch) {
        onChangeClient('');
      }
    }
  }, [selectedBranchOfficeId, isSuperAdmin, filteredClientOptions, selectedClientId, onChangeClient]);

  const REQUESTED_SERVICES_OPTIONS = useMemo(() => {
    return (requestedServicesCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [requestedServicesCatalog]);
  const [notes, setNotes] = useState<string>(draftValues?.notes || guideToEdit?.notes || '');
  const [supplierGuideNumber, setSupplierGuideNumber] = useState<string>(draftValues?.supplierGuideNumber || guideToEdit?.supplier_guide_number || '');
  const [requestedServices, setRequestedServices] = useState<string[]>(draftValues?.requestedServices || guideToEdit?.requested_services || []);
  const [showRequestedServices, setShowRequestedServices] = useState<boolean>(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  // Detalle de guía eliminado del flujo

  // Nuevos campos basados en las imágenes y schema
  const [servicePriority, setServicePriority] = useState<string>(draftValues?.servicePriority || guideToEdit?.service_priority || 'NORMAL');
  const [washingType, setWashingType] = useState<string>(draftValues?.washingType || guideToEdit?.washing_type || '');

  // Personal involucrado
  const [deliveredBy, setDeliveredBy] = useState<string>(draftValues?.deliveredBy || guideToEdit?.delivered_by || '');
  // Campos adicionales de transporte removidos del UI actual

  // Gestión de paquetes
  const [totalBundlesReceived, setTotalBundlesReceived] = useState<string>(
    draftValues?.totalBundlesReceived || 
    (guideToEdit?.total_bundles_received ? String(guideToEdit.total_bundles_received) : '') ||
    ''
  );
  // Discrepancia/esperados removidos del UI actual
  const [vehiclePlate, setVehiclePlate] = useState<string>(draftValues?.vehiclePlate || guideToEdit?.vehicle_plate || '');
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

  // Obtener las prendas registradas por códigos RFID en modo creación
  const rfidCodesInCreation = useMemo(() => {
    return guideItems.map(item => item.tagEPC).filter(Boolean);
  }, [guideItems]);

  const { data: garmentsDataInCreation, isLoading: isLoadingGarmentsInCreation } = useGarmentsByRfidCodes(
    rfidCodesInCreation,
    !guideToEdit && rfidCodesInCreation.length > 0 // Solo en modo creación
  );

  // Obtener las prendas registradas por códigos RFID en modo edición
  const { data: garmentsDataInEdit, isLoading: isLoadingGarmentsInEdit } = useGarmentsByRfidCodes(
    existingRfids,
    !!guideToEdit && existingRfids.length > 0 // Solo en modo edición
  );

  // Total de prendas: en modo creación se calcula desde items escaneados,
  // en modo edición se usa el valor guardado en la BD (actualizado después de escaneos)
  const totalGarments = useMemo(() => {
    if (guideToEdit) {
      // Modo edición: usar el valor actualizado de la base de datos
      // No calcular, porque el total ya fue actualizado cuando se hicieron los escaneos
      return guideToEdit.total_garments || 0;
    } else {
      // Modo creación: calcular desde los items escaneados (RFID)
      // Si una prenda no tiene cantidad definida, se cuenta como 1
      const garments = garmentsDataInCreation?.data || [];
      return garments.reduce((total, garment) => {
        const quantity = garment.quantity;
        return total + (quantity && quantity > 0 ? quantity : 1);
      }, 0);
    }
  }, [guideToEdit, garmentsDataInCreation]);

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
      if (draftValues.branchOfficeId) setSelectedBranchOfficeId(draftValues.branchOfficeId);
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

      // Cargar sucursal primero para que se carguen los clientes correctos
      if (guideToEdit.branch_office_id) {
        setSelectedBranchOfficeId(guideToEdit.branch_office_id);
        // Notificar cambio de sucursal a GuidesPage
        if (onChangeBranchOffice) {
          onChangeBranchOffice(guideToEdit.branch_office_id);
        }
      }

      setServiceType(guideToEdit.service_type || '');
      // charge_type no aplica a guides
      setCondition(guideToEdit.general_condition || 'REGULAR');
      setCollectionDate(formatISOToDisplay(guideToEdit.collection_date));
      setDeliveryDate(formatISOToDisplay(guideToEdit.delivery_date));
      setTotalWeight(guideToEdit.total_weight ? parseFloat(guideToEdit.total_weight).toFixed(2) : '');
      setStatus(guideToEdit.status || '');
      setNotes(guideToEdit.notes || '');
      // Cargar número de guía del proveedor
      setSupplierGuideNumber(guideToEdit.supplier_guide_number || '');
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
  }, [guideToEdit, onChangeBranchOffice]);

  // Cargar cliente después de que se haya sincronizado la sucursal y los clientes estén disponibles
  useEffect(() => {
    if (guideToEdit && guideToEdit.client_id && filteredClientOptions.length > 0) {
      // Verificar que el cliente esté en la lista filtrada
      const clientExists = filteredClientOptions.some(option => option.value === guideToEdit.client_id);
      if (clientExists) {
        onChangeClient(guideToEdit.client_id);
      }
    }
  }, [guideToEdit, filteredClientOptions, onChangeClient]);

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

  // Estado para modal de fechas (recolección y entrega)
  const [datePickerState, setDatePickerState] = useState<{
    visible: boolean;
    mode: 'collection' | 'delivery' | null;
  }>({
    visible: false,
    mode: null,
  });

  // Indicadores y timers para mostrar spinner al abrir los modales de fecha
  const [isOpeningCollectionDate, setIsOpeningCollectionDate] = useState(false);
  const [isOpeningDeliveryDate, setIsOpeningDeliveryDate] = useState(false);
  const collectionDateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deliveryDateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal ligero para hora (recolección / entrega)
  const [timePickerState, setTimePickerState] = useState<{
    visible: boolean;
    mode: 'collection' | 'delivery' | null;
  }>({
    visible: false,
    mode: null,
  });

  const handleDatePickerConfirm = (day: number, month: number, year: number, hour?: number, minute?: number) => {
    const formatted = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    const timeStr =
      typeof hour === 'number' && typeof minute === 'number'
        ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        : getCurrentTimeString();
    if (datePickerState.mode === 'collection') {
      setCollectionDate(formatted);
      setCollectionTime(timeStr);
    } else if (datePickerState.mode === 'delivery') {
      setDeliveryDate(formatted);
      setDeliveryTime(timeStr);
    }
    setDatePickerState({ visible: false, mode: null });
    // Al cerrar por confirmación, limpiar spinners y timers
    if (collectionDateTimeoutRef.current) {
      clearTimeout(collectionDateTimeoutRef.current);
      collectionDateTimeoutRef.current = null;
    }
    if (deliveryDateTimeoutRef.current) {
      clearTimeout(deliveryDateTimeoutRef.current);
      deliveryDateTimeoutRef.current = null;
    }
    setIsOpeningCollectionDate(false);
    setIsOpeningDeliveryDate(false);
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

  // Función para convertir dd/mm/yyyy y hora (HH:mm) a ISO string para el backend
  // Si no se pasa hora, puede usar la hora actual o 00:00 según bandera
  const formatDateToISO = (dateStr: string, timeStr?: string, useCurrentTime: boolean = true): string => {
    const dateObj = parseDateFromDisplay(dateStr);
    if (!dateObj) return '';

    if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        dateObj.setHours(h, m, 0, 0);
      }
    } else if (useCurrentTime) {
      // Usar la hora actual para la fecha si no tenemos hora específica
      const now = new Date();
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    } else {
      // Sin hora específica ni hora actual: dejar a medianoche
      dateObj.setHours(0, 0, 0, 0);
    }

    return dateObj.toISOString();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Información de la Guía (solo en modo edición) */}
        {guideToEdit && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Icon name="document-text-outline" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-blue-600 font-semibold">Editar Guía</Text>
                <Text className="text-sm text-blue-900 font-medium mt-0.5">
                  Actualiza la información de la guía
                </Text>
              </View>
            </View>
            <View className="bg-blue-100 rounded-lg px-3 py-2 mt-3">
              <View className="flex-row items-center">
                <Text className="text-xs text-blue-700 font-medium">Número de Guía:</Text>
                <Text className="text-sm text-blue-900 font-bold ml-2">{guideToEdit.guide_number}</Text>
              </View>
            </View>
          </View>
        )}

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

        {/* Sucursal primero (solo para superadmin) */}
        {isSuperAdmin && (
          <View className="mb-4">
            <Dropdown
              label="Sucursal *"
              placeholder="Selecciona una sucursal"
              options={branchOfficeOptions}
              value={selectedBranchOfficeId || ''}
              onValueChange={(value) => {
                setSelectedBranchOfficeId(value);
                // Notificar cambio de sucursal a GuidesPage
                if (onChangeBranchOffice) {
                  onChangeBranchOffice(value);
                }
                // Limpiar cliente cuando cambia la sucursal
                onChangeClient('');
              }}
              icon="business-outline"
            />
          </View>
        )}
        
        {/* Cliente (filtrado por sucursal) */}
        <View className="mb-4">
          <Dropdown
            label="Cliente *"
            placeholder="Selecciona un cliente"
            options={filteredClientOptions}
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
                  placeholder={isLoadingShift ? "Cargando..." : "Selecciona un turno"}
                  options={SHIFT_OPTIONS}
                  value={shift}
                  onValueChange={setShift}
                  icon="time-outline"
                  disabled={isLoadingShift || SHIFT_OPTIONS.length === 0}
                />
              </View>
            </>
          )}
          {/* Mostrar sucursal solo para admin (no superadmin, ya que lo selecciona arriba) */}
          {!isSuperAdmin && (
            <Input label="Sucursal" value={branchOfficeName} editable={false} className="mt-1" />
          )}
          <View className="flex-row mt-1 -mx-1">
            {/* Fecha de Recolección */}
            <View className="flex-1 px-1">
              <Text className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
                Fecha Recolección *
              </Text>
              <View
                className={`flex-row items-center border rounded-lg px-3 py-2 bg-white ${!isSuperAdmin ? 'bg-gray-50' : ''}`}
                style={{ borderColor: isSuperAdmin ? '#3B82F6' : '#D1D5DB', minHeight: 44 }}
              >
                <TouchableOpacity
                  disabled={!isSuperAdmin}
                  onPress={() => {
                    if (!isSuperAdmin || isOpeningCollectionDate) return;
                    setIsOpeningCollectionDate(true);
                    // Mostrar spinner inmediatamente y abrir el modal con un pequeño delay (~50ms)
                    collectionDateTimeoutRef.current = setTimeout(() => {
                      setDatePickerState({ visible: true, mode: 'collection' });
                    }, 0.05);
                  }}
                  activeOpacity={isSuperAdmin ? 0.8 : 1}
                  className="mr-3 items-center justify-center"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    backgroundColor: isSuperAdmin ? '#DBEAFE' : '#E5E7EB',
                    opacity: isSuperAdmin ? 1 : 0.6,
                  }}
                >
                  {isOpeningCollectionDate ? (
                    <ActivityIndicator size="small" color={isSuperAdmin ? '#1D4ED8' : '#9CA3AF'} />
                  ) : (
                    <Icon name="calendar-outline" size={18} color={isSuperAdmin ? '#1D4ED8' : '#9CA3AF'} />
                  )}
                </TouchableOpacity>
                <View className="flex-1">
                  <TextInput
                    className="flex-1 text-gray-900 text-sm"
                placeholder="dd/mm/aaaa"
                    placeholderTextColor="#9CA3AF"
                value={collectionDate}
                    editable={false}
                    style={{ paddingVertical: 8, fontSize: 14 }}
              />
            </View>
              </View>

              {/* Hora de Recolección (solo visual + botón para abrir modal ligero) */}
              <View className="mt-1 flex-row items-center">
                <Text className="text-xs text-gray-500 mr-2">Hora:</Text>
                <TouchableOpacity
                  disabled={!isSuperAdmin}
                  onPress={() => {
                    if (!isSuperAdmin) return;
                    setTimePickerState({ visible: true, mode: 'collection' });
                  }}
                  className="flex-row items-center px-2 py-1 rounded-full bg-gray-50 border border-gray-200"
                  activeOpacity={isSuperAdmin ? 0.8 : 1}
                >
                  <Icon
                    name="time-outline"
                    size={14}
                    color={isSuperAdmin ? '#1D4ED8' : '#9CA3AF'}
                  />
                  <Text className="text-xs text-gray-800 ml-1">
                    {collectionTime || '--:--'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fecha de Entrega */}
            <View className="flex-1 px-1">
              <Text className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
                Fecha Entrega
              </Text>
              <View
                className="flex-row items-center border rounded-lg px-3 py-2 bg-white"
                style={{ borderColor: '#3B82F6', minHeight: 44 }}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (isOpeningDeliveryDate) return;
                    setIsOpeningDeliveryDate(true);
                    // Mostrar spinner inmediatamente y abrir el modal con un pequeño delay (~50ms)
                    deliveryDateTimeoutRef.current = setTimeout(() => {
                      setDatePickerState({ visible: true, mode: 'delivery' });
                    }, 0.05);
                  }}
                  activeOpacity={0.8}
                  className="mr-3 items-center justify-center"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    backgroundColor: '#DBEAFE',
                  }}
                >
                  {isOpeningDeliveryDate ? (
                    <ActivityIndicator size="small" color="#1D4ED8" />
                  ) : (
                    <Icon name="calendar-outline" size={18} color="#1D4ED8" />
                  )}
                </TouchableOpacity>
                <View className="flex-1">
                  <TextInput
                    className="flex-1 text-gray-900 text-sm"
                placeholder="dd/mm/aaaa"
                    placeholderTextColor="#9CA3AF"
                value={deliveryDate}
                    editable={false}
                    style={{ paddingVertical: 8, fontSize: 14 }}
                  />
                </View>
              </View>

              {/* Hora de Entrega */}
              <View className="mt-1 flex-row items-center">
                <Text className="text-xs text-gray-500 mr-2">Hora:</Text>
                <TouchableOpacity
                  onPress={() => {
                    setTimePickerState({ visible: true, mode: 'delivery' });
                  }}
                  className="flex-row items-center px-2 py-1 rounded-full bg-gray-50 border border-gray-200"
                  activeOpacity={0.8}
                >
                  <Icon
                    name="time-outline"
                    size={14}
                    color="#1D4ED8"
                  />
                  <Text className="text-xs text-gray-800 ml-1">
                    {deliveryTime || '--:--'}
                  </Text>
                </TouchableOpacity>
              </View>
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
                  {isLoadingRequestedServices ? (
                    <View className="py-4 items-center">
                      <ActivityIndicator size="small" color="#1D4ED8" />
                      <Text className="text-gray-500 text-sm mt-2">Cargando opciones...</Text>
                    </View>
                  ) : REQUESTED_SERVICES_OPTIONS.length > 0 ? (
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
              placeholder={isLoadingGeneralCondition ? "Cargando..." : "Selecciona la condición"}
              options={GENERAL_CONDITION_OPTIONS}
              value={condition}
              onValueChange={setCondition}
              icon="checkmark-circle-outline"
              disabled={isLoadingGeneralCondition || GENERAL_CONDITION_OPTIONS.length === 0}
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

      {showScanButton && !guideToEdit && (
        <View className="mb-4">
          <Button
            title={isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo'}
            onPress={() => {
              onScan();
            }}
            icon={<Icon name={isScanning ? 'stop-circle-outline' : 'scan-outline'} size={18} color="white" />}
            fullWidth
            size="sm"
            disabled={!selectedClientId}
            style={{ backgroundColor: '#0b1f36' }}
          />
          {!selectedClientId && (
            <Text className="text-sm text-gray-500 mt-2 text-center">Selecciona un cliente para continuar</Text>
          )}
        </View>
      )}

        {/* Detalles de Servicio (solo servicio personal) */}
        {serviceType === 'PERSONAL' && (
          <View className="mb-6 bg-blue-50 p-4 rounded-lg">
            <Text className="text-base text-blue-800 font-semibold mb-3">Detalles de Servicio</Text>
            <Dropdown
              label="Prioridad"
              placeholder={isLoadingServicePriority ? "Cargando..." : "Seleccionar prioridad"}
              options={SERVICE_PRIORITY_OPTIONS_DYNAMIC}
              value={servicePriority}
              onValueChange={setServicePriority}
              icon="flag-outline"
              disabled={isLoadingServicePriority || SERVICE_PRIORITY_OPTIONS_DYNAMIC.length === 0}
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
          title={guideToEdit ? 'Guardar Cambios' : 'Crear Guía'}
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
              branch_office_id: branchOfficeId && branchOfficeId.trim() !== '' ? branchOfficeId : undefined,
              service_type: serviceType as any,
              supplier_guide_number: serviceType === 'INDUSTRIAL' ? (supplierGuideNumber || undefined) : undefined,
              collection_date: formatDateToISO(collectionDate, collectionTime, true),
              delivery_date: deliveryDate ? formatDateToISO(deliveryDate, deliveryTime, true) : undefined,
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
              branchOfficeId: selectedBranchOfficeId,
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

      {/* Modal de selección de fecha (Recolección / Entrega) */}
      <DatePickerModal
        visible={datePickerState.visible}
        onClose={() => {
          setDatePickerState({ visible: false, mode: null });
          // Limpiar spinners y timers al cerrar sin confirmar
          if (collectionDateTimeoutRef.current) {
            clearTimeout(collectionDateTimeoutRef.current);
            collectionDateTimeoutRef.current = null;
          }
          if (deliveryDateTimeoutRef.current) {
            clearTimeout(deliveryDateTimeoutRef.current);
            deliveryDateTimeoutRef.current = null;
          }
          setIsOpeningCollectionDate(false);
          setIsOpeningDeliveryDate(false);
        }}
        onConfirm={handleDatePickerConfirm}
        initialDate={
          datePickerState.mode === 'collection'
            ? collectionDate
            : datePickerState.mode === 'delivery'
            ? deliveryDate
            : undefined
        }
        minDate={datePickerState.mode === 'delivery' ? new Date() : undefined}
        minDateErrorMessage="La fecha de entrega no puede ser anterior a hoy"
      />

      {/* Modal ligero para hora (Recolección / Entrega) */}
      <TimePickerModal
        visible={timePickerState.visible}
        onClose={() => setTimePickerState({ visible: false, mode: null })}
        initialTime={
          timePickerState.mode === 'collection'
            ? collectionTime
            : timePickerState.mode === 'delivery'
            ? deliveryTime
            : undefined
        }
        title={
          timePickerState.mode === 'collection'
            ? 'Hora de Recolección'
            : timePickerState.mode === 'delivery'
            ? 'Hora de Entrega'
            : 'Seleccionar Hora'
        }
        onConfirm={(time) => {
          if (timePickerState.mode === 'collection') {
            setCollectionTime(time);
          } else if (timePickerState.mode === 'delivery') {
            setDeliveryTime(time);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
};


