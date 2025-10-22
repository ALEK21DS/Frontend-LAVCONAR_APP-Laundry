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
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { GuideSelectionModal } from '@/laundry/components/GuideSelectionModal';

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
  const seenSetRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef<boolean>(false);
  const [isStopping, setIsStopping] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [garmentModalOpen, setGarmentModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('client-demo-1');
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [scanRange, setScanRange] = useState<number>(-65); // Rango del escáner (RSSI)
  const MIN_RSSI = scanRange; // Usar el rango configurado por el usuario
  
  // Estados para los nuevos modales
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [guideSelectionModalOpen, setGuideSelectionModalOpen] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');

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
        // En modo "guide" y "process", permitir escaneo continuo de múltiples prendas
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
  }, [addScannedTag, setIsScanning]);

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

  const handleContinueToGuides = () => {
    stopScanning();
    if (scannedTags.length === 0) {
      Alert.alert('Sin lecturas', 'Escanea al menos una prenda para continuar.');
      return;
    }
    
    if (mode === 'garment') {
      setGarmentModalOpen(true);
    } else if (mode === 'guide') {
      setGuideModalOpen(true);
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
    clearScannedTags();
    seenSetRef.current.clear();
    // Permanecer en la página de escaneo para registrar otra prenda
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
        <Text className="text-2xl font-bold text-gray-900 ml-2">Escanear Prendas</Text>
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

      {/* Control de Rango del Escáner */}
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

      {/* Sección de proceso/descrición eliminada para flujo simplificado */}

      <View className="flex-1 mb-6">
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
      </View>

      {scannedTags.length > 0 && (
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
            <Text className="text-xl font-bold text-gray-900 flex-1">Registrar Prenda</Text>
            <TouchableOpacity onPress={handleCloseGarmentModal}>
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GarmentForm
            rfidCode={scannedTags[0]?.epc || ''}
            onSubmit={handleCloseGarmentModal}
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
