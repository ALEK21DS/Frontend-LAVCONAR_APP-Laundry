import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { View, Text, FlatList, Alert, NativeModules, NativeEventEmitter, Modal, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Button, Card } from '@/components/common';
import { EmptyState } from '@/components/ui/empty-state';
import { useTagStore } from '@/laundry/store/tag.store';
import { rfidModule } from '@/lib/rfid/rfid.module';
import Icon from 'react-native-vector-icons/Ionicons';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { GuideForm } from '@/laundry/pages/guides/ui/GuideForm';
import { ProcessForm } from '@/laundry/pages/processes/ui/ProcessForm';
import { WashingProcessForm } from '@/laundry/pages/processes/ui/WashingProcessForm';
import { GarmentForm } from '@/laundry/pages/garments/ui/GarmentForm';
import { ScanFormModal } from '@/laundry/pages/scan/ui/ScanFormModal';
import { useClients } from '@/laundry/hooks/clients';
import { useCatalogValuesByType } from '@/laundry/hooks';
import { useGarments, useCreateGarment, useUpdateGarment, useGuides, useGarmentsByRfidCodes, useCreateGuide } from '@/laundry/hooks/guides';
import { useAuthStore } from '@/auth/store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { GuideSelectionModal } from '@/laundry/components/GuideSelectionModal';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { ApiResponse } from '@/interfaces/base.response';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCAN_RANGE_PRESETS, ScanRangeKey } from '@/constants/scanRange';
import { ScanRangeModal } from '@/laundry/components/ScanRangeModal';

type ScanClothesPageProps = {
  navigation: NativeStackNavigationProp<any>;
  route?: {
    params?: {
      mode?: string;
      guideId?: string;
      processType?: string;
      serviceType?: 'industrial' | 'personal';
      initialRfids?: string[];
      isEditMode?: boolean;
      guideToEdit?: any;
      rfidScanId?: string;
    };
  };
};

