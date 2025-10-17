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

type ScanClothesPageProps = {
  navigation: NativeStackNavigationProp<any>;
  route?: any;
};

export const ScanClothesPage: React.FC<ScanClothesPageProps> = ({ navigation, route }) => {
  const mode = route?.params?.mode || 'guide'; // 'garment' o 'guide'
  const { scannedTags, addScannedTag, clearScannedTags, isScanning, setIsScanning } = useTagStore();
  const seenSetRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef<boolean>(false);
  const [isStopping, setIsStopping] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [garmentModalOpen, setGarmentModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('client-demo-1');
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [detectedGuideId, setDetectedGuideId] = useState<string | undefined>(undefined);
  const [scanRange, setScanRange] = useState<number>(-65); // Rango del escáner (RSSI)
  const MIN_RSSI = scanRange; // Usar el rango configurado por el usuario

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
      // eslint-disable-next-line no-console
      console.log('Starting RFID scan...');
      const subscription = rfidModule.addTagListener((tag: ScannedTag) => {
        if (!isScanningRef.current) return;
        // Filtro de RSSI mínimo
        if (typeof tag.rssi === 'number' && tag.rssi < MIN_RSSI) {
          return;
        }
        // Deduplicación por EPC en memoria
        if (seenSetRef.current.has(tag.epc)) return;
        seenSetRef.current.add(tag.epc);
        // eslint-disable-next-line no-console
        console.log('Tag accepted:', tag);
        addScannedTag(tag);
        
        // En modo "garment", detener automáticamente después de escanear una prenda
        if (mode === 'garment') {
          stopScanning();
        }
        if (mode === 'process') {
          // Para procesos también se detiene en la primera lectura
          stopScanning();
        }
      });
      (global as any).rfidSubscription = subscription;
      const errSub = rfidModule.addErrorListener((msg: string) => {
        // eslint-disable-next-line no-console
        console.warn('RFID error:', msg);
      });
      (global as any).rfidErrSubscription = errSub;
      await rfidModule.startScan();
      // eslint-disable-next-line no-console
      console.log('RFID scan started');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el escaneo RFID');
      setIsScanning(false);
    }
  }, [addScannedTag, setIsScanning]);

  useEffect(() => {
    clearScannedTags();
    seenSetRef.current.clear();
    // Debug: listar métodos expuestos por el módulo nativo
    // eslint-disable-next-line no-console
    console.log('RFIDModule methods:', Object.keys((NativeModules as any).RFIDModule || {}));

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
      // TODO: Consultar guía por EPC (mock por ahora)
      const first = scannedTags[0];
      // Simulación: mapear EPC a una guía demo
      const guideId = 'g-demo-001';
      setDetectedGuideId(guideId);
      setProcessModalOpen(true);
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
        <Text className="text-lg font-semibold text-gray-900 mb-3">Rango del Escáner</Text>
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
          
          <View className="mt-3">
            <Text className="text-xs text-gray-500">
              {scanRange === -90 && "Muy Baja: Detecta tags muy lejanos (puede incluir interferencias)"}
              {scanRange === -75 && "Baja: Detecta tags a distancia media"}
              {scanRange === -65 && "Media: Rango equilibrado (recomendado)"}
              {scanRange === -55 && "Alta: Solo tags muy cercanos (mayor precisión)"}
            </Text>
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
            <Text className="text-xl font-bold text-gray-900 flex-1">{detectedGuideId ? 'Editar Proceso' : 'Nuevo Proceso'}</Text>
            <TouchableOpacity onPress={() => { setProcessModalOpen(false); clearScannedTags(); }}>
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <ProcessForm
            guideOptions={[{ label: detectedGuideId ? `${detectedGuideId}` : 'Guía detectada', value: detectedGuideId || 'g-demo-001' }]}
            selectedGuideId={detectedGuideId || 'g-demo-001'}
            onChangeGuide={() => {}}
            onSubmit={() => { setProcessModalOpen(false); clearScannedTags(); }}
          />
        </View>
      </Modal>
    </Container>
  );
};
