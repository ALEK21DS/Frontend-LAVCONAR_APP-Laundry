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
import { useClients } from '@/laundry/hooks/useClients';
import { useGarments } from '@/laundry/hooks/useGarments';
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
    };
  };
};

export const ScanClothesPage: React.FC<ScanClothesPageProps> = ({ navigation, route }) => {
  const mode = route?.params?.mode || 'guide'; // 'garment' o 'guide'
  const serviceType = route?.params?.serviceType || 'industrial';
  const { scannedTags, addScannedTag, clearScannedTags, isScanning, setIsScanning } = useTagStore();
  const { createGarment, updateGarment } = useGarments();
  const seenSetRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef<boolean>(false);
  const [isStopping, setIsStopping] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [garmentModalOpen, setGarmentModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('client-demo-1');
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
  const [registeredGarments, setRegisteredGarments] = useState<Array<{id: string, description: string, rfidCode: string, category?: string, color?: string}>>([]);
  const [showActionButtons, setShowActionButtons] = useState(false);
  
  // Estados para manejar prenda existente
  const [existingGarment, setExistingGarment] = useState<any | null>(null);
  const [isCheckingRfid, setIsCheckingRfid] = useState(false);
  const isCheckingRef = useRef(false);

  // Función para verificar si un RFID ya está registrado en el backend
  const checkRfidInBackend = useCallback(async (rfidCode: string) => {
    // Evitar llamadas duplicadas
    if (isCheckingRef.current) {
      console.log('⏸️ Ya hay una verificación en progreso, ignorando...');
      return null;
    }
    
    isCheckingRef.current = true;
    setIsCheckingRfid(true);
    try {
      // Verificar token antes de hacer la petición
      const token = await AsyncStorage.getItem('auth-token');
      console.log('🔑 Token presente:', token ? 'SÍ' : 'NO');
      
      if (!token) {
        console.error('🔒 No hay token de autenticación');
        Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión');
        return null;
      }
      
      console.log('🔍 Verificando RFID en backend:', rfidCode);
      const response = await garmentsApi.get<any>('/get-all-garments', {
        params: { 
          search: rfidCode, // Usar search en lugar de rfid_code
          limit: 100 // Traer más para buscar localmente
        }
      });
      
      console.log('📦 Respuesta completa del backend:', response.data);
      
      const garments = response.data?.data || [];
      console.log('📦 Prendas encontradas:', garments.length);
      
      if (garments.length > 0) {
        // Buscar localmente la prenda con el RFID exacto
        const normalizedScanned = rfidCode.trim().toUpperCase();
        
        const foundGarment = garments.find((g: any) => {
          const normalizedFound = g.rfid_code.trim().toUpperCase();
          return normalizedFound === normalizedScanned;
        });
        
        if (foundGarment) {
          console.log('✅ Prenda encontrada con RFID coincidente:', {
            id: foundGarment.id,
            rfid_code: foundGarment.rfid_code,
            description: foundGarment.description,
            weight: foundGarment.weight,
            color: foundGarment.color
          });
          return foundGarment; // Retorna la prenda si existe
        } else {
          console.log('⚠️ Ninguna prenda coincide con RFID:', normalizedScanned);
          console.log('📋 RFIDs en respuesta:', garments.map((g: any) => g.rfid_code));
          return null; // No encontrada
        }
      }
      console.log('❌ Prenda NO encontrada para:', rfidCode);
      return null; // No existe
    } catch (error: any) {
      const errorStatus = error?.response?.status;
      
      // Error 404 es NORMAL cuando no existe la prenda
      if (errorStatus === 404) {
        console.log('✅ Confirmado: Prenda NO existe en backend (404)');
        return null; // No existe, es comportamiento esperado
      }
      
      // Error 401: Token expirado o inválido
      if (errorStatus === 401) {
        console.error('🔒 Token expirado o inválido - Limpiando sesión');
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
      
      // Otros errores sí son problemas reales
      console.error('❌ Error inesperado al verificar RFID:', error.message);
      console.error('❌ Error status:', errorStatus);
      console.error('❌ Error response:', error?.response?.data);
      
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

  // Log cuando se abre el modal de prenda
  useEffect(() => {
    if (garmentModalOpen) {
      const currentRfid = scannedTags[scannedTags.length - 1]?.epc || '';
      console.log('📝 Modal de prenda abierto:');
      console.log('  - RFID escaneado:', currentRfid);
      console.log('  - Prenda existente:', existingGarment ? 'SÍ' : 'NO');
      if (existingGarment) {
        console.log('  - ID prenda:', existingGarment.id);
        console.log('  - RFID prenda:', existingGarment.rfid_code);
        console.log('  - Descripción:', existingGarment.description);
      }
    }
  }, [garmentModalOpen, existingGarment, scannedTags]);

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
      setIsScanning(true);
      isScanningRef.current = true;
      const subscription = rfidModule.addTagListener((tag: ScannedTag) => {
        if (!isScanningRef.current) return;
        // Filtro de RSSI mínimo
        if (typeof tag.rssi === 'number' && tag.rssi < MIN_RSSI) {
          return;
        }
        // Deduplicación por EPC en memoria
        if (seenSetRef.current.has(tag.epc)) return;
        seenSetRef.current.add(tag.epc);
        addScannedTag(tag);
        
        // En modo "garment", detener automáticamente después de escanear una prenda
        if (mode === 'garment') {
          stopScanning();
        }
        
        // En modo "guide" con servicio personal, detener y mostrar botones de acción
        if (mode === 'guide' && serviceType === 'personal') {
          stopScanning();
          setShowActionButtons(true);
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
  }, [addScannedTag, setIsScanning, stopScanning, mode, serviceType]);

  useEffect(() => {
    clearScannedTags();
    seenSetRef.current.clear();

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
    clearScannedTags();
    seenSetRef.current.clear();
  };

  const handleCloseGarmentModal = () => {
    setGarmentModalOpen(false);
    setExistingGarment(null);
    clearScannedTags();
    seenSetRef.current.clear();
    // Permanecer en la página de escaneo para registrar otra prenda
  };

  // Funciones para el flujo de servicio personal
  const handleRegisterGarment = async () => {
    if (scannedTags.length === 0) {
      console.log('⚠️ No hay tags escaneados');
      return;
    }
    
    // Evitar llamadas múltiples
    if (garmentModalOpen) {
      console.log('⏸️ Modal ya está abierto, ignorando...');
      return;
    }
    
    const currentTag = scannedTags[scannedTags.length - 1];
    console.log('🔎 Iniciando registro/actualización de prenda para RFID:', currentTag.epc);
    
    // Verificar si ya existe en el backend
    const existingGarmentData = await checkRfidInBackend(currentTag.epc);
    
    if (existingGarmentData) {
      // Si existe, abrir directamente el formulario de actualización
      console.log('⚠️ Prenda existente detectada para RFID:', currentTag.epc);
      console.log('✏️ Abriendo modal de actualización automáticamente');
      
      setExistingGarment(existingGarmentData);
      setShowActionButtons(false);
      setGarmentModalOpen(true);
    } else {
      // Si no existe, abrir modal para crear
      console.log('➕ Prenda nueva, abriendo formulario de creación');
      setExistingGarment(null);
      setShowActionButtons(false);
      setGarmentModalOpen(true);
    }
  };

  const handleGarmentSubmit = async (garmentData: any) => {
    if (scannedTags.length > 0) {
      const currentTag = scannedTags[scannedTags.length - 1];
      
      try {
        if (existingGarment) {
          // Actualizar prenda existente
          await updateGarment.mutateAsync({
            id: existingGarment.id,
            data: {
              description: garmentData.description,
              color: garmentData.color,
              weight: garmentData.weight,
              observations: garmentData.observations,
            }
          });
          Alert.alert('Éxito', 'Prenda actualizada correctamente');
        } else {
          // Crear nueva prenda
          await createGarment.mutateAsync({
            rfid_code: currentTag.epc,
            description: garmentData.description,
            color: garmentData.color,
            weight: garmentData.weight,
            observations: garmentData.observations,
          });
          Alert.alert('Éxito', 'Prenda registrada correctamente');
        }
        
        const newGarment = {
          id: existingGarment?.id || `garment-${Date.now()}`,
          description: garmentData.description || 'Sin descripción',
          rfidCode: currentTag.epc,
          category: garmentData.category,
          color: garmentData.color,
        };
        
        setRegisteredGarments(prev => [...prev, newGarment]);
        setGarmentModalOpen(false);
        setExistingGarment(null);
        clearScannedTags();
        // Continuar en la página de escaneo, listo para escanear otra prenda
      } catch (error) {
        console.error('Error al guardar prenda:', error);
        Alert.alert('Error', 'No se pudo guardar la prenda');
      }
    }
  };

  const handleContinueToGuideForm = () => {
    setShowActionButtons(false);
    // Convertir prendas registradas a tags y abrir formulario de guía
    const garmentTags = registeredGarments.map(g => ({ epc: g.rfidCode, rssi: -50, timestamp: Date.now() }));
    // Agregar los tags al store
    clearScannedTags();
    garmentTags.forEach(tag => addScannedTag(tag));
    setGuideModalOpen(true);
  };

  const removeRegisteredGarment = (garmentId: string) => {
    const garment = registeredGarments.find(g => g.id === garmentId);
    if (garment) {
      // Remover del seenSet para permitir re-escaneo
      seenSetRef.current.delete(garment.rfidCode);
    }
    setRegisteredGarments(prev => prev.filter(g => g.id !== garmentId));
  };

  // Función para verificar si un código RFID ya está registrado
  const isRfidCodeAlreadyRegistered = (rfidCode: string) => {
    return registeredGarments.some(garment => garment.rfidCode === rfidCode);
  };

  // Función para obtener la prenda existente por código RFID
  const getExistingGarmentByRfid = (rfidCode: string) => {
    return registeredGarments.find(garment => garment.rfidCode === rfidCode);
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

  // Datos demo de guías (esto vendría del backend)
  const getGuidesByProcessType = (processType: string) => {
    const demoGuides = [
      { id: 'g-001', guide_number: 'G-0001', client_name: 'Cliente A', status: 'RECEIVED', created_at: '2024-01-15', total_garments: 15 },
      { id: 'g-002', guide_number: 'G-0002', client_name: 'Cliente B', status: 'IN_PROCESS', created_at: '2024-01-14', total_garments: 8 },
      { id: 'g-003', guide_number: 'G-0003', client_name: 'Cliente C', status: 'WASHING', created_at: '2024-01-13', total_garments: 12 },
      { id: 'g-004', guide_number: 'G-0004', client_name: 'Cliente D', status: 'DRYING', created_at: '2024-01-12', total_garments: 20 },
      { id: 'g-005', guide_number: 'G-0005', client_name: 'Cliente E', status: 'PACKAGING', created_at: '2024-01-11', total_garments: 6 },
    ];

    // Mapear el tipo de proceso al estado de guía que debe mostrar
    const statusMapping: Record<string, string> = {
      'IN_PROCESS': 'RECEIVED',
      'WASHING': 'IN_PROCESS',
      'DRYING': 'WASHING',
      'PACKAGING': 'DRYING',
      'SHIPPING': 'PACKAGING',
      'LOADING': 'SHIPPING',
      'DELIVERY': 'LOADING',
    };

    const targetStatus = statusMapping[processType] || processType;
    return demoGuides.filter(guide => guide.status === targetStatus);
  };

  const renderScannedTag = ({ item, index }: { item: ScannedTag; index: number }) => (
    <Card variant="outlined" className="mb-2">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center">
            <View className="bg-primary-DEFAULT w-8 h-8 rounded-full items-center justify-center mr-3">
              <Text className="text-white font-bold">{index + 1}</Text>
            </View>
            <View>
              <Text className="text-sm font-mono text-gray-900">{item.epc}</Text>
              {item.rssi && (
                <Text className="text-xs text-gray-500 mt-1">Señal: {item.rssi} dBm</Text>
              )}
            </View>
          </View>
        </View>
        <Icon name="checkmark-circle" size={24} color="#10B981" />
      </View>
    </Card>
  );

  return (
    <Container safe>
      <View className="flex-row items-center mb-6">
        <Button
          icon={<Icon name="arrow-back-outline" size={24} color="#3B82F6" />}
          variant="ghost"
          size="icon"
          onPress={() => {
            stopScanning();
            navigation.goBack();
          }}
        />
        <Text className="text-2xl font-bold text-gray-900 ml-2">
          {mode === 'guide' && serviceType === 'personal' ? 'Registrar Prenda' : 'Escanear Prendas'}
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

      {/* Control de Rango del Escáner - Oculto en servicio personal */}
      {!(mode === 'guide' && serviceType === 'personal') && (
        <View className="mb-6">
          <Card variant="outlined" padding="md">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Icon name="radio-outline" size={20} color="#6B7280" />
                <Text className="text-gray-700 ml-2">Sensibilidad</Text>
              </View>
              <Text className="text-sm font-medium text-gray-900">{scanRange} dBm</Text>
            </View>
            
            <View className="flex-row items-center space-x-3">
              <Button
                title="Muy Baja"
                variant={scanRange === -90 ? "primary" : "outline"}
                size="sm"
                onPress={() => setScanRange(-90)}
              />
              <Button
                title="Baja"
                variant={scanRange === -75 ? "primary" : "outline"}
                size="sm"
                onPress={() => setScanRange(-75)}
              />
              <Button
                title="Media"
                variant={scanRange === -65 ? "primary" : "outline"}
                size="sm"
                onPress={() => setScanRange(-65)}
              />
              <Button
                title="Alta"
                variant={scanRange === -55 ? "primary" : "outline"}
                size="sm"
                onPress={() => setScanRange(-55)}
              />
            </View>
          </Card>
        </View>
      )}

      {/* Sección de proceso/descrición eliminada para flujo simplificado */}

      <View className="flex-1 mb-6">
        {mode === 'guide' && serviceType === 'personal' ? (
          <>
            {/* Sección de Código Escaneado (temporal) */}
            {scannedTags.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-900">
                    Código Escaneado
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      clearScannedTags();
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
                      {scannedTags[scannedTags.length - 1]?.rssi && (
                        <Text className="text-xs text-gray-500 mt-1">
                          Señal: {scannedTags[scannedTags.length - 1].rssi} dBm
                        </Text>
                      )}
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
                  keyExtractor={item => item.id}
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
      {mode === 'guide' && serviceType === 'personal' && showActionButtons && scannedTags.length > 0 && (
        <View className="space-y-2">
          {(() => {
            const currentTag = scannedTags[scannedTags.length - 1];
            const isAlreadyRegistered = isRfidCodeAlreadyRegistered(currentTag?.epc);
            
            return (
              <Button
                title={isAlreadyRegistered ? "Editar Prenda" : "Registrar Prenda"}
                onPress={isAlreadyRegistered ? handleEditExistingGarment : handleRegisterGarment}
                fullWidth
                size="sm"
                icon={<Icon name={isAlreadyRegistered ? "create-outline" : "add-circle-outline"} size={16} color="white" />}
                style={{ backgroundColor: isAlreadyRegistered ? "#F59E0B" : "#3B82F6" }}
              />
            );
          })()}
          {registeredGarments.length > 0 && (
            <Button
              title={`Continuar a Guía (${registeredGarments.length} prendas)`}
              onPress={handleContinueToGuideForm}
              variant="outline"
              fullWidth
              size="sm"
              icon={<Icon name="arrow-forward-circle-outline" size={16} color="#3B82F6" />}
            />
          )}
        </View>
      )}

      {/* Botones para otros modos */}
      {!(mode === 'guide' && serviceType === 'personal') && scannedTags.length > 0 && (
        <View className="space-y-2">
          <Button
            title={`Continuar (${scannedTags.length})`}
            onPress={handleContinueToGuides}
            fullWidth
            size="sm"
            icon={<Icon name="arrow-forward-circle-outline" size={16} color="white" />}
          />

          <Button title="Limpiar Lista" onPress={clearScannedTags} variant="outline" fullWidth size="sm" />
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
            <Text className="text-xl font-bold text-gray-900 flex-1">Nueva Guía</Text>
            <TouchableOpacity onPress={handleCloseGuideModal}>
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GuideForm
            clientOptions={[{ label: 'Cliente Demo', value: 'client-demo-1' }]}
            selectedClientId={selectedClientId}
            onChangeClient={setSelectedClientId}
            guideItems={scannedTags.map(t => ({ tagEPC: t.epc, proceso: '' }))}
            onRemoveItem={() => {}}
            onScan={() => {}}
            onSubmit={handleCloseGuideModal}
            showScanButton={false}
            onNavigate={(route: string, params?: any) => {
              // @ts-ignore
              navigation.navigate(route, params);
            }}
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
            submitting={createGarment.isPending || updateGarment.isPending}
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
        guides={getGuidesByProcessType(selectedProcessType)}
      />
    </Container>
  );
};