export const ScanClothesPage: React.FC<ScanClothesPageProps> = ({ navigation, route }) => {
  const mode = route?.params?.mode || 'guide'; // 'garment' o 'guide'
  const serviceType = route?.params?.serviceType || 'industrial';
  const initialRfids = route?.params?.initialRfids || [];
  const isEditMode = route?.params?.isEditMode || false;
  const passedGuide = route?.params?.guideToEdit || null;
  const {
    scannedTags,
    addScannedTag,
    clearScannedTags,
    isScanning,
    setIsScanning,
    scanRangeKey,
    setScanRangeKey,
  } = useTagStore();
  
  // Hooks modulares
  const { createGarmentAsync, isCreating } = useCreateGarment();
  const { updateGarmentAsync, isUpdating } = useUpdateGarment();
  const { createGuideAsync } = useCreateGuide();
  const seenSetRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef<boolean>(false);
  const scannedTagsCountRef = useRef<number>(0);
  const [isStopping, setIsStopping] = useState(false);
  
  // Sincronizar el contador de tags con la ref
  useEffect(() => {
    scannedTagsCountRef.current = scannedTags.length;
  }, [scannedTags]);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [garmentModalOpen, setGarmentModalOpen] = useState(false);
  type ScanFormContext = {
    origin: 'guide' | 'process';
    guideId?: string;
    guide?: any;
    guideData?: any;
    draftValues?: any;
    rfidScanId?: string;
    initialScanType?: string;
    processType?: string;
    scannedTags: string[];
    deferRfidScanUpdate?: boolean;
    unregisteredCodes?: string[];
    serviceType?: 'industrial' | 'personal';
  };
  const [scanFormContext, setScanFormContext] = useState<ScanFormContext | null>(null);
  const [pendingGuideEdit, setPendingGuideEdit] = useState<any | undefined>(undefined);
  const [guideDraftData, setGuideDraftData] = useState<any | undefined>(undefined);
  const [guideDraftValues, setGuideDraftValues] = useState<any | undefined>(undefined);

  useEffect(() => {
    if (pendingGuideEdit?.client_id) {
      setSelectedClientId(pendingGuideEdit.client_id);
    }
  }, [pendingGuideEdit?.client_id]);

  useEffect(() => {
    if (guideDraftData?.client_id) {
      setSelectedClientId(guideDraftData.client_id);
    }
  }, [guideDraftData?.client_id]);
  // Al entrar a esta pantalla o cuando cambien los params, asegurarnos de que no haya modales abiertos
  useEffect(() => {
    setGuideModalOpen(false);
    setGarmentModalOpen(false);
  }, [route?.params?.guideId, route?.params?.isEditMode]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [washingProcessFormOpen, setWashingProcessFormOpen] = useState(false);
  const [washingProcessFormData, setWashingProcessFormData] = useState<{
    guideId: string;
    guideNumber: string;
    branchOfficeId: string;
    branchOfficeName: string;
    processType: string;
    rfidScanId?: string;
    rfidScanUpdateData?: any;
  } | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const currentRangeConfig = SCAN_RANGE_PRESETS[scanRangeKey];
  const RSSI_SAFETY_MARGIN = 10; // Permite tolerancia porque algunos lectores reportan valores más bajos
  const MIN_RSSI = currentRangeConfig.minRssi - RSSI_SAFETY_MARGIN;
  
  // Estados para los nuevos modales
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [guideSelectionModalOpen, setGuideSelectionModalOpen] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');
  
  // Estados para el flujo de servicio personal (registro prenda por prenda)
  const [registeredGarments, setRegisteredGarments] = useState<Array<{id: string, description: string, rfidCode: string, category?: string, color?: string, weight?: number, quantity?: number}>>([]);
  const [showActionButtons, setShowActionButtons] = useState(false);
  
  // Estado para controlar si ya se cargaron los RFIDs iniciales
  const [initialRfidsLoaded, setInitialRfidsLoaded] = useState(false);
  
  // Obtener lista de clientes (máximo 50 según validación del backend)
  const { clients, isLoading: isLoadingClients } = useClients({ limit: 50 });

  const filteredClientOptions = useMemo(() => {
    const normalizedType = serviceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL';
    let options = clients
      .filter(client => (client.service_type || '').toUpperCase() === normalizedType)
      .map(client => ({
        label: client.acronym ? `${client.name} (${client.acronym})` : client.name,
        value: client.id,
        serviceType: (client.service_type || '').toUpperCase(),
        acronym: client.acronym,
      }));

    if (selectedClientId && !options.some(opt => opt.value === selectedClientId)) {
      const fallback = clients.find(client => client.id === selectedClientId);
      if (fallback) {
        options = [
          ...options,
          {
            label: fallback.acronym ? `${fallback.name} (${fallback.acronym})` : fallback.name,
            value: fallback.id,
            serviceType: (fallback.service_type || '').toUpperCase(),
            acronym: fallback.acronym,
          },
        ];
      }
    }

    return options;
  }, [clients, serviceType, selectedClientId]);
  
  // Obtener guías filtradas solo por tipo de servicio (sin filtro por status)
  const { guides: guidesForProcess, isLoading: isLoadingGuides, refetch: refetchGuidesForProcess } = useGuides({
    limit: 50,
    service_type: serviceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL',
    enabled: !!selectedProcessType, // Solo cargar cuando se selecciona un proceso
  });
  
  const queryClient = useQueryClient();
  
  // Estados para manejar prenda existente
  const [existingGarment, setExistingGarment] = useState<any | null>(null);
  const [isCheckingRfid, setIsCheckingRfid] = useState(false);
  const isCheckingRef = useRef(false);
  
  // Set para rastrear RFIDs que están siendo procesados (prevenir race conditions)
  const processingRfidsRef = useRef<Set<string>>(new Set());
  const startScanningFnRef = useRef<() => Promise<void> | void>();
  const stopScanningFnRef = useRef<() => Promise<void> | void>();

  // Función para verificar si un código RFID ya está registrado en la lista local
  const isRfidCodeAlreadyRegistered = useCallback((rfidCode: string) => {
    return registeredGarments.some(garment => garment.rfidCode === rfidCode);
  }, [registeredGarments]);
  
  // Para servicio industrial y modo garment: verificar prendas registradas por RFID
  // También cuando viene desde procesos (mode === 'process') con serviceType industrial
  // Y cuando es mode === 'guide' con serviceType === 'industrial'
  const rfidCodes = scannedTags.map(tag => tag.epc);
  
  // Determinar si debemos verificar prendas:
  // - mode === 'garment' (registrar prenda): siempre verificar
  // - mode === 'process' con serviceType === 'industrial': verificar
  // - mode === 'process' con serviceType === 'personal': NO verificar (usa registeredGarments, igual que guide personal)
  // - mode === 'guide' con serviceType === 'industrial': verificar
  // - mode === 'guide' con serviceType === 'personal': NO verificar (usa registeredGarments)
  const shouldCheckGarments = (
    mode === 'garment' || 
    (mode === 'process' && serviceType === 'industrial') ||
    (mode === 'guide' && serviceType === 'industrial')
  ) && rfidCodes.length > 0;

  // Catálogo de tipos de prenda para mostrar etiquetas en español
  const { data: garmentTypeCatalog } = useCatalogValuesByType('garment_type', true, { forceFresh: true });

  const garmentTypeLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (garmentTypeCatalog?.data) {
      garmentTypeCatalog.data
        .filter((item) => item.is_active !== false)
        .forEach((item) => {
          const originalCode = item.code ?? '';
          const normalizedCode = originalCode.trim().toUpperCase().replace(/[\s-]/g, '_');
          if (normalizedCode) {
            map.set(normalizedCode, item.label);
          }
          if (originalCode) {
            map.set(originalCode, item.label);
          }
        });
    }
    return map;
  }, [garmentTypeCatalog]);
  
  const { data: garmentsData, isLoading: isLoadingGarments, error: garmentsError } = useGarmentsByRfidCodes(
    rfidCodes, 
    shouldCheckGarments
  );
  
  // Crear un mapa de RFID -> Prenda para búsqueda rápida
  // Normalizar los códigos RFID a mayúsculas para la comparación
  const garmentsByRfid = React.useMemo(() => {
    const map = new Map();
    if (garmentsData?.data && Array.isArray(garmentsData.data)) {
      garmentsData.data.forEach((garment: any) => {
        if (garment.rfid_code) {
          // Normalizar a mayúsculas para la comparación
          const normalizedRfid = garment.rfid_code.trim().toUpperCase();
          map.set(normalizedRfid, garment);
        }
      });
    }
    return map;
  }, [garmentsData]);
  
  // Función helper para obtener una prenda por RFID (con normalización)
  const getGarmentByRfid = React.useCallback((rfidCode: string) => {
    if (!rfidCode) return null;
    const normalizedRfid = rfidCode.trim().toUpperCase();
    return garmentsByRfid.get(normalizedRfid);
  }, [garmentsByRfid]);
  
  // Debug: Log para verificar qué está pasando
  React.useEffect(() => {
    if (shouldCheckGarments && rfidCodes.length > 0 && !isLoadingGarments) {
      const sampleTags = scannedTags.slice(0, 3).map(t => ({
        epc: t.epc,
        found: !!getGarmentByRfid(t.epc),
        garment: getGarmentByRfid(t.epc) ? {
          id: getGarmentByRfid(t.epc)?.id,
          description: getGarmentByRfid(t.epc)?.description,
        } : null,
      }));
    }
  }, [shouldCheckGarments, rfidCodes.length, isLoadingGarments, garmentsError, garmentsByRfid.size, mode, serviceType, garmentsData, scannedTags, getGarmentByRfid]);
  
  // Contar prendas no registradas (usando normalización)
  const unregisteredCount = React.useMemo(() => {
    return scannedTags.filter(tag => !getGarmentByRfid(tag.epc)).length;
  }, [scannedTags, getGarmentByRfid]);

  const unregisteredRfids = React.useMemo(() => {
    return scannedTags
      .filter(tag => !getGarmentByRfid(tag.epc))
      .map(tag => tag.epc);
  }, [scannedTags, getGarmentByRfid]);

  // Peso total de prendas obtenidas del backend (para industrial y procesos)
  const totalWeightFromScannedGarments = React.useMemo(() => {
    if (scannedTags.length === 0) {
      return 0;
    }

    return scannedTags.reduce((total, tag) => {
      const garment = getGarmentByRfid(tag.epc);
      if (!garment) return total;

      const rawWeight = (garment as any).weight ?? (garment as any).weight_kg ?? (garment as any).peso;
      if (rawWeight === undefined || rawWeight === null) return total;

      const numericWeight = typeof rawWeight === 'string' ? parseFloat(rawWeight) : Number(rawWeight);
      if (Number.isNaN(numericWeight)) return total;

      return total + numericWeight;
    }, 0);
  }, [scannedTags, getGarmentByRfid]);

  // Agrupar tags por tipo de prenda (solo para servicio industrial)
  // Sumar las cantidades (quantity) de las prendas en lugar de contar códigos RFID
  const groupedTagsByGarmentType = React.useMemo(() => {
    if (serviceType !== 'industrial') {
      return [];
    }

    const grouped = new Map<string, { garmentType: string; count: number; totalWeight: number; tags: ScannedTag[] }>();
    
    scannedTags.forEach(tag => {
      const garment = getGarmentByRfid(tag.epc);
      
      if (garment) {
        // Prenda registrada (con o sin tipo)
        // Si tiene garment_type, agrupar por tipo; si no, agrupar como "REGISTERED"
        const garmentType = garment.garment_type || 'REGISTERED';
        if (!grouped.has(garmentType)) {
          grouped.set(garmentType, {
            garmentType,
            count: 0,
            totalWeight: 0,
            tags: []
          });
        }
        const group = grouped.get(garmentType)!;
        // Sumar la cantidad de la prenda (quantity), o contar como 1 si no tiene cantidad
        const quantity = garment.quantity;
        group.count += (quantity && quantity > 0 ? quantity : 1);
        // Sumar el peso de la prenda (weight); si no tiene, no suma nada
        const weight = garment.weight;
        if (typeof weight === 'number' && !Number.isNaN(weight) && weight > 0) {
          group.totalWeight += weight;
        }
        group.tags.push(tag);
      } else {
        // Prenda no registrada - contar como 1 código RFID
        const unregisteredKey = 'UNREGISTERED';
        if (!grouped.has(unregisteredKey)) {
          grouped.set(unregisteredKey, {
            garmentType: 'UNREGISTERED',
            count: 0,
            totalWeight: 0,
            tags: []
          });
        }
        const group = grouped.get(unregisteredKey)!;
        group.count += 1; // Prendas no registradas se cuentan como 1
        group.tags.push(tag);
      }
    });

    return Array.from(grouped.values());
  }, [scannedTags, getGarmentByRfid, serviceType, mode]);

  // Estado para modal de detalles de escaneos por tipo de prenda (solo servicio industrial)
  const [scanDetailsModalOpen, setScanDetailsModalOpen] = React.useState(false);
  const [selectedScanGroup, setSelectedScanGroup] = React.useState<{
    title: string;
    items: { epc: string; description: string; quantity: number; weight?: number }[];
  } | null>(null);

  // Estado para modal de edición de cantidad
  const [quantityEditModalOpen, setQuantityEditModalOpen] = useState(false);
  const [selectedGarmentForEdit, setSelectedGarmentForEdit] = useState<{
    id: string;
    epc: string;
    description: string;
    currentQuantity: number;
    serviceType?: string;
  } | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>('');

  // Calcular peso total de las prendas registradas
  const calculateTotalWeight = useCallback(() => {
    return registeredGarments.reduce((total, garment) => {
      return total + (garment.weight || 0);
    }, 0);
  }, [registeredGarments]);

  // Función para verificar si un RFID ya está registrado en el backend
  const checkRfidInBackend = useCallback(async (rfidCode: string) => {
    // Evitar llamadas duplicadas
    if (isCheckingRef.current) {
      return null;
    }
    
    isCheckingRef.current = true;
    setIsCheckingRfid(true);
    try {
      // Verificar token antes de hacer la petición
      const token = await AsyncStorage.getItem('auth-token');
      
      if (!token) {
        Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión');
        return null;
      }
      
      // Usar el mismo endpoint que useGarmentsByRfidCodes para obtener todos los campos
      try {
        const normalizedRfid = rfidCode.trim().toUpperCase();
        const response = await guidesApi.post<ApiResponse<any[]>>('/get-garment-by-rfid-codes', {
          rfid_codes: [normalizedRfid]
        });
        
        const garments = response.data?.data || [];
        
        if (garments.length > 0) {
          // Buscar la prenda con el RFID exacto (ya está normalizado)
          const foundGarment = garments.find((g: any) => {
            const normalizedFound = (g.rfid_code || '').trim().toUpperCase();
            return normalizedFound === normalizedRfid;
          });
          
          if (foundGarment) {
            return foundGarment; // Retorna la prenda si existe
          }
        }
        return null; // No existe
      } catch (error: any) {
        // Si falla, intentar con el endpoint anterior como fallback
      const response = await garmentsApi.get<any>('/get-all-garments', {
        params: { 
          search: rfidCode,
          limit: 100
        }
      });
      
      const garments = response.data?.data || [];
      
      if (garments.length > 0) {
        const normalizedScanned = rfidCode.trim().toUpperCase();
        const foundGarment = garments.find((g: any) => {
            const normalizedFound = (g.rfid_code || '').trim().toUpperCase();
          return normalizedFound === normalizedScanned;
        });
        
        if (foundGarment) {
            return foundGarment;
        }
      }
        return null;
      }
    } catch (error: any) {
      const errorStatus = error?.response?.status;
      
      // Error 404 es NORMAL cuando no existe la prenda
      if (errorStatus === 404) {
        return null; // No existe, es comportamiento esperado
      }
      
      // Error 401: Token expirado o inválido
      if (errorStatus === 401) {
        await AsyncStorage.multiRemove(['auth-token', 'auth-user']);
        Alert.alert(
          'Sesión expirada', 
          'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return null;
      }
      
      return null;
    } finally {
      isCheckingRef.current = false;
      setIsCheckingRfid(false);
    }
  }, [navigation]);

  const applyReaderPower = useCallback(async (power: number) => {
    try {
      await rfidModule.setPower(power);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo aplicar potencia al lector:', e);
    }
  }, []);

  useEffect(() => {
    applyReaderPower(currentRangeConfig.power);
  }, [currentRangeConfig.power, applyReaderPower]);

  // Cargar RFIDs iniciales cuando estamos en modo edición (solo una vez)
  useEffect(() => {
    // Solo cargar si:
    // 1. Estamos en modo edición
    // 2. Hay RFIDs para cargar
    // 3. NO se han cargado ya
    if (isEditMode && initialRfids.length > 0 && !initialRfidsLoaded) {
      // Limpiar tags previos
      clearScannedTags();
      seenSetRef.current.clear();
      
      // Usar setTimeout para asegurar que clearScannedTags terminó
      setTimeout(() => {
        // En modo edición NO poblar scannedTags; solo lista de registradas
        scannedTagsCountRef.current = 0;
        if (serviceType === 'personal') {
          const garments = initialRfids.map((rfid, index) => ({
            id: `edit-${rfid}`,
            rfidCode: rfid,
            description: `Prenda ${index + 1}`,
            category: undefined,
            color: undefined,
            weight: undefined,
          }));
          setRegisteredGarments(garments);
        }
        setInitialRfidsLoaded(true); // Marcar como cargados
      }, 100);
    }
  }, [isEditMode, initialRfids.length, initialRfidsLoaded, serviceType]); // Incluir serviceType

  // Ya no se requiere proceso ni descripción para este flujo

  const stopScanning = useCallback(async () => {
    try {
      if (!isScanningRef.current) return;
      setIsScanning(false);
      isScanningRef.current = false;
      await AsyncStorage.removeItem('pendingRfidScanUpdate');
      if ((global as any).rfidSubscription) {
        (global as any).rfidSubscription.remove();
        (global as any).rfidSubscription = null;
      }
      if ((global as any).rfidErrSubscription) {
        (global as any).rfidErrSubscription.remove();
        (global as any).rfidErrSubscription = null;
      }
      try {
        await rfidModule.stopScan();
      } catch (err) {
        if (__DEV__) {
          console.warn('Warning al detener escaneo (suppressible):', err);
        }
      }
    } catch (error: any) {
      const message = error?.message || '';
      if (typeof message === 'string' && message.includes('isScanningRef')) {
        return;
      }
      console.error('Error al detener escaneo:', error);
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      // Validación para modo GARMENT (sección PRENDAS): solo permitir escanear una prenda a la vez
      if (mode === 'garment' && scannedTagsCountRef.current > 0) {
        Alert.alert(
          'Limpie la lista', 
          'Debe limpiar la lista para escanear otra prenda. Solo puede registrar una prenda a la vez.'
        );
        return;
      }
      
      setIsScanning(true);
      isScanningRef.current = true;
      const subscription = rfidModule.addTagListener(async (tag: ScannedTag) => {
        if (!isScanningRef.current) return;
        // Filtro de RSSI mínimo
        if (typeof tag.rssi === 'number' && tag.rssi < MIN_RSSI) {
          return;
        }

        // En modo "guide" con servicio personal, lógica especial (con botones de registro)
        if (mode === 'guide' && serviceType === 'personal') {
          // PRIMERO: Verificar si ya está en la lista de registradas (duplicado local)
          if (isRfidCodeAlreadyRegistered(tag.epc)) {
            stopScanning();
            Alert.alert(
              'Prenda duplicada',
              'Esta prenda ya fue agregada a la guía',
              [{ text: 'OK' }]
            );
            return;
          }
          
          // SEGUNDO: Verificar si ya está siendo procesado (race condition)
          if (processingRfidsRef.current.has(tag.epc)) {
            return; // Ya se está procesando, ignorar
          }
          
          // TERCERO: Verificar deduplicación en seenSet
          if (seenSetRef.current.has(tag.epc)) {
            return;
          }
          
          seenSetRef.current.add(tag.epc);
          processingRfidsRef.current.add(tag.epc); // Marcar como procesando
          
          stopScanning();
          
          try {
            // CUARTO: Verificar si existe en el backend
            const existingGarmentData = await checkRfidInBackend(tag.epc);
            
            if (existingGarmentData) {
              // Si existe en BD, agregar directamente a la lista de registradas SIN alert
              const newGarment = {
                id: existingGarmentData.id,
                description: existingGarmentData.description || 'Sin descripción',
                rfidCode: tag.epc,
                color: existingGarmentData.color,
                weight: existingGarmentData.weight,
                quantity: existingGarmentData.quantity || 1,
              };
              
              // Verificar duplicados dentro del setState para evitar race conditions
              let wasDuplicate = false;
              setRegisteredGarments(prev => {
                // VERIFICACIÓN CRÍTICA: Si ya existe, no agregar
                const isDuplicate = prev.some(g => g.rfidCode === newGarment.rfidCode);
                if (isDuplicate) {
                  wasDuplicate = true;
                  return prev; // Retornar el estado anterior sin cambios
                }
                return [...prev, newGarment];
              });
              
              // Si fue duplicado, limpiar referencias y mostrar alert
              if (wasDuplicate) {
                seenSetRef.current.delete(tag.epc);
                processingRfidsRef.current.delete(tag.epc);
                setTimeout(() => {
                  Alert.alert(
                    'Prenda duplicada',
                    'Esta prenda ya fue agregada a la guía',
                    [{ text: 'OK' }]
                  );
                }, 100);
              }
              
              // NO agregar a scannedTags
              // La prenda se agregó silenciosamente y está lista para el siguiente escaneo
            } else {
              // Si NO existe en BD, agregar a scannedTags y mostrar botón de registro
              addScannedTag(tag);
              setShowActionButtons(true);
            }
          } finally {
            // Remover de processingRfids después de completar
            processingRfidsRef.current.delete(tag.epc);
          }
          return;
        }

        // En modo "process" con servicio personal, lógica especial (solo visualización, sin botones)
        if (mode === 'process' && serviceType === 'personal') {
          // PRIMERO: Verificar si ya está siendo procesado (race condition)
          if (processingRfidsRef.current.has(tag.epc)) {
            return; // Ya se está procesando, ignorar
          }
          
          // SEGUNDO: Verificar deduplicación en seenSet
          if (seenSetRef.current.has(tag.epc)) {
            return;
          }
          
          seenSetRef.current.add(tag.epc);
          processingRfidsRef.current.add(tag.epc); // Marcar como procesando
          
          stopScanning();
          
          try {
            // TERCERO: Verificar si existe en el backend
            const existingGarmentData = await checkRfidInBackend(tag.epc);
            
            // SIEMPRE agregar a scannedTags para mostrarlo en la lista
            addScannedTag(tag);
            
            if (existingGarmentData) {
              // Si existe en BD, también agregar a registeredGarments para mostrar datos
              const newGarment = {
                id: existingGarmentData.id,
                description: existingGarmentData.description || 'Sin descripción',
                rfidCode: tag.epc,
                color: existingGarmentData.color,
                weight: existingGarmentData.weight,
                quantity: existingGarmentData.quantity || 1,
              };
              
              // Verificar duplicados dentro del setState para evitar race conditions
              setRegisteredGarments(prev => {
                const isDuplicate = prev.some(g => g.rfidCode === newGarment.rfidCode);
                if (isDuplicate) {
                  return prev; // Retornar el estado anterior sin cambios
                }
                return [...prev, newGarment];
              });
            }
            // Si NO existe, solo queda en scannedTags y se mostrará como "Prenda no registrada"
          } finally {
            // Remover de processingRfids después de completar
            processingRfidsRef.current.delete(tag.epc);
          }
          return;
        }
        
        // Para otros modos: Deduplicación por EPC en memoria
        if (seenSetRef.current.has(tag.epc)) return;
        seenSetRef.current.add(tag.epc);
        addScannedTag(tag);
        
        // En modo "garment", detener automáticamente después de escanear una prenda
        if (mode === 'garment') {
          stopScanning();
        }
        // En modo "guide" industrial y "process", permitir escaneo continuo de múltiples prendas
      });
      (global as any).rfidSubscription = subscription;
      const errSub = rfidModule.addErrorListener((msg: string) => {
        console.warn('RFID error:', msg);
      });
      (global as any).rfidErrSubscription = errSub;
      await rfidModule.startScan();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el escaneo RFID');
      setIsScanning(false);
    }
  }, [
    addScannedTag,
    setIsScanning,
    stopScanning,
    mode,
    serviceType,
    checkRfidInBackend,
    isRfidCodeAlreadyRegistered,
    MIN_RSSI,
    currentRangeConfig.label,
    currentRangeConfig.power,
    scanRangeKey,
  ]);

  const handleGoBack = useCallback(() => {
    stopScanning();
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    }
  }, [navigation, stopScanning]);

  useEffect(() => {
    startScanningFnRef.current = startScanning;
  }, [startScanning]);

  useEffect(() => {
    stopScanningFnRef.current = stopScanning;
  }, [stopScanning]);

  useEffect(() => {
    clearScannedTags();
    seenSetRef.current.clear();
    processingRfidsRef.current.clear();

    // Suscribir al gatillo hardware del C72
    const emitter = new NativeEventEmitter();
    const subDown = emitter.addListener('hwTriggerDown', () => {
      if (!isScanningRef.current) {
        startScanningFnRef.current?.();
      }
    });
    const subUp = emitter.addListener('hwTriggerUp', () => {
      if (isScanningRef.current) {
        stopScanningFnRef.current?.();
      }
    });

    // Log de depuración para identificar keyCode del gatillo
    // Manejar botón físico keyCode=293 (C72) vía eventos genéricos si están disponibles
    const subKey = emitter.addListener('hwKey', (payload: any) => {
      if (payload?.keyCode === 293) {
        if (payload.action === 0 && !isScanningRef.current) startScanningFnRef.current?.();
        if (payload.action === 1 && isScanningRef.current) stopScanningFnRef.current?.();
      }
    });

    return () => {
      stopScanning();
      subDown.remove();
      subUp.remove();
      subKey.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinueToGuides = async () => {
    stopScanning();
    if (scannedTags.length === 0) {
      Alert.alert('Sin lecturas', 'Escanea al menos una prenda para continuar.');
      return;
    }
    
    if (mode === 'garment') {
      // Llamar a handleRegisterGarment que ya hace la verificación
      await handleRegisterGarment();
    } else if (mode === 'guide') {
      if (serviceType === 'personal') {
        // Flujo personal: verificar y abrir formulario
        await handleRegisterGarment();
      } else {
        // Flujo industrial: abrir formulario de guía
        setPendingGuideEdit(undefined);
        setGuideModalOpen(true);
      }
    } else if (mode === 'process') {
      const processType = route?.params?.processType;
      const guideId = route?.params?.guideId;
      const rfidScanId = route?.params?.rfidScanId;
      
      // Procesos especiales que siempre van a validación (incluso si tienen rfidScanId)
      if (processType === 'PACKAGING' || processType === 'LOADING' || processType === 'DELIVERY') {
        // Para EMPAQUE, CARGA y ENTREGA, ir siempre a la página de validación
        navigation.navigate('GarmentValidation', {
          guideId: guideId || selectedGuideId,
          processType: processType,
          scannedTags: scannedTags.map(tag => tag.epc),
          serviceType: serviceType,
        });
      } else if (processType && rfidScanId && guideId) {
        // Procesos con escaneo opcional u obligatorio: abrir ScanForm para actualizar RFID scan
        const processesWithScan = ['WASHING', 'DRYING', 'IRONING', 'FOLDING', 'IN_PROCESS', 'SHIPPING'];
        if (processesWithScan.includes(processType)) {
          setScanFormContext({
            origin: 'process',
            guideId,
            rfidScanId,
            processType,
            scannedTags: scannedTags.map(tag => tag.epc),
            deferRfidScanUpdate: true,
            unregisteredCodes: unregisteredRfids,
            serviceType: serviceType,
          });
        } else {
          // Para otros procesos, abrir el ProcessForm
          setProcessModalOpen(true);
        }
      } else {
        // Para otros procesos, abrir el ProcessForm
        setProcessModalOpen(true);
      }
    }
  };

  const handleCloseGuideModal = () => {
    setGuideModalOpen(false);
    clearAllScannedData(); // Esta función ya limpia registeredGarments
  };

  const handleCloseGarmentModal = () => {
    setGarmentModalOpen(false);
    setExistingGarment(null);
    // Limpiar el último tag para permitir re-escaneo
    if (scannedTags.length > 0) {
      const lastTag = scannedTags[scannedTags.length - 1];
      seenSetRef.current.delete(lastTag.epc);
      processingRfidsRef.current.delete(lastTag.epc);
    }
    clearAllScannedData();
    // Permanecer en la página de escaneo para registrar otra prenda
  };

  // Funciones para el flujo de servicio personal
  const handleRegisterGarment = async () => {
    if (scannedTags.length === 0) {
      return;
    }
    
    // Evitar llamadas múltiples
    if (garmentModalOpen) {
      return;
    }
    
    const currentTag = scannedTags[scannedTags.length - 1];
    
    // PRIMERO: Intentar obtener desde el hook useGarmentsByRfidCodes (si está disponible)
    let existingGarmentData = getGarmentByRfid(currentTag.epc);
    
    // Si no se encontró en el hook, hacer búsqueda directa en el backend
    if (!existingGarmentData) {
      existingGarmentData = await checkRfidInBackend(currentTag.epc);
    }
    
    if (existingGarmentData) {
      // Si existe, abrir directamente el formulario de actualización
      setExistingGarment(existingGarmentData);
      setShowActionButtons(false);
      setGarmentModalOpen(true);
    } else {
      // Si no existe, abrir modal para crear
      setExistingGarment(null);
      setShowActionButtons(false);
      setGarmentModalOpen(true);
    }
  };

  const handleGarmentSubmit = async (garmentData: any) => {
    if (scannedTags.length > 0) {
      const currentTag = scannedTags[scannedTags.length - 1];
      
      try {
        let savedGarmentId = existingGarment?.id;
        
        if (existingGarment) {
          // Actualizar prenda existente con todos los campos
          await updateGarmentAsync({
            id: existingGarment.id,
            data: {
              description: garmentData.description,
              color: garmentData.colors || [], // Array de colores
              garment_type: garmentData.garmentType,
              garment_brand: garmentData.brand, // garment_brand en lugar de brand
              garment_condition: garmentData.garmentCondition,
              physical_condition: garmentData.physicalCondition,
              weight: garmentData.weight ? parseFloat(garmentData.weight.toString()) : undefined,
              quantity: garmentData.quantity ? parseInt(String(garmentData.quantity)) : undefined,
              observations: garmentData.observations,
              service_type: garmentData.serviceType,
              manufacturing_date: garmentData.manufacturingDate,
            } as any // Usar 'as any' temporalmente hasta que se actualice el tipo UpdateGarmentDto
          });
          Alert.alert('Prenda actualizada', `${garmentData.description} actualizada y agregada a la guía`);
        } else {
          // Crear nueva prenda con todos los campos
          const newGarmentResponse = await createGarmentAsync({
            rfid_code: currentTag.epc,
            branch_offices_id: garmentData.branchOfficeId, // Requerido para crear
            description: garmentData.description,
            color: garmentData.colors || [], // Array de colores
            garment_type: garmentData.garmentType,
            garment_brand: garmentData.brand, // garment_brand en lugar de brand
            garment_condition: garmentData.garmentCondition,
            physical_condition: garmentData.physicalCondition,
            weight: garmentData.weight ? parseFloat(garmentData.weight.toString()) : undefined,
            quantity: garmentData.quantity ? parseInt(String(garmentData.quantity)) : undefined,
            observations: garmentData.observations,
            service_type: garmentData.serviceType,
            manufacturing_date: garmentData.manufacturingDate,
          } as any); // Usar 'as any' temporalmente hasta que se actualice el tipo CreateGarmentDto
          savedGarmentId = newGarmentResponse.id;
          Alert.alert('Prenda registrada', `${garmentData.description} registrada y agregada a la guía`);
        }
        
        const newGarment = {
          id: savedGarmentId || `garment-${Date.now()}`,
          description: garmentData.description || 'Sin descripción',
          rfidCode: currentTag.epc,
          category: garmentData.category,
          color: garmentData.color,
          weight: garmentData.weight,
          quantity: garmentData.quantity || 1,
        };
        
        // Verificar duplicados dentro del setState para evitar race conditions
        setRegisteredGarments(prev => {
          const isDuplicate = prev.some(g => g.rfidCode === newGarment.rfidCode);
          if (isDuplicate) {
            return prev; // No agregar si ya existe
          }
          return [...prev, newGarment];
        });
        
        setGarmentModalOpen(false);
        setExistingGarment(null);
        
        // Limpiar del processingRfids antes de limpiar todo
        processingRfidsRef.current.delete(currentTag.epc);
        clearAllScannedData();
        
        // Continuar en la página de escaneo, listo para escanear otra prenda
      } catch (error: any) {
        // Verificar si es un error de código RFID duplicado
        const errorMessage = error?.response?.data?.message || error?.message || '';
        const errorString = JSON.stringify(error?.response?.data || error || '').toLowerCase();
        const statusCode = error?.response?.status;
        
        // Detectar errores relacionados con código RFID duplicado
        // El error puede venir como "Error al agregar prendas a guía" cuando Prisma falla por restricción única
        const isDuplicateError = 
          statusCode === 400 && (
            errorString.includes('unique') ||
            errorString.includes('duplicate') ||
            errorString.includes('duplicado') ||
            errorString.includes('ya existe') ||
            errorString.includes('already exists') ||
            errorString.includes('violates unique constraint') ||
            errorString.includes('error al agregar prendas a guía') ||
            errorMessage.toLowerCase().includes('error al agregar prendas a guía')
          );
        
        if (isDuplicateError) {
          Alert.alert(
            'Código RFID ya registrado',
            'Este código RFID ya está registrado en otra sucursal. Cada código RFID debe ser único en todo el sistema.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'No se pudo guardar la prenda. Por favor, intenta de nuevo.');
        }
        
        // Limpiar del processingRfids incluso si hay error
        processingRfidsRef.current.delete(currentTag.epc);
        clearAllScannedData();
      }
    }
  };

  const handleContinueToGuideForm = () => {
    setShowActionButtons(false);
    // Convertir prendas registradas a tags y abrir formulario de guía
    const garmentTags = registeredGarments.map(g => ({ epc: g.rfidCode, rssi: -50, timestamp: Date.now() }));
    // Agregar los tags al store
    // NO limpiar registeredGarments aquí porque se necesita para calcular el peso
    clearScannedTags();
    seenSetRef.current.clear();
    processingRfidsRef.current.clear();
    setShowActionButtons(false);
    // Agregar tags sin limpiar registeredGarments
    garmentTags.forEach(tag => addScannedTag(tag));
    setGuideModalOpen(true);
  };

  const removeRegisteredGarment = (garmentId: string) => {
    const garment = registeredGarments.find(g => g.id === garmentId);
    if (garment) {
      // Remover del seenSet y processingRfids para permitir re-escaneo
      seenSetRef.current.delete(garment.rfidCode);
      processingRfidsRef.current.delete(garment.rfidCode);
    }
    setRegisteredGarments(prev => prev.filter(g => g.id !== garmentId));
  };

  // Función para obtener la prenda existente por código RFID
  const getExistingGarmentByRfid = (rfidCode: string) => {
    return registeredGarments.find(garment => garment.rfidCode === rfidCode);
  };

  // Función para limpiar completamente todos los estados
  const clearAllScannedData = useCallback(() => {
    clearScannedTags();
    seenSetRef.current.clear();
    processingRfidsRef.current.clear();
    scannedTagsCountRef.current = 0; // Resetear el contador
    setShowActionButtons(false);
    setRegisteredGarments([]); // Limpiar prendas registradas en servicio personal
    setPendingGuideEdit(undefined);
    setGuideDraftData(undefined);
    setGuideDraftValues(undefined);
  }, [clearScannedTags]);

  const handleSelectRange = (key: ScanRangeKey) => {
    setScanRangeKey(key);
    setIsRangeModalOpen(false);
  };

  // Función para manejar la edición de prenda existente
  const handleEditExistingGarment = () => {
    if (scannedTags.length > 0) {
      const currentTag = scannedTags[scannedTags.length - 1];
      const existingGarment = getExistingGarmentByRfid(currentTag.epc);
      
      if (existingGarment) {
        // Pre-llenar el formulario con los datos existentes
        setGarmentModalOpen(true);
        // Aquí podrías pasar los datos existentes al formulario
      }
    }
  };

  // Función para actualizar una prenda existente
  const handleUpdateExistingGarment = async (updatedGarmentData: any) => {
    if (scannedTags.length > 0) {
      const currentTag = scannedTags[scannedTags.length - 1];
      const existingGarment = getExistingGarmentByRfid(currentTag.epc);
      
      if (existingGarment) {
        // Actualizar la prenda en el backend
        try {
          const token = await AsyncStorage.getItem('auth-token');
          if (!token) {
            Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión');
            return;
          }

          await updateGarmentAsync({
            id: existingGarment.id,
            data: {
              description: updatedGarmentData.description,
              color: updatedGarmentData.colors || [],
              garment_type: updatedGarmentData.garmentType,
              garment_brand: updatedGarmentData.brand,
              garment_condition: updatedGarmentData.garmentCondition,
              physical_condition: updatedGarmentData.physicalCondition,
              weight: updatedGarmentData.weight ? parseFloat(updatedGarmentData.weight.toString()) : undefined,
              quantity: updatedGarmentData.quantity ? parseInt(String(updatedGarmentData.quantity)) : undefined,
              observations: updatedGarmentData.observations,
              service_type: updatedGarmentData.serviceType,
              manufacturing_date: updatedGarmentData.manufacturingDate,
            } as any // Usar 'as any' temporalmente hasta que se actualice el tipo UpdateGarmentDto para incluir quantity
          });
          Alert.alert('Prenda actualizada', `${updatedGarmentData.description} actualizada y agregada a la guía`);
        } catch (error: any) {
          console.error('Error al actualizar prenda:', error);
          Alert.alert('Error', 'No se pudo actualizar la prenda. Intente nuevamente.');
          return;
        }

        // Actualizar la prenda en el estado local
        const updatedGarment = {
          ...existingGarment,
          description: updatedGarmentData.description || existingGarment.description,
          category: updatedGarmentData.category || existingGarment.category,
          color: updatedGarmentData.color || existingGarment.color,
          quantity: updatedGarmentData.quantity || existingGarment.quantity || 1,
        };
        
        setRegisteredGarments(prev => 
          prev.map(g => g.id === existingGarment.id ? updatedGarment : g)
        );
        setGarmentModalOpen(false);
        clearScannedTags();
      }
    }
  };

  // Funciones para manejar la selección de procesos
  const handleProcessTypeSelect = (processType: string) => {
    setSelectedProcessType(processType);
    setProcessTypeModalOpen(false);
    
    // Para todos los procesos, mostrar modal de selección de guías
    setGuideSelectionModalOpen(true);
  };

  const handleGuideSelect = (guideId: string) => {
    setSelectedGuideId(guideId);
    setGuideSelectionModalOpen(false);
    
    // Navegar al escáner con la guía seleccionada
    navigation.navigate('ScanClothes', { 
      mode: 'process', 
      guideId: guideId,
      processType: selectedProcessType 
    });
  };

  const renderScannedTag = ({ item, index }: { item: ScannedTag; index: number }) => {
    // En modo garment, servicio industrial, o process (cualquier serviceType), verificar si la prenda está registrada
    const shouldCheckGarment = mode === 'garment' || serviceType === 'industrial' || mode === 'process';
    let garment = shouldCheckGarment ? getGarmentByRfid(item.epc) : null;
    
    // En modo process personal, también buscar en registeredGarments
    if (mode === 'process' && serviceType === 'personal' && !garment) {
      const registeredGarment = registeredGarments.find(g => g.rfidCode === item.epc);
      if (registeredGarment) {
        // Convertir registeredGarment al formato de garment para compatibilidad
        garment = {
          id: registeredGarment.id,
          rfid_code: registeredGarment.rfidCode,
          description: registeredGarment.description,
          garment_type: registeredGarment.category,
          weight: registeredGarment.weight,
          quantity: registeredGarment.quantity || 1,
        } as any;
      }
    }
    
    const isRegistered = !!garment;
    const weight = garment?.weight ?? 0;
    // Obtener la cantidad de la prenda para servicio personal
    const quantity = (serviceType === 'personal' && garment) ? (garment.quantity || 1) : null;
    
    // Función para eliminar una prenda específica de la lista
    const handleRemoveTag = () => {
      const updatedTags = scannedTags.filter(tag => tag.epc !== item.epc);
      clearScannedTags();
      updatedTags.forEach(tag => addScannedTag(tag));
      seenSetRef.current.delete(item.epc);
      scannedTagsCountRef.current = updatedTags.length;
      
      // En modo process personal, también eliminar de registeredGarments si está ahí
      if (mode === 'process' && serviceType === 'personal') {
        setRegisteredGarments(prev => prev.filter(g => g.rfidCode !== item.epc));
      }
    };
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          // Solo permitir editar cantidad si: serviceType === 'industrial' y (mode === 'guide' o mode === 'process')
          if (isRegistered && garment?.id && serviceType === 'industrial' && (mode === 'guide' || mode === 'process')) {
            handleOpenQuantityEdit(item.epc);
          }
        }}
        disabled={!isRegistered || !garment?.id || !(serviceType === 'industrial' && (mode === 'guide' || mode === 'process'))}
      >
        <Card variant="outlined" className="mb-2">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <View className="flex-row items-center">
                <View 
                  className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                    mode === 'garment'
                      ? (isRegistered ? 'bg-green-500' : 'bg-orange-500')
                      : (serviceType === 'industrial'
                          ? (isRegistered ? 'bg-green-500' : 'bg-orange-500')
                          : serviceType === 'personal'
                            ? (isRegistered ? 'bg-green-500' : 'bg-orange-500')
                            : 'bg-primary-DEFAULT')
                  }`}
                >
                  {serviceType === 'personal' && quantity !== null ? (
                    <Text className="text-white font-bold text-sm">{quantity}</Text>
                  ) : mode !== 'garment' ? (
                    <Text className="text-white font-bold">{index + 1}</Text>
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-mono text-gray-900">{item.epc}</Text>
                  {(serviceType === 'industrial' || mode === 'garment' || mode === 'process') && (
                    <Text className={`text-xs mt-1 ${isRegistered ? 'text-gray-600' : 'text-orange-600 font-medium'}`}>
                      {isRegistered ? garment?.description || garment?.garment_type || 'Sin nombre' : 'Prenda no registrada'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Peso registrado a la derecha (si existe) */}
            {(serviceType === 'industrial' || mode === 'garment' || mode === 'process') && weight > 0 && (
              <View className="items-end ml-3">
                <Text className="text-xs text-gray-500">Peso</Text>
                <View className="flex-row items-center mt-1">
                  <Icon name="scale-outline" size={14} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-1">
                    {weight} lb
                  </Text>
                </View>
              </View>
            )}
            
            {/* Botón X para eliminar prenda (servicio industrial y modo garment/process, incluyendo process personal) */}
            {(serviceType === 'industrial' || mode === 'garment' || mode === 'process') && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveTag();
                }} 
                className="ml-2"
              >
                <Icon name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
            
            {/* Checkmark solo para modos que no tienen botón X */}
            {serviceType !== 'industrial' && mode !== 'garment' && mode !== 'process' && (
              <Icon name="checkmark-circle" size={24} color="#10B981" />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Función para abrir modal de edición de cantidad
  const handleOpenQuantityEdit = (epc: string) => {
    const garment = getGarmentByRfid(epc);
    if (!garment || !garment.id) {
      Alert.alert('Error', 'No se pudo encontrar la prenda para editar.');
      return;
    }
    
    setSelectedGarmentForEdit({
      id: garment.id,
      epc: garment.rfid_code || epc,
      description: garment.description || garment.garment_type || 'Sin descripción',
      currentQuantity: garment.quantity || 1,
      serviceType: garment.service_type,
    });
    setEditingQuantity(String(garment.quantity || 1));
    setQuantityEditModalOpen(true);
  };

  // Función para confirmar actualización de cantidad
  const handleConfirmQuantityUpdate = async () => {
    if (!selectedGarmentForEdit) return;
    
    const quantityNum = parseInt(editingQuantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0.');
      return;
    }

    try {
      await updateGarmentAsync({
        id: selectedGarmentForEdit.id,
        data: {
          quantity: quantityNum,
        } as any,
      });

      // Invalidar queries para recargar datos
      queryClient.invalidateQueries({ queryKey: ['garments'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['garment'], exact: false });
      
      // Recargar prendas por RFID
      if (shouldCheckGarments && rfidCodes.length > 0) {
        // Forzar refetch de las prendas
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ['garments-by-rfid-codes'],
            exact: false 
          });
        }, 300);
      }

      // Si el modal de detalles está abierto, actualizar el grupo seleccionado
      if (scanDetailsModalOpen && selectedScanGroup) {
        const updatedItems = selectedScanGroup.items.map(item => {
          if (item.epc === selectedGarmentForEdit.epc) {
            return { ...item, quantity: quantityNum };
          }
          return item;
        });
        setSelectedScanGroup({
          ...selectedScanGroup,
          items: updatedItems,
        });
      }

      Alert.alert('Éxito', 'Cantidad actualizada correctamente.');
      setQuantityEditModalOpen(false);
      setSelectedGarmentForEdit(null);
      setEditingQuantity('');
    } catch (error: any) {
      console.error('Error al actualizar cantidad:', error);
      Alert.alert('Error', 'No se pudo actualizar la cantidad. Intente nuevamente.');
    }
  };

  // Función para abrir modal de detalles de escaneo por tipo de prenda
  const handleOpenScanDetails = (
    item: { garmentType: string; count: number; totalWeight: number; tags: ScannedTag[] },
    title: string,
    isUnregistered: boolean,
  ) => {
    const detailedItems = item.tags.map(tag => {
      const garment = getGarmentByRfid(tag.epc);
      const quantity =
        !garment || isUnregistered
          ? 1
          : garment.quantity && garment.quantity > 0
          ? garment.quantity
          : 1;
      const weight = garment?.weight;

      return {
        epc: tag.epc,
        description: garment
          ? garment.description || garment.garment_type || title
          : (isUnregistered ? 'Prenda no registrada' : title),
        quantity,
        weight,
      };
    });

    setSelectedScanGroup({
      title,
      items: detailedItems,
    });
    setScanDetailsModalOpen(true);
  };

  // Función para renderizar grupos de prendas por tipo (solo servicio industrial)
  const renderGarmentTypeGroup = ({ item }: { item: { garmentType: string; count: number; totalWeight: number; tags: ScannedTag[] } }) => {
    const isUnregistered = item.garmentType === 'UNREGISTERED';
    
    // Función para eliminar todos los tags de este grupo
    const handleRemoveGroup = () => {
      const tagEpcSet = new Set(item.tags.map(tag => tag.epc));
      const updatedTags = scannedTags.filter(tag => !tagEpcSet.has(tag.epc));
      clearScannedTags();
      updatedTags.forEach(tag => {
        addScannedTag(tag);
        seenSetRef.current.add(tag.epc);
      });
      item.tags.forEach(tag => seenSetRef.current.delete(tag.epc));
      scannedTagsCountRef.current = updatedTags.length;
    };

    // Obtener el nombre del tipo de prenda (traducido o el código)
    const getGarmentTypeLabel = () => {
      if (isUnregistered) {
        return 'Prendas no registradas';
      }
      if (item.garmentType === 'REGISTERED') {
        return 'Prendas registradas';
      }
      const normalizedCode = item.garmentType
        ? item.garmentType.trim().toUpperCase().replace(/[\s-]/g, '_')
        : '';
      if (normalizedCode) {
        const catalogLabel = garmentTypeLabelMap.get(normalizedCode);
        if (catalogLabel) {
          return catalogLabel;
        }
      }
      if (item.garmentType) {
        const catalogLabelOriginal = garmentTypeLabelMap.get(item.garmentType);
        if (catalogLabelOriginal) {
          return catalogLabelOriginal;
        }
      }
      // Mostrar el garment_type directamente (se puede mejorar con traducciones si es necesario)
      // Formatear el nombre: convertir "CAMISETA" a "Camisetas" o mantener el formato original
      const typeName = item.garmentType;
      // Si está en mayúsculas, convertir a título con plural
      if (typeName === typeName.toUpperCase()) {
        return typeName.charAt(0) + typeName.slice(1).toLowerCase() + (item.count > 1 ? 's' : '');
      }
      return typeName;
    };

    const groupLabel = getGarmentTypeLabel();

    return (
      <Card variant="outlined" className="mb-2">
        <View className="flex-row justify-between items-center">
          {/* Zona clickable para abrir detalles */}
          <TouchableOpacity
            className="flex-1"
            activeOpacity={0.8}
            onPress={() => handleOpenScanDetails(item, groupLabel, isUnregistered)}
          >
            <View className="flex-row items-center">
              <View 
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isUnregistered ? 'bg-orange-500' : 'bg-green-500'
                }`}
              >
                <Text className="text-white font-bold text-sm">{item.count}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  {groupLabel}
                </Text>
                {isUnregistered && (
                  <Text className="text-xs text-orange-600 font-medium mt-1">
                    Estas prendas necesitan ser registradas
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Peso total del grupo y botón X */}
          <View className="items-end ml-2">
            {item.totalWeight > 0 && (
              <View className="flex-row items-center mb-1">
                <Icon name="scale-outline" size={14} color="#4B5563" />
                <Text className="text-xs text-gray-800 ml-1">
                  {item.totalWeight.toFixed(2)} lb
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={handleRemoveGroup}>
              <Icon name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  const handleGuideFormCancel = () => {
    setGuideModalOpen(false);
  };

  const handleGuideFormSubmit = (result?: { guideData: any; guide?: any; draftValues: any }) => {
    if (!result?.guideData) {
      setGuideModalOpen(false);
      return;
    }

    setGuideDraftData(result.guideData);
    setGuideDraftValues(result.draftValues);
    setPendingGuideEdit(result.guide);
    if (result.guideData.client_id) {
      setSelectedClientId(result.guideData.client_id);
    }
    setGuideModalOpen(false);

    // Para ambos servicios (INDUSTRIAL y PERSONAL), abrir ScanForm
    // En ScanForm se crea primero la guía y luego el escaneo RFID
    const scannedRfidCodes = serviceType === 'personal' 
      ? registeredGarments.map(g => g.rfidCode)
      : scannedTags.map(tag => tag.epc);

    // Para servicio personal, las prendas ya están registradas (en registeredGarments)
    // Por lo tanto, NO hay códigos no registrados - debe ser igual al servicio industrial
    // En servicio industrial, unregisteredRfids se calcula desde scannedTags
    // En servicio personal, todas las prendas están registradas, así que pasamos array vacío
    const unregisteredCodesForForm = serviceType === 'personal' 
      ? [] // En servicio personal, todas las prendas ya están registradas
      : unregisteredRfids; // En servicio industrial, usar los códigos no registrados calculados

    setScanFormContext({
      origin: 'guide',
      guideId: result.guide?.id,
      guide: result.guide,
      guideData: result.guideData,
      draftValues: result.draftValues,
      scannedTags: scannedRfidCodes,
      initialScanType: 'COLLECTED',
      unregisteredCodes: unregisteredCodesForForm,
      serviceType: serviceType,
    });
  };

  const handleScanFormSuccess = async (context: ScanFormContext, result?: any) => {
    if (context.origin === 'process') {
      const updatePayload = result?.rfidScanUpdateData || result;
      
      // Obtener datos de la guía para el formulario de proceso
      try {
        const { data } = await guidesApi.get<ApiResponse<any>>(`/get-guide/${context.guideId}`);
        const guide = data.data;
        const { user } = useAuthStore.getState();
        const branchOfficeId = user?.branch_office_id || user?.sucursalId || guide?.branch_office_id || guide?.branch_offices_id || '';
        const branchOfficeName = guide?.branch_office?.name || guide?.branch_office_name || 'Sucursal';
        
        // Configurar datos para el formulario de proceso
        setWashingProcessFormData({
          guideId: context.guideId || '',
          guideNumber: guide?.guide_number || '',
          branchOfficeId: branchOfficeId,
          branchOfficeName: branchOfficeName,
          processType: context.processType || '',
          rfidScanId: context.rfidScanId,
          rfidScanUpdateData: updatePayload,
        });
        
        // Cerrar ScanForm y abrir WashingProcessForm
        setScanFormContext(null);
        setWashingProcessFormOpen(true);
      } catch (error: any) {
        console.error('Error al obtener datos de la guía:', error);
        Alert.alert('Error', 'No se pudieron obtener los datos de la guía. Intente nuevamente.');
        setScanFormContext(null);
      }
      return;
    }

    // Flujo de guía
    const guideNumber = result?.createdGuide?.guide_number || context.guide?.guide_number;
    setScanFormContext(null);
    setPendingGuideEdit(undefined);
    setGuideDraftData(undefined);
    setGuideDraftValues(undefined);
    clearAllScannedData();
    
    // Forzar refetch de las guías para procesos después de crear el escaneo RFID
    // Esto asegura que la lista se actualice inmediatamente
    if (selectedProcessType) {
      // Pequeño delay para asegurar que el backend haya procesado el escaneo
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['guides'], exact: false });
        refetchGuidesForProcess();
      }, 500);
    }
    
    Alert.alert(
      'Registro completado',
      guideNumber
        ? `La guía ${guideNumber} y el escaneo RFID se registraron correctamente.`
        : 'La guía y el escaneo RFID se registraron correctamente.',
    );
  };

  const handleScanFormCancel = (context: ScanFormContext) => {
    setScanFormContext(null);

    if (context.origin === 'guide') {
      setPendingGuideEdit(context.guide);
      if (context.guide?.client_id) {
        setSelectedClientId(context.guide.client_id);
      } else if (context.guideData?.client_id) {
        setSelectedClientId(context.guideData.client_id);
      }
      if (context.guideData) {
        setGuideDraftData(context.guideData);
      }
      if (context.draftValues) {
        setGuideDraftValues(context.draftValues);
      }
      setGuideModalOpen(true);
    }
  };

  return (
    <Container safe>
      <View className="flex-row items-center mb-6">
        <TouchableOpacity
          onPress={handleGoBack}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          activeOpacity={0.8}
        >
          <Icon name="arrow-back-outline" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-3">
          {isEditMode 
            ? 'EDITAR PRENDAS DE GUÍA'
            : mode === 'process'
              ? 'ESCANEO DE PROCESO'
              : mode === 'guide' && serviceType === 'personal' 
                ? 'REGISTRAR PRENDA' 
                : 'ESCANEAR PRENDAS'}
        </Text>
      </View>

      <View className="mb-6">
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Button
              title="Escanear"
              onPress={startScanning}
              icon={<Icon name="play-outline" size={18} color="white" />}
              size="sm"
              disabled={isScanning}
              style={{ backgroundColor: '#0b1f36' }}
            />
          </View>
          <View className="flex-1">
            <Button
              title={`Alcance: ${currentRangeConfig.label}`}
              onPress={() => setIsRangeModalOpen(true)}
              variant="outline"
              size="sm"
              icon={<Icon name="options-outline" size={16} color="#0b1f36" />}
            />
          </View>
        </View>

        {isScanning && (
          <View className="mt-3 space-y-3">
            <Button
              title="Detener Escaneo"
              onPress={stopScanning}
              variant="danger"
              icon={<Icon name="stop-outline" size={16} color="white" />}
              fullWidth
              size="sm"
              isLoading={isStopping}
            />

            <View className="bg-primary-DEFAULT/10 border border-primary-DEFAULT/20 rounded-lg px-3 py-2">
              <View className="flex-row items-center justify-center">
                <Icon name="radio-outline" size={16} color="#3B82F6" />
                <Text className="text-primary-DEFAULT font-semibold ml-2 text-sm">
                  Escaneando con potencia {currentRangeConfig.power} dBm
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Sección de proceso/descrición eliminada para flujo simplificado */}

      <View className="flex-1 mb-6">
        {mode === 'guide' && serviceType === 'personal' ? (
          <>
            {/* Sección de Código Escaneado (temporal) - Solo en modo creación */}
            {!isEditMode && scannedTags.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-900">
                    Código Escaneado
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      // Solo limpiar el código escaneado, NO las prendas registradas
                      clearScannedTags();
                      seenSetRef.current.clear();
                      scannedTagsCountRef.current = 0;
                      setShowActionButtons(false);
                    }}
                    className="flex-row items-center bg-red-50 px-3 py-1 rounded-lg"
                  >
                    <Icon name="close-circle-outline" size={16} color="#EF4444" />
                    <Text className="text-red-600 text-sm font-medium ml-1">Quitar</Text>
                  </TouchableOpacity>
                </View>
                <Card variant="outlined" className="bg-yellow-50">
                  <View className="flex-row items-center">
                    <View className="bg-yellow-500 w-10 h-10 rounded-full items-center justify-center mr-3">
                      <Icon name="scan-outline" size={20} color="#ffffff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">Tag detectado</Text>
                      <Text className="text-sm text-gray-600 mt-1 font-mono">{scannedTags[scannedTags.length - 1]?.epc}</Text>
                    </View>
                    <Icon name="alert-circle-outline" size={24} color="#F59E0B" />
                  </View>
                </Card>
              </View>
            )}

            {/* Sección de Prendas Registradas */}
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Prendas Registradas ({registeredGarments.length})
              </Text>

              {registeredGarments.length === 0 && scannedTags.length === 0 ? (
                <EmptyState
                  icon="scan-outline"
                  title="No hay prendas registradas"
                  message="Escanea y registra prendas para crear la guía"
                />
              ) : registeredGarments.length === 0 ? (
                <EmptyState
                  icon="shirt-outline"
                  title="Sin prendas registradas aún"
                  message="Presiona 'Registrar Prenda' para agregar el tag detectado"
                />
              ) : (
                <FlatList
                  data={registeredGarments}
                  renderItem={({ item, index }) => {
                    // Obtener la cantidad de la prenda, o usar 1 si no está definida
                    const quantity = item.quantity || 1;
                    return (
                      <Card variant="outlined" className="mb-2">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <View className="bg-green-500 w-10 h-10 rounded-full items-center justify-center mr-3">
                                <Text className="text-white font-bold text-sm">{quantity}</Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-900">{item.description}</Text>
                                <Text className="text-xs text-gray-500 mt-1 font-mono">RFID: {item.rfidCode}</Text>
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => removeRegisteredGarment(item.id)} className="ml-2">
                            <Icon name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </Card>
                    );
                  }}
                  keyExtractor={item => item.rfidCode}
                />
              )}
            </View>
          </>
        ) : (
          <>
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Prendas Escaneadas ({scannedTags.length})
            </Text>

            {scannedTags.length === 0 ? (
              <EmptyState
                icon="scan-outline"
                title="No hay prendas escaneadas"
                message="Inicia el escaneo para detectar tags RFID"
              />
            ) : serviceType === 'industrial' && groupedTagsByGarmentType.length > 0 ? (
              // Mostrar grupos agrupados por tipo de prenda para servicio industrial
              <FlatList
                data={groupedTagsByGarmentType}
                renderItem={renderGarmentTypeGroup}
                keyExtractor={item => item.garmentType}
                ListEmptyComponent={
                  <EmptyState
                    icon="alert-circle-outline"
                    title="No se pudieron agrupar las prendas"
                    message="Intenta escanear nuevamente"
                  />
                }
              />
            ) : serviceType === 'industrial' && scannedTags.length > 0 ? (
              // Fallback: si hay tags pero no se agruparon, mostrar individualmente
              <FlatList
                data={scannedTags}
                renderItem={renderScannedTag}
                keyExtractor={item => item.epc}
              />
            ) : (
              // Mostrar lista individual para otros servicios
              <FlatList
                data={scannedTags}
                renderItem={renderScannedTag}
                keyExtractor={item => item.epc}
              />
            )}
          </>
        )}
      </View>

      {/* Botones de acción para servicio personal */}
      {mode === 'guide' && serviceType === 'personal' && showActionButtons && scannedTags.length > 0 && !isEditMode && (
        <View className="flex-row space-x-2">
          <View className="flex-1">
            {(() => {
              const currentTag = scannedTags[scannedTags.length - 1];
              const isAlreadyRegistered = isRfidCodeAlreadyRegistered(currentTag?.epc);
              
              return (
                <Button
                  title={isAlreadyRegistered ? "Editar" : "Registrar"}
                  onPress={isAlreadyRegistered ? handleEditExistingGarment : handleRegisterGarment}
                  fullWidth
                  size="sm"
                  icon={<Icon name={isAlreadyRegistered ? "create-outline" : "add-circle-outline"} size={16} color="white" />}
                  style={{ backgroundColor: isAlreadyRegistered ? "#F59E0B" : "#3B82F6" }}
                />
              );
            })()}
          </View>
          
          {registeredGarments.length > 0 && (
            <View className="flex-1">
              <Button
                title={`Continuar (${registeredGarments.length})`}
                onPress={handleContinueToGuideForm}
                variant="outline"
                fullWidth
                size="sm"
                icon={<Icon name="arrow-forward-circle-outline" size={16} color="#3B82F6" />}
              />
            </View>
          )}
        </View>
      )}

      {/* Modal de detalles de escaneos por tipo de prenda (solo servicio industrial) */}
      {serviceType === 'industrial' && (
        <Modal
          visible={scanDetailsModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setScanDetailsModalOpen(false)}
        >
          <View className="flex-1 bg-black/40">
            <View className="absolute inset-x-0 bottom-0 top-24 bg-white rounded-t-3xl p-4" style={{ elevation: 8 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900 flex-1">
                  {selectedScanGroup?.title || 'Detalles de escaneo'}
                </Text>
                <TouchableOpacity onPress={() => setScanDetailsModalOpen(false)}>
                  <Icon name="close" size={22} color="#111827" />
                </TouchableOpacity>
              </View>

              {selectedScanGroup && selectedScanGroup.items.length > 0 ? (
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                  {selectedScanGroup.items.map((detail, index) => {
                    const garment = getGarmentByRfid(detail.epc);
                    const isRegistered = !!garment && !!garment.id;
                    
                    return (
                      <TouchableOpacity
                        key={detail.epc + index}
                        activeOpacity={0.7}
                        onPress={() => {
                          // Solo permitir editar cantidad si: serviceType === 'industrial' y (mode === 'guide' o mode === 'process')
                          if (isRegistered && serviceType === 'industrial' && (mode === 'guide' || mode === 'process')) {
                            handleOpenQuantityEdit(detail.epc);
                          }
                        }}
                        disabled={!isRegistered || !(serviceType === 'industrial' && (mode === 'guide' || mode === 'process'))}
                      >
                        <Card variant="outlined" className="mb-2">
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center flex-1">
                              <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mr-3">
                                <Text className="text-white font-bold text-sm">
                                  {detail.quantity}
                                </Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-xs font-mono text-gray-800" numberOfLines={1}>
                                  {detail.epc}
                                </Text>
                                <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
                                  {detail.description}
                                </Text>
                              </View>
                            </View>
                            {detail.weight && detail.weight > 0 && (
                              <View className="items-end ml-2">
                                <View className="flex-row items-center">
                                  <Icon name="scale-outline" size={14} color="#4B5563" />
                                  <Text className="text-xs text-gray-800 ml-1">
                                    {detail.weight} lb
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-sm text-gray-500">
                    No hay detalles de escaneo para este grupo.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de edición de cantidad */}
      <Modal
        visible={quantityEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setQuantityEditModalOpen(false);
          setSelectedGarmentForEdit(null);
          setEditingQuantity('');
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ elevation: 8 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Ingresar Cantidad</Text>
              <TouchableOpacity
                onPress={() => {
                  setQuantityEditModalOpen(false);
                  setSelectedGarmentForEdit(null);
                  setEditingQuantity('');
                }}
              >
                <Icon name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {selectedGarmentForEdit && (
              <>
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Prenda</Text>
                  <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <Text className="text-sm font-mono text-blue-700 mb-1">
                      {selectedGarmentForEdit.epc}
                    </Text>
                    <Text className="text-sm text-gray-800">
                      {selectedGarmentForEdit.description}
                    </Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Cantidad <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    value={editingQuantity}
                    onChangeText={(text) => {
                      const onlyNums = text.replace(/\D/g, '');
                      if (onlyNums === '' || parseInt(onlyNums, 10) > 0) {
                        setEditingQuantity(onlyNums);
                      }
                    }}
                    keyboardType="number-pad"
                    className="border border-blue-300 rounded-lg px-3 py-2 bg-white text-base font-semibold text-gray-900"
                    style={{ paddingVertical: 8 }}
                    placeholder="Ingrese la cantidad"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text className="text-xs text-gray-500 mt-2">
                    Cantidad actual: {selectedGarmentForEdit.currentQuantity}
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setQuantityEditModalOpen(false);
                      setSelectedGarmentForEdit(null);
                      setEditingQuantity('');
                    }}
                    className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
                  >
                    <Text className="text-gray-700 font-medium">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmQuantityUpdate}
                    disabled={!editingQuantity || parseInt(editingQuantity, 10) <= 0 || isUpdating}
                    className="flex-1 py-3 rounded-lg items-center"
                    style={{
                      backgroundColor: (!editingQuantity || parseInt(editingQuantity, 10) <= 0 || isUpdating) ? '#D1D5DB' : '#0b1f36',
                    }}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-medium">Confirmar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* En modo edición ya no mostramos botones secundarios; se usa solo el botón inferior "Continuar a Guía" */}

      {/* Botones para otros modos */}
      {!(mode === 'guide' && serviceType === 'personal') && scannedTags.length > 0 && (
        <View className="flex-row space-x-2">
          <View className="flex-1">
            <Button title="Limpiar" onPress={clearAllScannedData} variant="outline" fullWidth size="sm" />
          </View>

          <View className="flex-1">
            <Button
              title={`Continuar (${scannedTags.length})`}
              onPress={handleContinueToGuides}
              fullWidth
              size="sm"
              icon={<Icon name="arrow-forward-circle-outline" size={16} color="white" />}
            />
          </View>
        </View>
      )}

      {/* Botón para continuar a guía (solo modo guide personal con prendas registradas) */}
      {mode === 'guide' && serviceType === 'personal' && !showActionButtons && registeredGarments.length > 0 && scannedTags.length === 0 && (
        <View className="space-y-2">
          <Button
            title={`Continuar a Guía (${registeredGarments.length} prendas)`}
            onPress={handleContinueToGuideForm}
            fullWidth
            size="sm"
            icon={<Icon name="arrow-forward-circle-outline" size={16} color="white" />}
          />
        </View>
      )}

      <ScanRangeModal
        visible={isRangeModalOpen}
        selectedKey={scanRangeKey}
        onClose={() => setIsRangeModalOpen(false)}
        onSelect={handleSelectRange}
      />

      <Modal visible={guideModalOpen} transparent animationType="slide" onRequestClose={handleCloseGuideModal}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">{isEditMode ? 'Editar Guía' : 'Nueva Guía'}</Text>
            <TouchableOpacity onPress={handleCloseGuideModal}>
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GuideForm
            clientOptions={
              isLoadingClients
                ? [{ label: 'Cargando clientes...', value: '' }]
                : filteredClientOptions
            }
            selectedClientId={selectedClientId}
            onChangeClient={setSelectedClientId}
            guideItems={
              serviceType === 'personal' && registeredGarments.length > 0
                ? registeredGarments.map(g => ({ tagEPC: g.rfidCode, proceso: '' }))
                : scannedTags.map(t => ({ tagEPC: t.epc, proceso: '' }))
            }
            onRemoveItem={() => {}}
            onScan={() => {}}
            onSubmit={handleGuideFormSubmit}
            onCancel={handleGuideFormCancel}
            showScanButton={false}
            initialServiceType={
              pendingGuideEdit?.service_type ||
              (serviceType === 'industrial' ? 'INDUSTRIAL' : 'PERSONAL')
            }
            initialTotalWeight={
              pendingGuideEdit?.total_weight ?? (
                serviceType === 'personal'
                  ? calculateTotalWeight()
                  : Number(totalWeightFromScannedGarments.toFixed(2))
              )
            }
            unregisteredCount={serviceType === 'industrial' ? unregisteredCount : 0}
            // Indicar al formulario que estamos editando cuando corresponda y pasar guía completa si viene
            guideToEdit={pendingGuideEdit || (isEditMode ? (passedGuide || { id: route?.params?.guideId }) : undefined)}
            draftValues={guideDraftValues}
          />
        </View>
      </Modal>

      <Modal visible={garmentModalOpen} transparent animationType="slide" onRequestClose={handleCloseGarmentModal}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center flex-1">
              <Icon 
                name={existingGarment ? "create-outline" : "shirt-outline"} 
                size={24} 
                color={existingGarment ? "#F59E0B" : "#3B82F6"} 
              />
              <Text className="text-xl font-bold text-gray-900 ml-2">
                {existingGarment ? "Actualizar Prenda" : "Registrar Prenda"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCloseGarmentModal}>
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          
          {isCheckingRfid && (
            <View className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Text className="text-sm text-blue-700">Verificando código RFID...</Text>
            </View>
          )}
          
          {existingGarment && (
            <View className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <View className="flex-row items-center mb-2">
                <Icon name="warning-outline" size={18} color="#F59E0B" />
                <Text className="text-sm font-semibold text-yellow-800 ml-2">
                  Prenda Existente
                </Text>
              </View>
              <Text className="text-xs text-yellow-700 mb-2">
                Este código RFID ya está registrado. Los cambios actualizarán la prenda existente.
              </Text>
              <Text className="text-xs text-yellow-600 font-mono">
                RFID: {existingGarment.rfid_code}
              </Text>
            </View>
          )}
          
          <GarmentForm
            rfidCode={scannedTags[scannedTags.length - 1]?.epc || ''}
            initialValues={existingGarment ? {
              description: existingGarment.description || '',
              colors: Array.isArray(existingGarment.color) 
                ? existingGarment.color.filter((c: any): c is string => typeof c === 'string' && c.trim() !== '')
                : (existingGarment.color && typeof existingGarment.color === 'string' 
                    ? [existingGarment.color] 
                    : []),
              garmentType: existingGarment.garment_type || '',
              brand: existingGarment.garment_brand || '', // Usar garment_brand en lugar de brand
              branchOfficeId: existingGarment.branch_offices_id || existingGarment.branch_office_id || '',
              garmentCondition: Array.isArray(existingGarment.garment_condition)
                ? existingGarment.garment_condition
                : (existingGarment.garment_condition ? [existingGarment.garment_condition] : []),
              physicalCondition: Array.isArray(existingGarment.physical_condition)
                ? existingGarment.physical_condition
                : (existingGarment.physical_condition ? [existingGarment.physical_condition] : []),
              weight: existingGarment.weight ? String(existingGarment.weight) : '',
              quantity: existingGarment.quantity !== undefined && existingGarment.quantity !== null 
                ? existingGarment.quantity.toString() 
                : undefined,
              serviceType: existingGarment.service_type || '',
              manufacturingDate: existingGarment.manufacturing_date || '',
              observations: existingGarment.observations || '',
            } : undefined}
            submitting={isCreating || isUpdating}
            onSubmit={handleGarmentSubmit}
          />
        </View>
      </Modal>

      {/* Modal para Procesos */}
      <Modal visible={processModalOpen} transparent animationType="slide" onRequestClose={() => { setProcessModalOpen(false); clearScannedTags(); }}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">Nuevo Proceso</Text>
            <TouchableOpacity onPress={() => { setProcessModalOpen(false); clearScannedTags(); }}>
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <ProcessForm
            guideOptions={[
              { label: 'G-0001 - Lavado Industrial', value: 'g-001' },
              { label: 'G-0002 - Lavado Doméstico', value: 'g-002' },
              { label: 'G-0003 - Lavado Hospital', value: 'g-003' },
              { label: 'G-0004 - Lavado Hotel', value: 'g-004' },
            ]}
            selectedGuideId={selectedGuideId}
            onChangeGuide={setSelectedGuideId}
            onSubmit={() => { setProcessModalOpen(false); clearScannedTags(); }}
            onScanRFID={() => { setProcessModalOpen(false); }}
            scannedTags={scannedTags.map(tag => tag.epc)}
            processType={route?.params?.processType || 'IN_PROCESS'}
          />
        </View>
      </Modal>

      {/* Modal de Selección de Tipo de Proceso */}
      <ProcessTypeModal
        visible={processTypeModalOpen}
        onClose={() => setProcessTypeModalOpen(false)}
        onSelectProcess={handleProcessTypeSelect}
      />

      {/* Modal de Selección de Guías */}
      <GuideSelectionModal
        visible={guideSelectionModalOpen}
        onClose={() => setGuideSelectionModalOpen(false)}
        onSelectGuide={handleGuideSelect}
        processType={selectedProcessType}
        guides={guidesForProcess.map(g => ({
          id: g.id,
          guide_number: g.guide_number,
          client_name: g.client_name || 'Cliente desconocido',
          client_acronym: g.client_acronym || g.client?.acronym,
          status: g.status,
          created_at: g.created_at,
          total_garments: g.total_garments || 0,
        }))}
        serviceType={serviceType}
      />

      {/* Modal de ScanForm para actualizar RFID scan */}
      {scanFormContext && (
        <ScanFormModal
          visible={true}
          guideId={scanFormContext.guideId}
          rfidScanId={scanFormContext.rfidScanId}
          guideToEdit={scanFormContext.guide}
          guideData={scanFormContext.guideData}
          scannedTags={scanFormContext.scannedTags}
          initialScanType={scanFormContext.initialScanType || scanFormContext.processType}
          deferRfidScanUpdate={scanFormContext.deferRfidScanUpdate}
          unregisteredCodes={scanFormContext.unregisteredCodes}
          serviceType={scanFormContext.serviceType}
          onSuccess={(data) => handleScanFormSuccess(scanFormContext, data)}
          onCancel={() => handleScanFormCancel(scanFormContext)}
        />
      )}

      {/* Modal de WashingProcessForm para crear/actualizar proceso */}
      {washingProcessFormData && (
        <WashingProcessForm
          visible={washingProcessFormOpen}
          guideId={washingProcessFormData.guideId}
          guideNumber={washingProcessFormData.guideNumber}
          branchOfficeId={washingProcessFormData.branchOfficeId}
          branchOfficeName={washingProcessFormData.branchOfficeName}
          processType={washingProcessFormData.processType}
          rfidScanId={washingProcessFormData.rfidScanId}
          rfidScanUpdateData={washingProcessFormData.rfidScanUpdateData}
          onSuccess={() => {
            setWashingProcessFormOpen(false);
            setWashingProcessFormData(null);
            clearAllScannedData();
            navigation.goBack();
          }}
          onCancel={() => {
            setWashingProcessFormOpen(false);
            setWashingProcessFormData(null);
          }}
        />
      )}
    </Container>
  );
};