import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { useScanGarmentQr } from '@/laundry/hooks/guides';
import { QrScanner } from './QrScanner';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Garment {
  id: string;
  rfid_code: string;
  description?: string;
  color?: string | string[];
  garment_type?: string;
  garment_brand?: string;
  weight?: number;
}

interface GarmentSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGarment: (rfidCode: string) => void;
  garments: Garment[];
  isLoading?: boolean;
  guideId?: string; // ID de la guía para validación
  guideRfidCodes?: string[]; // Lista de RFIDs de la guía para validación
}

export const GarmentSelectionModal: React.FC<GarmentSelectionModalProps> = ({
  visible,
  onClose,
  onSelectGarment,
  garments,
  isLoading = false,
  guideId,
  guideRfidCodes = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedGarment, setScannedGarment] = useState<Garment | null>(null);
  const [isScanningRfid, setIsScanningRfid] = useState(false);
  const [scanSource, setScanSource] = useState<'qr' | 'rfid'>('qr');
  const { scanGarmentQrAsync, isScanning } = useScanGarmentQr();
  const isScanningRef = useRef(false);
  const seenSetRef = useRef<Set<string>>(new Set());

  // Función para validar si una prenda pertenece a la guía
  const validateGarmentBelongsToGuide = useCallback((rfidCode: string): boolean => {
    // Si no hay guía seleccionada, no validar (permitir cualquier prenda)
    if (!guideId) {
      return true;
    }
    
    // Si no hay códigos RFID en la guía, no validar (permitir cualquier prenda)
    if (!guideRfidCodes || guideRfidCodes.length === 0) {
      console.log('⚠️ No hay códigos RFID en la guía para validar');
      return true;
    }
    
    // Normalizar el código RFID a buscar
    const normalizedRfid = String(rfidCode || '').trim().toUpperCase();
    
    if (!normalizedRfid) {
      return false;
    }
    
    // Buscar en la lista de códigos RFID de la guía
    const belongs = guideRfidCodes.some(code => {
      const normalizedCode = String(code || '').trim().toUpperCase();
      return normalizedCode === normalizedRfid;
    });
    
    // Log para debugging
    if (!belongs) {
      console.log(`❌ RFID ${normalizedRfid} NO pertenece a la guía`);
      console.log(`📋 Códigos RFID de la guía:`, guideRfidCodes.map(c => String(c || '').trim().toUpperCase()));
    } else {
      console.log(`✅ RFID ${normalizedRfid} SÍ pertenece a la guía`);
    }
    
    return belongs;
  }, [guideId, guideRfidCodes]);

  // Función para obtener detalles de una prenda por RFID
  const getGarmentByRfid = useCallback(async (rfidCode: string): Promise<Garment | null> => {
    const token = await AsyncStorage.getItem('auth-token');
    if (!token) {
      Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión');
      return null;
    }

    try {
      const response = await garmentsApi.get<any>('/get-all-garments', {
        params: { search: rfidCode, limit: 100 },
        validateStatus: (status) => {
          // Permitir que 404 y 400 no lancen excepciones
          return status < 500;
        }
      });

      // Si es un 404 o 400, no hay prenda
      if (response.status === 404 || response.status === 400) {
        return null;
      }

      const garmentsList = response?.data?.data || [];
      if (!garmentsList || garmentsList.length === 0) {
        return null;
      }

      const garment = garmentsList.find((g: any) => 
        g.rfid_code?.trim().toUpperCase() === rfidCode.trim().toUpperCase()
      );

      if (garment) {
        return {
          id: garment.id,
          rfid_code: garment.rfid_code,
          description: garment.description,
          color: garment.color,
          garment_type: garment.garment_type,
          garment_brand: garment.garment_brand,
          weight: garment.weight,
        };
      }
      return null;
    } catch (error: any) {
      // Solo manejar errores que no sean 404 o 400 (que ya fueron manejados arriba)
      // Si el error es 404 o 400, simplemente retornar null sin loguear
      if (error?.response?.status === 404 || error?.response?.status === 400) {
        return null;
      }
      // Para otros errores (500, network, etc.), loguear pero no mostrar en consola como error
      if (error?.response?.status >= 500) {
        console.warn('Error del servidor al obtener prenda:', error?.response?.status);
      }
      return null;
    }
  }, []);

  // Función para manejar el escaneo RFID
  const handleRfidScan = useCallback(async () => {
    if (isScanningRfid) {
      // Detener escaneo
      setIsScanningRfid(false);
      isScanningRef.current = false;
      if ((global as any).incidentRfidSub) {
        (global as any).incidentRfidSub.remove();
        (global as any).incidentRfidSub = null;
      }
      if ((global as any).incidentRfidErrSub) {
        (global as any).incidentRfidErrSub.remove();
        (global as any).incidentRfidErrSub = null;
      }
      try {
        await rfidModule.stopScan();
      } catch {}
      seenSetRef.current.clear();
      return;
    }

    // Iniciar escaneo
    setIsScanningRfid(true);
    isScanningRef.current = true;
    setScanSource('rfid');
    seenSetRef.current.clear();

    try {
      const sub = rfidModule.addTagListener(async (tag: ScannedTag) => {
        if (!isScanningRef.current) return;
        if (seenSetRef.current.has(tag.epc)) return;
        seenSetRef.current.add(tag.epc);

        // Detener escaneo
        setIsScanningRfid(false);
        isScanningRef.current = false;
        try {
          await rfidModule.stopScan();
        } catch {}
        if ((global as any).incidentRfidSub) {
          (global as any).incidentRfidSub.remove();
          (global as any).incidentRfidSub = null;
        }
        if ((global as any).incidentRfidErrSub) {
          (global as any).incidentRfidErrSub.remove();
          (global as any).incidentRfidErrSub = null;
        }

        // Obtener detalles de la prenda primero
        let garment: Garment | null = null;
        try {
          garment = await getGarmentByRfid(tag.epc);
        } catch (error: any) {
          // Ignorar errores 404 silenciosamente
          if (error?.response?.status !== 404) {
            console.warn('Error al obtener prenda:', error?.message);
          }
        }
        
        // Si no se encontró la prenda, mostrar mensaje
        if (!garment) {
          Alert.alert(
            'Prenda no encontrada',
            `No se encontró información para el código RFID: ${tag.epc}`,
            [{ text: 'OK', onPress: () => seenSetRef.current.clear() }]
          );
          seenSetRef.current.clear();
          return;
        }

        // Validar si pertenece a la guía DESPUÉS de obtener los detalles
        // Solo validar si hay una guía seleccionada y códigos RFID disponibles
        if (guideId && guideRfidCodes && guideRfidCodes.length > 0) {
          const belongsToGuide = validateGarmentBelongsToGuide(tag.epc);
          
          // Si la prenda NO pertenece a la guía, mostrar alerta y NO mostrar el modal de detalles
          if (!belongsToGuide) {
            Alert.alert(
              '⚠️ Esta prenda no pertenece a esta guía',
              `El código RFID escaneado no está registrado en el escaneo de la guía seleccionada.\n\nPor favor, escanee una prenda que pertenezca a esta guía.`,
              [
                { 
                  text: 'OK', 
                  style: 'cancel',
                  onPress: () => seenSetRef.current.clear()
                }
              ]
            );
            seenSetRef.current.clear();
            return;
          }
        }

        // Si pertenece a la guía (o no hay validación requerida), mostrar detalles
        // El modal mostrará el indicador "Esta prenda pertenece a esta guía"
        setScannedGarment(garment);
        seenSetRef.current.clear();
      });

      (global as any).incidentRfidSub = sub;
      const errSub = rfidModule.addErrorListener(() => {});
      (global as any).incidentRfidErrSub = errSub;

      await rfidModule.startScan();
    } catch (error) {
      setIsScanningRfid(false);
      isScanningRef.current = false;
      Alert.alert('Error', 'No se pudo iniciar el escaneo RFID');
    }
  }, [validateGarmentBelongsToGuide, getGarmentByRfid]);

  // Limpiar al cerrar el modal
  React.useEffect(() => {
    if (!visible) {
      setIsScanningRfid(false);
      isScanningRef.current = false;
      seenSetRef.current.clear();
      if ((global as any).incidentRfidSub) {
        (global as any).incidentRfidSub.remove();
        (global as any).incidentRfidSub = null;
      }
      if ((global as any).incidentRfidErrSub) {
        (global as any).incidentRfidErrSub.remove();
        (global as any).incidentRfidErrSub = null;
      }
      try {
        rfidModule.stopScan();
      } catch {}
    }
  }, [visible]);

  const filteredGarments = useMemo(() => {
    if (!searchQuery.trim()) return garments;
    const query = searchQuery.toLowerCase();
    return garments.filter(garment => 
      garment.rfid_code.toLowerCase().includes(query) ||
      garment.description?.toLowerCase().includes(query)
    );
  }, [garments, searchQuery]);

  const renderGarment = ({ item }: { item: Garment }) => (
    <TouchableOpacity
      onPress={() => {
        onSelectGarment(item.rfid_code);
        onClose();
      }}
      className="mb-3"
    >
      <Card padding="md" variant="outlined">
        <View className="flex-row items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Icon name="pricetag-outline" size={20} color="#6B7280" />
              <Text className="text-lg font-bold text-gray-900 ml-2 font-mono">
                {item.rfid_code}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mb-1">
              {item.description || 'Sin descripción'}
            </Text>
            {item.color && (
              <Text className="text-xs text-gray-500">
                Color: {item.color}
              </Text>
            )}
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40">
        <View className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl" style={{ elevation: 8 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                Seleccionar Prenda
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Selecciona una prenda para el incidente
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-6 py-3">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3" style={{ height: 36 }}>
              <Icon name="search-outline" size={16} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-gray-900 text-sm"
                placeholder="Buscar por RFID o descripción..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                style={{ height: 36 }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Botones de Escaneo */}
            <View className="flex-row space-x-2 mt-3">
              <TouchableOpacity
                onPress={() => {
                  setScanSource('qr');
                  setShowQrScanner(true);
                }}
                className="flex-1 bg-green-600 p-3 rounded-lg flex-row items-center justify-center"
                disabled={isScanning}
              >
                <Icon name="qr-code-outline" size={18} color="white" />
                <Text className="text-white font-semibold ml-2 text-sm">
                  {isScanning ? 'Escaneando...' : 'QR'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleRfidScan}
                className="flex-1 bg-blue-600 p-3 rounded-lg flex-row items-center justify-center"
                disabled={isScanningRfid}
              >
                <Icon name="radio-outline" size={18} color="white" />
                <Text className="text-white font-semibold ml-2 text-sm">
                  {isScanningRfid ? 'Escaneando...' : 'RFID'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Garments List */}
          <View className="flex-1 px-6">
            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#8EB021" />
                <Text className="text-sm text-gray-500 mt-4">
                  Cargando prendas...
                </Text>
              </View>
            ) : filteredGarments.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Icon name="shirt-outline" size={48} color="#D1D5DB" />
                <Text className="text-lg font-medium text-gray-500 mt-4">
                  No hay prendas disponibles
                </Text>
                <Text className="text-sm text-gray-400 mt-2 text-center">
                  No se encontraron prendas para este incidente
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredGarments}
                renderItem={renderGarment}
                keyExtractor={item => item.rfid_code}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </View>
      
      {/* Escáner QR */}
      {showQrScanner && (
        <QrScanner
          visible={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={async (qrData: string) => {
            setShowQrScanner(false);
            try {
              const garment = await scanGarmentQrAsync(qrData);
              
              // Validar que pertenezca a la guía (solo si hay guía seleccionada)
              if (guideId && guideRfidCodes && guideRfidCodes.length > 0) {
                const belongsToGuide = validateGarmentBelongsToGuide(garment.rfid_code);
                
                if (!belongsToGuide) {
                  Alert.alert(
                    '⚠️ Esta prenda no pertenece a esta guía',
                    `El código RFID escaneado no está registrado en el escaneo de la guía seleccionada.\n\nPor favor, escanee una prenda que pertenezca a esta guía.`,
                    [
                      { 
                        text: 'OK', 
                        style: 'cancel'
                      }
                    ]
                  );
                  return;
                }
              }
              
              // Si pertenece a la guía (o no hay validación), mostrar detalles
              setScannedGarment(garment);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo escanear el código QR');
            }
          }}
        />
      )}
      
      {/* Modal de Detalles de Prenda Escaneada */}
      <Modal
        visible={!!scannedGarment}
        transparent
        animationType="fade"
        onRequestClose={() => setScannedGarment(null)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-white rounded-3xl mx-4 w-11/12 max-w-md" style={{ elevation: 10 }}>
            {/* Header */}
            <View className={`p-6 rounded-t-3xl ${scanSource === 'qr' ? 'bg-green-600' : 'bg-blue-600'}`}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <Icon 
                    name={scanSource === 'qr' ? 'qr-code-outline' : 'radio-outline'} 
                    size={28} 
                    color="white" 
                  />
                  <Text className="text-white text-2xl font-bold ml-3">
                    Prenda Encontrada
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setScannedGarment(null)}
                  className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                >
                  <Icon name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <Text className={`text-sm ${scanSource === 'qr' ? 'text-green-100' : 'text-blue-100'}`}>
                Datos obtenidos del código {scanSource === 'qr' ? 'QR' : 'RFID'}
              </Text>
              {/* Indicador de validación - Solo mostrar si hay guía seleccionada y la prenda pertenece */}
              {/* Nota: Este modal solo se muestra cuando la prenda SÍ pertenece a la guía */}
              {guideId && scannedGarment && validateGarmentBelongsToGuide(scannedGarment.rfid_code) && (
                <View className="mt-2 flex-row items-center bg-white/30 rounded-full px-3 py-1.5 self-start border border-white/50">
                  <Icon name="checkmark-circle" size={18} color="white" />
                  <Text className="text-white text-xs ml-2 font-bold">
                    Esta prenda pertenece a esta guía
                  </Text>
                </View>
              )}
            </View>

            {/* Body */}
            {scannedGarment && (
              <View className="p-6">
                {/* RFID */}
                <View className={`mb-4 p-4 rounded-lg border ${scanSource === 'qr' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <Text className="text-sm font-medium mb-1" style={{ color: '#0b1f36' }}>Código RFID</Text>
                  <Text className={`text-2xl font-bold font-mono ${scanSource === 'qr' ? 'text-green-900' : 'text-blue-900'}`}>
                    {scannedGarment.rfid_code}
                  </Text>
                </View>

                {/* Información Principal */}
                <View className="space-y-3 mb-6">
                  {scannedGarment.description && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-600">Descripción:</Text>
                      <Text className="text-sm font-semibold text-gray-900 flex-1 text-right ml-2">
                        {scannedGarment.description}
                      </Text>
                    </View>
                  )}
                  
                  {scannedGarment.color && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-600">Color:</Text>
                      <Text className="text-sm font-semibold text-gray-900 flex-1 text-right ml-2">
                        {Array.isArray(scannedGarment.color) ? scannedGarment.color.join(', ') : scannedGarment.color}
                      </Text>
                    </View>
                  )}

                  {scannedGarment.garment_type && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-600">Tipo:</Text>
                      <Text className="text-sm font-semibold text-gray-900 flex-1 text-right ml-2">
                        {scannedGarment.garment_type}
                      </Text>
                    </View>
                  )}

                  {scannedGarment.garment_brand && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-600">Marca:</Text>
                      <Text className="text-sm font-semibold text-gray-900 flex-1 text-right ml-2">
                        {scannedGarment.garment_brand}
                      </Text>
                    </View>
                  )}

                  {scannedGarment.weight !== undefined && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-600">Peso:</Text>
                      <Text className="text-sm font-semibold text-gray-900 flex-1 text-right ml-2">
                        {scannedGarment.weight} kg
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botones */}
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => setScannedGarment(null)}
                    className="flex-1 bg-gray-100 p-4 rounded-lg items-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      onSelectGarment(scannedGarment.rfid_code);
                      setScannedGarment(null);
                      onClose();
                    }}
                    className={`flex-1 p-4 rounded-lg flex-row items-center justify-center ${scanSource === 'qr' ? 'bg-green-600' : 'bg-blue-600'}`}
                  >
                    <Icon name="arrow-forward-circle-outline" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

