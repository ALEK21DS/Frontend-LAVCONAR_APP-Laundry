import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, Alert, NativeModules, NativeEventEmitter, Modal, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Button, Card } from '@/components/common';
import { EmptyState } from '@/components/ui/empty-state';
import { useTagStore } from '@/laundry/store/tag.store';
import { rfidModule } from '@/lib/rfid/rfid.module';
import Icon from 'react-native-vector-icons/Ionicons';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { GuideForm } from '@/laundry/pages/guides/ui/GuideForm';
import { ProcessForm } from '@/laundry/pages/processes/ui/ProcessForm';
import { GarmentForm } from '@/laundry/pages/garments/ui/GarmentForm';
import { useClients } from '@/laundry/hooks/clients';
import { useGarments, useCreateGarment, useUpdateGarment, useGuides, useGarmentsByRfidCodes } from '@/laundry/hooks/guides';
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { GuideSelectionModal } from '@/laundry/components/GuideSelectionModal';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    };
  };
};

export const ScanClothesPage: React.FC<ScanClothesPageProps> = ({ navigation, route }) => {
  const mode = route?.params?.mode || 'guide'; // 'garment' o 'guide'
  const serviceType = route?.params?.serviceType || 'industrial';
  const initialRfids = route?.params?.initialRfids || [];
  const isEditMode = route?.params?.isEditMode || false;
  const { scannedTags, addScannedTag, clearScannedTags, isScanning, setIsScanning } = useTagStore();
  
  // Hooks modulares
  const { createGarmentAsync, isCreating } = useCreateGarment();
  const { updateGarmentAsync, isUpdating } = useUpdateGarment();
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
  // Al entrar a esta pantalla o cuando cambien los params, asegurarnos de que no haya modales abiertos
  useEffect(() => {
    setGuideModalOpen(false);
    setGarmentModalOpen(false);
  }, [route?.params?.guideId, route?.params?.isEditMode]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  // Para servicio personal, usar sensibilidad media (-65) para detección confiable a corta distancia
  const [scanRange, setScanRange] = useState<number>(
    mode === 'guide' && serviceType === 'personal' ? -65 : -65 
  );
  const MIN_RSSI = scanRange; // Usar el rango configurado por el usuario
  
  // Estados para los nuevos modales
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [guideSelectionModalOpen, setGuideSelectionModalOpen] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');
  
  // Estados para el flujo de servicio personal (registro prenda por prenda)
  const [registeredGarments, setRegisteredGarments] = useState<Array<{id: string, description: string, rfidCode: string, category?: string, color?: string, weight?: number}>>([]);
  const [showActionButtons, setShowActionButtons] = useState(false);
  
  // Estado para controlar si ya se cargaron los RFIDs iniciales
  const [initialRfidsLoaded, setInitialRfidsLoaded] = useState(false);
  
  // Mapear el tipo de proceso al estado de guía que debe mostrar
  const getTargetStatusByProcessType = (processType: string): string => {
    if (serviceType === 'personal') {
      const personalMapping: Record<string, string> = {
        'IN_PROCESS': 'SENT',
        'WASHING': 'IN_PROCESS',
        'DRYING': 'WASHING',
        'IRONING': 'DRYING',
        'FOLDING': 'IRONING',
        'PACKAGING': 'FOLDING',
        'LOADING': 'PACKAGING',
        'DELIVERY': 'LOADING',
      };
      return personalMapping[processType] || processType;
    } else {
      const industrialMapping: Record<string, string> = {
        'IN_PROCESS': 'COLLECTED',
        'WASHING': 'IN_PROCESS',
        'DRYING': 'WASHING',
        'PACKAGING': 'DRYING',
        'LOADING': 'PACKAGING',
        'DELIVERY': 'LOADING',
      };
      return industrialMapping[processType] || processType;
    }
  };
  
  // Obtener lista de clientes (máximo 50 según validación del backend)
  const { clients, isLoading: isLoadingClients } = useClients({ limit: 50 });
  
  // Obtener guías filtradas por servicio y estado para procesos
  const targetStatus = selectedProcessType ? getTargetStatusByProcessType(selectedProcessType) : undefined;
  const { guides: guidesForProcess, isLoading: isLoadingGuides } = useGuides({
    limit: 50,
    status: targetStatus,
    service_type: serviceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL',
    enabled: !!selectedProcessType, // Solo cargar cuando se selecciona un proceso
  });
  
  // Estados para manejar prenda existente
  const [existingGarment, setExistingGarment] = useState<any | null>(null);
  const [isCheckingRfid, setIsCheckingRfid] = useState(false);
  const isCheckingRef = useRef(false);
  
  // Set para rastrear RFIDs que están siendo procesados (prevenir race conditions)
  const processingRfidsRef = useRef<Set<string>>(new Set());

  // Función para verificar si un código RFID ya está registrado en la lista local
  const isRfidCodeAlreadyRegistered = useCallback((rfidCode: string) => {
    return registeredGarments.some(garment => garment.rfidCode === rfidCode);
  }, [registeredGarments]);
  
  // Para servicio industrial y modo garment: verificar prendas registradas por RFID
  const rfidCodes = scannedTags.map(tag => tag.epc);
  const { data: garmentsData } = useGarmentsByRfidCodes(
    rfidCodes, 
    (serviceType === 'industrial' || mode === 'garment') && rfidCodes.length > 0
  );
  
  // Crear un mapa de RFID -> Prenda para búsqueda rápida
  const garmentsByRfid = React.useMemo(() => {
    const map = new Map();
    if (garmentsData?.data) {
      garmentsData.data.forEach((garment: any) => {
        if (garment.rfid_code) {
          map.set(garment.rfid_code, garment);
        }
      });
    }
    return map;
  }, [garmentsData]);
  
  // Contar prendas no registradas
  const unregisteredCount = React.useMemo(() => {
    return scannedTags.filter(tag => !garmentsByRfid.has(tag.epc)).length;
  }, [scannedTags, garmentsByRfid]);

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
      
      const response = await garmentsApi.get<any>('/get-all-garments', {
        params: { 
          search: rfidCode,
          limit: 100
        }
      });
      
      const garments = response.data?.data || [];
      
      if (garments.length > 0) {
        // Buscar localmente la prenda con el RFID exacto
        const normalizedScanned = rfidCode.trim().toUpperCase();
        
        const foundGarment = garments.find((g: any) => {
          const normalizedFound = g.rfid_code.trim().toUpperCase();
          return normalizedFound === normalizedScanned;
        });
        
        if (foundGarment) {
          return foundGarment; // Retorna la prenda si existe
        }
      }
      return null; // No existe
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

  const applyReaderPower = useCallback(async (rangeDbm: number) => {
    // Mapear sensibilidad a potencia real del lector (0-30 aprox. segun SDK)
    // Muy Baja(-90) -> 30, Baja(-75)->26, Media(-65)->22, Alta(-55)->18
    const power = rangeDbm <= -85 ? 30 : rangeDbm <= -70 ? 26 : rangeDbm <= -60 ? 22 : 18;
    try {
      await rfidModule.setPower(power);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo aplicar potencia al lector:', e);
    }
  }, []);

  useEffect(() => {
    applyReaderPower(scanRange);
  }, [scanRange, applyReaderPower]);

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
        // Agregar los RFIDs iniciales como tags escaneados
        initialRfids.forEach((rfid) => {
          addScannedTag({
            epc: rfid,
            rssi: -50, // Valor ficticio para tags precargados
            timestamp: Date.now(),
          });
          seenSetRef.current.add(rfid);
        });
        
        scannedTagsCountRef.current = initialRfids.length;
        
        // En modo edición con servicio personal, convertir scannedTags en registeredGarments
        if (serviceType === 'personal') {
          const garments = initialRfids.map((rfid, index) => ({
            id: `edit-${rfid}`,
            rfidCode: rfid,
            description: `Prenda ${index + 1}`, // Nombre temporal, se puede mejorar con datos del backend
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
      setIsStopping(true);
      setIsScanning(false);
      isScanningRef.current = false;
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
      } catch {}
      seenSetRef.current.clear();
    } catch (error) {
      console.error('Error al detener escaneo:', error);
    } finally {
      setIsStopping(false);
    }
  }, [setIsScanning]);

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
        
        // En modo "guide" con servicio personal, lógica especial
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
  }, [addScannedTag, setIsScanning, stopScanning, mode, serviceType, checkRfidInBackend, isRfidCodeAlreadyRegistered]);

  useEffect(() => {
    clearScannedTags();
    seenSetRef.current.clear();
    processingRfidsRef.current.clear();

    // Suscribir al gatillo hardware del C72
    const emitter = new NativeEventEmitter();
    const subDown = emitter.addListener('hwTriggerDown', () => {
      if (!isScanningRef.current) {
        startScanning();
      }
    });
    const subUp = emitter.addListener('hwTriggerUp', () => {
      if (isScanningRef.current) {
        stopScanning();
      }
    });

    // Log de depuración para identificar keyCode del gatillo
    // Manejar botón físico keyCode=293 (C72) vía eventos genéricos si están disponibles
    const subKey = emitter.addListener('hwKey', (payload: any) => {
      if (payload?.keyCode === 293) {
        if (payload.action === 0 && !isScanningRef.current) startScanning();
        if (payload.action === 1 && isScanningRef.current) stopScanning();
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
        setGuideModalOpen(true);
      }
    } else if (mode === 'process') {
      const processType = route?.params?.processType;
      const guideId = route?.params?.guideId;
      
      // Para EMPAQUE, CARGA y ENTREGA, ir a la página de validación
      if (processType === 'PACKAGING' || processType === 'LOADING' || processType === 'DELIVERY') {
        navigation.navigate('GarmentValidation', {
          guideId: guideId || selectedGuideId,
          processType: processType,
          scannedTags: scannedTags.map(tag => tag.epc),
          serviceType: serviceType,
        });
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
    
    // Verificar si ya existe en el backend
    const existingGarmentData = await checkRfidInBackend(currentTag.epc);
    
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
          // Actualizar prenda existente
          await updateGarmentAsync({
            id: existingGarment.id,
            data: {
              description: garmentData.description,
              color: garmentData.color,
              weight: garmentData.weight,
              observations: garmentData.observations,
            }
          });
          Alert.alert('Prenda actualizada', `${garmentData.description} actualizada y agregada a la guía`);
        } else {
          // Crear nueva prenda
          const newGarmentResponse = await createGarmentAsync({
            rfid_code: currentTag.epc,
            description: garmentData.description,
            color: garmentData.color,
            weight: garmentData.weight,
            observations: garmentData.observations,
          });
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
      } catch (error) {
        console.error('Error al guardar prenda:', error);
        Alert.alert('Error', 'No se pudo guardar la prenda');
        
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
  }, [clearScannedTags]);

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
  const handleUpdateExistingGarment = (updatedGarmentData: any) => {
    if (scannedTags.length > 0) {
      const currentTag = scannedTags[scannedTags.length - 1];
      const existingGarment = getExistingGarmentByRfid(currentTag.epc);
      
      if (existingGarment) {
        const updatedGarment = {
          ...existingGarment,
          description: updatedGarmentData.description || existingGarment.description,
          category: updatedGarmentData.category || existingGarment.category,
          color: updatedGarmentData.color || existingGarment.color,
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
    // En modo garment o servicio industrial, verificar si la prenda está registrada
    const garment = (serviceType === 'industrial' || mode === 'garment') ? garmentsByRfid.get(item.epc) : null;
    const isRegistered = !!garment;
    
    // Función para eliminar una prenda específica de la lista
    const handleRemoveTag = () => {
      const updatedTags = scannedTags.filter(tag => tag.epc !== item.epc);
      clearScannedTags();
      updatedTags.forEach(tag => addScannedTag(tag));
      seenSetRef.current.delete(item.epc);
      scannedTagsCountRef.current = updatedTags.length;
    };
    
    return (
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
                        : 'bg-primary-DEFAULT')
                }`}
              >
                {mode !== 'garment' && (
                  <Text className="text-white font-bold">{index + 1}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-mono text-gray-900">{item.epc}</Text>
                {(serviceType === 'industrial' || mode === 'garment') && (
                  <Text className={`text-xs mt-1 ${isRegistered ? 'text-gray-600' : 'text-orange-600 font-medium'}`}>
                    {isRegistered ? garment?.description || garment?.garment_type || 'Sin nombre' : 'Prenda no registrada'}
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Botón X para eliminar prenda (servicio industrial y modo garment) */}
          {(serviceType === 'industrial' || mode === 'garment') && (
            <TouchableOpacity onPress={handleRemoveTag} className="ml-2">
              <Icon name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
          
          {/* Checkmark solo para modos que no tienen botón X */}
          {serviceType !== 'industrial' && mode !== 'garment' && (
            <Icon name="checkmark-circle" size={24} color="#10B981" />
          )}
        </View>
      </Card>
    );
  };

  return (
    <Container safe>
      <View className="flex-row items-center mb-6">
        {!isEditMode && (
          <Button
            icon={<Icon name="arrow-back-outline" size={24} color="#3B82F6" />}
            variant="ghost"
            size="icon"
            onPress={() => {
              stopScanning();
              navigation.goBack();
            }}
          />
        )}
        <Text className="text-lg font-bold text-gray-900 ml-2">
          {isEditMode 
            ? 'EDITAR PRENDAS DE GUÍA'
            : mode === 'guide' && serviceType === 'personal' 
              ? 'REGISTRAR PRENDA' 
              : 'ESCANEAR PRENDAS'}
        </Text>
      </View>

      <View className="mb-6">
        {!isScanning ? (
          <Button
            title="Iniciar Escaneo"
            onPress={startScanning}
            icon={<Icon name="play-outline" size={18} color="white" />}
            fullWidth
            size="sm"
            style={{ backgroundColor: '#1f4eed' }}
          />
        ) : (
          <Button
            title="Detener Escaneo"
            onPress={stopScanning}
            variant="danger"
            icon={<Icon name="stop-outline" size={16} color="white" />}
            fullWidth
            size="sm"
            isLoading={isStopping}
          />
        )}

        {isScanning && (
          <View className="mt-3 bg-primary-DEFAULT/10 border border-primary-DEFAULT/20 rounded-lg px-3 py-2">
            <View className="flex-row items-center justify-center">
              <Icon name="radio-outline" size={16} color="#3B82F6" />
              <Text className="text-primary-DEFAULT font-semibold ml-2 text-sm">Escaneando...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Sección de proceso/descrición eliminada para flujo simplificado */}

      <View className="flex-1 mb-6">
        {mode === 'guide' && serviceType === 'personal' ? (
          <>
            {/* Sección de Código Escaneado (temporal) - Solo en modo creación */}
            {scannedTags.length > 0 && (
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
                  renderItem={({ item, index }) => (
                    <Card variant="outlined" className="mb-2">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <View className="bg-green-500 w-8 h-8 rounded-full items-center justify-center mr-3">
                              <Text className="text-white font-bold">{index + 1}</Text>
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
                  )}
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
            ) : (
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

      {/* Botón para continuar a guía (solo servicio personal con prendas registradas) */}
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
                : clients.map(client => ({
                    label: client.name,
                    value: client.id,
                  }))
            }
            selectedClientId={selectedClientId}
            onChangeClient={setSelectedClientId}
            guideItems={scannedTags.map(t => ({ tagEPC: t.epc, proceso: '' }))}
            onRemoveItem={() => {}}
            onScan={() => {}}
            onSubmit={handleCloseGuideModal}
            onCancel={handleCloseGuideModal}
            showScanButton={false}
            onNavigate={(route: string, params?: any) => {
              // @ts-ignore
              navigation.navigate(route, params);
            }}
            initialServiceType={serviceType === 'industrial' ? 'INDUSTRIAL' : 'PERSONAL'}
            initialTotalWeight={serviceType === 'personal' ? calculateTotalWeight() : 0}
            unregisteredCount={serviceType === 'industrial' ? unregisteredCount : 0}
            // Indicar al formulario que estamos editando cuando corresponda
            guideToEdit={isEditMode ? { id: route?.params?.guideId } : undefined}
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
              color: existingGarment.color || '',
              weight: existingGarment.weight ? String(existingGarment.weight) : '',
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
          status: g.status,
          created_at: g.created_at,
          total_garments: g.total_garments || 0,
        }))}
        serviceType={serviceType}
      />
    </Container>
  );
};
