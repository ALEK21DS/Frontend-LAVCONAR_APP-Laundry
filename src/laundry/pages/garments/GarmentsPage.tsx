import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { GarmentForm } from './ui/GarmentForm';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { useGarments, useCreateGarment, useUpdateGarment, useDeleteGarment } from '@/laundry/hooks/garments';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type GarmentsPageProps = { navigation: NativeStackNavigationProp<any> };

export const GarmentsPage: React.FC<GarmentsPageProps> = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Hooks modulares
  const { garments, isLoading, refetch, total, totalPages, currentPage } = useGarments({ page, limit });
  const { createGarmentAsync, isCreating } = useCreateGarment();
  const { updateGarmentAsync, isUpdating } = useUpdateGarment();
  const { deleteGarment, isDeleting } = useDeleteGarment();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [rfidCode, setRfidCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const seenSetRef = useRef<Set<string>>(new Set());

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
          <Text className="text-2xl font-bold text-gray-900 flex-1">Prendas</Text>
          <TouchableOpacity onPress={() => { setFormOpen(true); setRfidCode(''); }} className="w-10 h-10 rounded-lg bg-blue-600 items-center justify-center active:bg-blue-700">
            <IonIcon name="add" size={20} color="#ffffff" />
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
              <ActivityIndicator size="large" color="#1f4eed" />
            </View>
          ) : !isLoading && filtered.length === 0 ? (
            <Text className="text-gray-500">No se encontraron prendas.</Text>
          ) : (
            <View className="-mx-1 flex-row flex-wrap">
            {filtered.map(item => (
              <View key={item.id} className="w-full px-1 mb-2">
                  <Card padding="md" variant="default">
                    <View className="flex-row items-center">
                      <View className="bg-blue-50 rounded-lg p-2 mr-3">
                        <IonIcon name="shirt-outline" size={20} color="#1f4eed" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold">
                          {item.rfid_code || 'Sin código'}
                        </Text>
                        <Text className="text-gray-500 text-xs">{item.description || 'Sin descripción'}</Text>
                        {item.weight && (
                          <Text className="text-gray-400 text-xs mt-1">Peso: {item.weight} kg</Text>
                        )}
                      </View>
                    </View>
                  </Card>
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
                className={`flex-row items-center px-4 py-2 rounded-lg ${
                  currentPage === 1 ? 'bg-gray-100' : 'bg-blue-600'
                }`}
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
                className={`flex-row items-center px-4 py-2 rounded-lg ${
                  currentPage === totalPages ? 'bg-gray-100' : 'bg-blue-600'
                }`}
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
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">Nueva Prenda</Text>
            <TouchableOpacity onPress={() => setFormOpen(false)}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GarmentForm
            rfidCode={rfidCode}
            submitting={isCreating}
            onScan={async () => {
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
                 const finalRfidCode = data.rfidCode || rfidCode;
                 
                 // Verificar token primero
                 const token = await AsyncStorage.getItem('auth-token');
                 if (!token) {
                   Alert.alert('Sesión expirada', 'Por favor, vuelve a iniciar sesión');
                   setFormOpen(false);
                   return;
                 }
                 
                 // Verificar una vez más antes de crear (por si escribieron manualmente)
                 const response = await garmentsApi.get<any>('/get-all-garments', {
                   params: { search: finalRfidCode, limit: 100 }
                 });
                 
                 const garments = response.data?.data || [];
                 const existingGarment = garments.find((g: any) => 
                   g.rfid_code.trim().toUpperCase() === finalRfidCode.trim().toUpperCase()
                 );
                 
                 if (existingGarment) {
                   Alert.alert('Código ya registrado');
                   return;
                 }
                 
                 // Si no existe, crear normalmente
                 await createGarmentAsync({
                   rfid_code: finalRfidCode,
                   description: data.description,
                   color: data.color,
                   observations: data.observations,
                   weight: data.weight,
                 });
                 setFormOpen(false);
                 setRfidCode('');
               } catch (error: any) {
                 const errorStatus = error?.response?.status;
                 
                 // Error 404 es OK (no existe, podemos crear)
                 if (errorStatus === 404) {
                   try {
                     await createGarmentAsync({
                       rfid_code: data.rfidCode || rfidCode,
                       description: data.description,
                       color: data.color,
                       observations: data.observations,
                       weight: data.weight,
                     });
                     setFormOpen(false);
                     setRfidCode('');
                   } catch (createError) {
                     console.error('Error al crear prenda:', createError);
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
                   console.error('Error al verificar/crear prenda:', error);
                   Alert.alert('Error', 'Ocurrió un error al procesar la prenda');
                 }
               }
             }}
          />
        </View>
      </Modal>
    </MainLayout>
  );
};

export default GarmentsPage;


