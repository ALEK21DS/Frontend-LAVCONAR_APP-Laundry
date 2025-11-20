import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { GarmentForm } from './ui/GarmentForm';
import { GarmentDetailsModal } from './ui/GarmentDetailsModal';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { useGarments, useCreateGarment, useUpdateGarment, useScanGarmentQr } from '@/laundry/hooks/guides';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QrScanner } from '@/laundry/components';

type GarmentsPageProps = { navigation: NativeStackNavigationProp<any> };

export const GarmentsPage: React.FC<GarmentsPageProps> = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Hooks modulares
  const { garments, isLoading, refetch, total, totalPages, currentPage } = useGarments({ page, limit });
  const { createGarmentAsync, isCreating } = useCreateGarment();
  const { updateGarmentAsync, isUpdating } = useUpdateGarment();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<any | null>(null);
  const [editingGarment, setEditingGarment] = useState<any | null>(null);
  const [initialValues, setInitialValues] = useState<any | undefined>(undefined);
  const [rfidCode, setRfidCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const seenSetRef = useRef<Set<string>>(new Set());
  // QR
  const [showQrScanner, setShowQrScanner] = useState(false);
  const { scanGarmentQrAsync, isScanning: isScanningQr } = useScanGarmentQr();

  // Recargar la lista de prendas cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const demoGarments = [
    { id: 'gm-001', rfid_code: 'E280-...-01', description: 'Camisa blanca', color: 'Blanco', weight: 0.3, is_active: true, created_at: '', updated_at: '' },
    { id: 'gm-002', rfid_code: 'E280-...-02', description: 'Sábana king', color: 'Blanco', weight: 1.2, is_active: true, created_at: '', updated_at: '' },
  ];

  const base = garments && garments.length > 0 ? garments : demoGarments;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(g => [g.description, g.rfid_code].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [query, base]);

  const openCreate = () => {
    setEditingGarment(null);
    setInitialValues(undefined);
    setRfidCode('');
    setFormOpen(true);
  };

  const openDetails = (garment: any) => {
    setSelectedGarment(garment);
    setDetailsOpen(true);
  };

  const openEdit = () => {
    if (selectedGarment) {
      setEditingGarment(selectedGarment);
      setInitialValues({
        rfidCode: selectedGarment.rfid_code,
        description: selectedGarment.description || '',
        colors: Array.isArray(selectedGarment.color) ? selectedGarment.color : (selectedGarment.color ? [selectedGarment.color] : []),
        garmentType: selectedGarment.garment_type || '',
        brand: selectedGarment.garment_brand || '',
        garmentCondition: Array.isArray(selectedGarment.garment_condition) 
          ? selectedGarment.garment_condition.filter((c: any): c is string => typeof c === 'string' && c.trim() !== '').join(', ')
          : (selectedGarment.garment_condition || ''),
        physicalCondition: Array.isArray(selectedGarment.physical_condition)
          ? selectedGarment.physical_condition.filter((c: any): c is string => typeof c === 'string' && c.trim() !== '').join(', ')
          : (selectedGarment.physical_condition || ''),
        observations: selectedGarment.observations || '',
        weight: selectedGarment.weight?.toString() || '',
        quantity: selectedGarment.quantity !== undefined && selectedGarment.quantity !== null 
          ? selectedGarment.quantity.toString() 
          : undefined,
        serviceType: selectedGarment.service_type || '',
        manufacturingDate: selectedGarment.manufacturing_date || '',
      });
      setRfidCode(selectedGarment.rfid_code || '');
      setFormOpen(true);
    }
  };


  return (
    <MainLayout 
      activeTab="Guides" 
      onNavigate={(route: string, params?: any) => {
        // @ts-ignore
        navigation.navigate(route, params);
      }}
    >
      <View className="px-4 pt-4 flex-1">
        <View className="flex-row items-center mb-4">
          <Text className="text-lg font-bold text-gray-900 flex-1">PRENDAS</Text>
          {/* Botón Escanear QR */}
          <TouchableOpacity 
            onPress={() => setShowQrScanner(true)} 
            disabled={isScanningQr}
            className="w-10 h-10 rounded-lg bg-green-600 items-center justify-center active:bg-green-700"
          >
            <IonIcon name="qr-code-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 h-10 ml-2 text-gray-900"
            placeholder="Buscar por descripción, EPC o guía"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <IonIcon name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1">
          {isLoading && garments.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#8EB021" />
            </View>
          ) : !isLoading && filtered.length === 0 ? (
            <Text className="text-gray-500">No se encontraron prendas.</Text>
          ) : (
            <View className="-mx-1 flex-row flex-wrap">
            {filtered.map(item => (
                <View key={item.id} className="w-full px-1 mb-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openDetails(item)}
                  >
                    <Card padding="md" variant="default">
                      <View className="flex-row items-center">
                      <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
                        <IonIcon name="shirt-outline" size={20} color="#8EB021" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold">
                            {item.rfid_code || 'Sin código'}
                          </Text>
                          <Text className="text-gray-500 text-xs">{item.description || 'Sin descripción'}</Text>
                          {/* Peso ocultado por solicitud */}
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
            ))}
            </View>
          )}
        </ScrollView>

        {/* Controles de paginación */}
        {totalPages > 1 && (
          <View className="border-t border-gray-200 bg-white p-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex-row items-center px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-100' : ''}`}
                style={{ backgroundColor: currentPage === 1 ? undefined : '#0b1f36' }}
              >
                <IonIcon 
                  name="chevron-back" 
                  size={18} 
                  color={currentPage === 1 ? '#9CA3AF' : '#FFFFFF'} 
                />
              </TouchableOpacity>

              <View className="flex-row items-center">
                <Text className="text-gray-600 font-medium">
                  Página {currentPage} de {totalPages}
                </Text>
                <Text className="text-gray-400 text-sm ml-2">
                  ({total} total)
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex-row items-center px-4 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-100' : ''}`}
                style={{ backgroundColor: currentPage === totalPages ? undefined : '#0b1f36' }}
              >
                
                <IonIcon 
                  name="chevron-forward" 
                  size={18} 
                  color={currentPage === totalPages ? '#9CA3AF' : '#FFFFFF'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Modal de Detalles */}
      <GarmentDetailsModal
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        garment={selectedGarment}
        onEdit={openEdit}
      />

      {/* Modal de Formulario */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">
              {editingGarment ? 'Editar Prenda' : 'Nueva Prenda'}
            </Text>
            <TouchableOpacity onPress={() => {
              setFormOpen(false);
              setEditingGarment(null);
              setInitialValues(undefined);
              setRfidCode('');
            }}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GarmentForm
            rfidCode={rfidCode}
            submitting={isCreating || isUpdating}
            initialValues={initialValues}
            onScan={editingGarment ? undefined : async () => {
              try {
                if (isScanning) {
                  setIsScanning(false);
                  isScanningRef.current = false;
                  if ((global as any).garmentScanSub) {
                    (global as any).garmentScanSub.remove();
                    (global as any).garmentScanSub = null;
                  }
                  if ((global as any).garmentScanErrSub) {
                    (global as any).garmentScanErrSub.remove();
                    (global as any).garmentScanErrSub = null;
                  }
                  try { await rfidModule.stopScan(); } catch {}
                  seenSetRef.current.clear();
                  return;
                }
                setIsScanning(true);
                isScanningRef.current = true;
                const sub = rfidModule.addTagListener(async (tag: ScannedTag) => {
                  if (!isScanningRef.current) return;
                  if (seenSetRef.current.has(tag.epc)) return;
                  seenSetRef.current.add(tag.epc);
                  
                  // Detener escaneo primero
                  setIsScanning(false);
                  isScanningRef.current = false;
                  try { rfidModule.stopScan(); } catch {}
                  if ((global as any).garmentScanSub) { (global as any).garmentScanSub.remove(); (global as any).garmentScanSub = null; }
                  if ((global as any).garmentScanErrSub) { (global as any).garmentScanErrSub.remove(); (global as any).garmentScanErrSub = null; }
                  
                   // Verificar si el RFID ya existe en el backend
                   try {
                     // Verificar token primero
                     const token = await AsyncStorage.getItem('auth-token');
                     if (!token) {
                       Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión');
                       setFormOpen(false);
                       return;
                     }
                     
                     const response = await garmentsApi.get<any>('/get-all-garments', {
                       params: { search: tag.epc, limit: 100 }
                     });
                     
                     const garments = response.data?.data || [];
                     const existingGarment = garments.find((g: any) => 
                       g.rfid_code.trim().toUpperCase() === tag.epc.trim().toUpperCase()
                     );
                     
                     if (existingGarment) {
                       // Si existe, mostrar alerta y cerrar el modal
                       Alert.alert(
                         'Código ya registrado',
                         '',
                         [
                           { 
                             text: 'OK',
                             onPress: () => {
                               setFormOpen(false);
                               setRfidCode('');
                             }
                           }
                         ]
                       );
                       seenSetRef.current.clear();
                     } else {
                      // No existe, asignar el código normalmente
                      setRfidCode(tag.epc);
                      seenSetRef.current.clear();
                    }
                  } catch (error: any) {
                    const errorStatus = error?.response?.status;
                    
                    // Error 404 es normal (no existe, OK para crear)
                    if (errorStatus === 404) {
                      setRfidCode(tag.epc);
                      seenSetRef.current.clear();
                    } 
                    // Error 401: Token expirado
                    else if (errorStatus === 401) {
                      await AsyncStorage.multiRemove(['auth-token', 'auth-user']);
                      Alert.alert(
                        'Sesión expirada',
                        'Por favor, vuelve a iniciar sesión',
                        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                      );
                      setFormOpen(false);
                    } 
                    // Otros errores
                    else {
                      console.error('Error al verificar RFID:', error);
                      Alert.alert('Error', 'No se pudo verificar el código');
                      setRfidCode('');
                      seenSetRef.current.clear();
                    }
                  }
                });
                // @ts-ignore
                (global as any).garmentScanSub = sub;
                const errSub = rfidModule.addErrorListener(() => {});
                // @ts-ignore
                (global as any).garmentScanErrSub = errSub;
                await rfidModule.startScan();
              } catch (e) {
                setIsScanning(false);
                isScanningRef.current = false;
              }
            }}
            isScanning={isScanning}
            onSubmit={async (data) => {
              try {
                // Verificar token primero
                const token = await AsyncStorage.getItem('auth-token');
                if (!token) {
                  Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión');
                  setFormOpen(false);
                  return;
                }
                
                // MODO EDICIÓN
                if (editingGarment) {
                  await updateGarmentAsync({
                    id: editingGarment.id,
                    data: {
                      description: data.description,
                      color: data.colors && data.colors.length > 0 ? data.colors : undefined,
                      garment_type: data.garmentType || undefined,
                      garment_brand: data.brand || undefined,
                      garment_condition: data.garmentCondition || undefined,
                      physical_condition: data.physicalCondition || undefined,
                      observations: data.observations || undefined,
                      weight: data.weight ? parseFloat(String(data.weight)) : undefined,
                      quantity: data.quantity ? parseInt(String(data.quantity)) : undefined,
                      service_type: data.serviceType || undefined,
                      manufacturing_date: data.manufacturingDate || undefined,
                    } as any
                  });
                  console.log('✅ Prenda actualizada exitosamente');
                  setFormOpen(false);
                  setEditingGarment(null);
                  setInitialValues(undefined);
                  setRfidCode('');
                  refetch(); // Recargar la lista de prendas
                  return;
                }
                
                // MODO CREACIÓN
                const finalRfidCode = data.rfidCode || rfidCode;
                
                // Verificar si el RFID ya existe antes de crear
                const response = await garmentsApi.get<any>('/get-all-garments', {
                  params: { search: finalRfidCode, limit: 100 }
                });
                
                const garments = response.data?.data || [];
                const existingGarment = garments.find((g: any) => 
                  g.rfid_code?.trim().toUpperCase() === finalRfidCode.trim().toUpperCase()
                );
                
                if (existingGarment) {
                  Alert.alert('Código ya registrado', 'Este código RFID ya está asignado a otra prenda');
                  return;
                }
                
                // Si no existe, crear normalmente
                await createGarmentAsync({
                  rfid_code: finalRfidCode,
                  description: data.description,
                  color: data.colors && data.colors.length > 0 ? data.colors : undefined,
                  garment_type: data.garmentType,
                  garment_brand: data.brand,
                  garment_condition: data.garmentCondition && data.garmentCondition.length > 0 ? data.garmentCondition : undefined,
                  physical_condition: data.physicalCondition && data.physicalCondition.length > 0 ? data.physicalCondition : undefined,
                  observations: data.observations,
                  weight: data.weight ? parseFloat(String(data.weight)) : undefined,
                  quantity: data.quantity ? parseInt(String(data.quantity)) : undefined,
                  service_type: data.serviceType,
                  manufacturing_date: data.manufacturingDate,
                } as any);
                console.log('✅ Prenda creada exitosamente');
                setFormOpen(false);
                setRfidCode('');
              } catch (error: any) {
                const errorStatus = error?.response?.status;
                
                // Error 404 es OK para creación (no existe, podemos crear)
                if (errorStatus === 404 && !editingGarment) {
                  try {
                    await createGarmentAsync({
                      rfid_code: data.rfidCode || rfidCode,
                      description: data.description,
                      color: data.colors && data.colors.length > 0 ? data.colors : undefined,
                      garment_type: data.garmentType,
                      garment_brand: data.brand,
                      garment_condition: data.garmentCondition && data.garmentCondition.length > 0 ? data.garmentCondition : undefined,
                      physical_condition: data.physicalCondition && data.physicalCondition.length > 0 ? data.physicalCondition : undefined,
                      observations: data.observations,
                      weight: data.weight ? parseFloat(String(data.weight)) : undefined,
                      quantity: data.quantity ? parseInt(String(data.quantity)) : undefined,
                      service_type: data.serviceType,
                      manufacturing_date: data.manufacturingDate,
                    } as any);
                    console.log('✅ Prenda creada exitosamente');
                    setFormOpen(false);
                    setRfidCode('');
                  } catch (createError) {
                    console.error('❌ Error al crear prenda:', createError);
                    Alert.alert('Error', 'No se pudo crear la prenda');
                  }
                } 
                // Error 401: Token expirado
                else if (errorStatus === 401) {
                  await AsyncStorage.multiRemove(['auth-token', 'auth-user']);
                  Alert.alert(
                    'Sesión expirada',
                    'Por favor, vuelve a iniciar sesión',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                  );
                  setFormOpen(false);
                }
                // Otros errores
                else {
                  console.error('❌ Error al procesar prenda:', error);
                  Alert.alert('Error', editingGarment ? 'No se pudo actualizar la prenda' : 'Ocurrió un error al crear la prenda');
                }
              }
            }}
          />
        </View>
      </Modal>
      {/* Escáner QR */}
      {showQrScanner && (
        <QrScanner
          visible={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={async (qrData: string) => {
            setShowQrScanner(false);
            try {
              const garment = await scanGarmentQrAsync(qrData);
              if (garment) {
                setSelectedGarment(garment);
                setDetailsOpen(true);
              } else {
                Alert.alert('No encontrado', 'No se encontró la prenda para este QR');
              }
            } catch (error: any) {
              const message = error?.message || 'No se pudo escanear el código QR de la prenda';
              Alert.alert('Error', message);
            }
          }}
        />
      )}
    </MainLayout>
  );
};

export default GarmentsPage;


