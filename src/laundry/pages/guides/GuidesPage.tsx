import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { useGuides, useCreateGuide, useUpdateGuideStatus, useScanQr } from '@/laundry/hooks/guides';
import { useClients } from '@/laundry/hooks/clients';
import { useInvalidateAuthorization } from '@/laundry/hooks/authorizations';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { GuideForm } from './ui/GuideForm';
import { GuideDetailsModal } from './ui/GuideDetailsModal';
import { ServiceTypeModal } from '@/laundry/components/ServiceTypeModal';
import { GarmentForm } from '@/laundry/pages/garments/ui/GarmentForm';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { QrScanner } from '@/laundry/components';
import { translateEnum } from '@/helpers';

 type GuidesPageProps = { navigation: NativeStackNavigationProp<any> };

export const GuidesPage: React.FC<GuidesPageProps> = ({ navigation, route }: any) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Hooks modulares
  const { guides, isLoading, refetch, total, totalPages, currentPage } = useGuides({ page, limit });
  const { createGuideAsync, isCreating } = useCreateGuide();
  const { updateGuideStatusAsync, isUpdating } = useUpdateGuideStatus();
  const { clients } = useClients({ limit: 50 });
  const { invalidateAuthorizationAsync } = useInvalidateAuthorization();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [isNavigatingToScanner, setIsNavigatingToScanner] = useState(false);
  const prefilledTags = route?.params?.prefilledTags || [];
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const seenSetRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef<boolean>(false);
  const MIN_RSSI = -65;

  // Recargar la lista de guías y manejar el regreso del escáner
  useFocusEffect(
    useCallback(() => {
      refetch();
      
      // Si regresamos del escáner, reabrir el modal
      if (isNavigatingToScanner) {
        setIsNavigatingToScanner(false);
        if (editingId) {
          setFormOpen(true);
        }
      }
    }, [refetch, isNavigatingToScanner, editingId])
  );
  
  // Mantener el modal abierto cuando se regresa del escáner en modo edición
  useEffect(() => {
    if (editingId && !formOpen && !isNavigatingToScanner) {
      // Si estamos editando y el modal se cerró (y no estamos navegando), reabrirlo
      setFormOpen(true);
    }
  }, [editingId, isNavigatingToScanner]);
  
  // Estados para el flujo de servicio personal
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<'industrial' | 'personal'>('industrial');
  const [garmentModalOpen, setGarmentModalOpen] = useState(false);
  const [currentScannedTag, setCurrentScannedTag] = useState<ScannedTag | null>(null);
  const [registeredGarments, setRegisteredGarments] = useState<any[]>([]);
  
  // Estados para QR Scanner
  const [showQrScanner, setShowQrScanner] = useState(false);
  const { scanQrAsync, isScanning: isScanningQr } = useScanQr();
  
  // Estado para el cliente seleccionado
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const demoGuides = [
    { 
      id: 'g-001', 
      guide_number: 'G-0001', 
      client_name: 'Juan Pérez', 
      status: 'IN_PROCESS',
      created_at: '21 de octubre de 2025, 10:30',
      total_garments: 15
    },
    { 
      id: 'g-002', 
      guide_number: 'G-0002', 
      client_name: 'María García', 
      status: 'COMPLETED',
      created_at: '20 de octubre de 2025, 14:15',
      total_garments: 8
    },
    { 
      id: 'g-003', 
      guide_number: 'G-0003', 
      client_name: 'Comercial Andes S.A.', 
      status: 'WASHING',
      created_at: '19 de octubre de 2025, 09:45',
      total_garments: 25
    },
  ];
  const base = guides && guides.length > 0 ? guides : (demoGuides as any[]);

  const clientOptions = useMemo(() => {
    return clients.map(client => ({
      label: client.name,
      value: client.id,
    }));
  }, [clients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((g: any) => [g.guide_number, g.client_name, g.status].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [base, query]);

  const openCreate = () => { 
    setEditingId(null); 
    setShowServiceTypeModal(true); 
  };

  const openDetails = (guide: any) => {
    setSelectedGuide(guide);
    setDetailsOpen(true);
  };

  const openEdit = () => {
    if (selectedGuide) {
      setEditingId(selectedGuide.id);
      setSelectedClientId(selectedGuide.client_id || '');
      setFormOpen(true);
    }
  };

  const onChangeClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleServiceTypeSelect = (serviceType: 'industrial' | 'personal') => {
    setSelectedServiceType(serviceType);
    setShowServiceTypeModal(false);
    
    if (serviceType === 'industrial') {
      // Flujo industrial: abrir formulario directamente
      setFormOpen(true);
    } else {
      // Flujo personal: iniciar escaneo prenda por prenda
      startScanning();
    }
  };

  const closeModal = async () => {
    // Si estaba editando una guía, invalidar la autorización
    if (editingId && selectedGuide) {
      try {
        await invalidateAuthorizationAsync({
          entity_type: 'guides',
          entity_id: selectedGuide.id,
        });
      } catch (error) {
        console.error('Error al invalidar autorización:', error);
      }
    }
    
    setFormOpen(false);
    setScannedTags([]);
    setSelectedClientId('');
    setEditingId(null);
    seenSetRef.current.clear();
    stopScanning();
    if (route?.params?.prefilledTags) {
      // @ts-ignore
      navigation.setParams({ prefilledTags: [] });
    }
  };

  const stopScanning = useCallback(async () => {
    try {
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
      // NO limpiamos seenSetRef aquí para mantener el historial de tags escaneados
    } catch (error) {
      console.error('Error al detener escaneo:', error);
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      isScanningRef.current = true;
      const subscription = rfidModule.addTagListener((tag: ScannedTag) => {
        if (!isScanningRef.current) return;
        if (typeof tag.rssi === 'number' && tag.rssi < MIN_RSSI) return;
        if (seenSetRef.current.has(tag.epc)) return;
        seenSetRef.current.add(tag.epc);
        
        if (selectedServiceType === 'personal') {
          // Flujo personal: detener escaneo y abrir formulario de prenda
          stopScanning();
          setCurrentScannedTag(tag);
          setGarmentModalOpen(true);
        } else {
          // Flujo industrial: continuar escaneando
          setScannedTags(prev => [...prev, tag]);
        }
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
  }, []);

  // Funciones para el flujo de servicio personal
  const handleGarmentSubmit = (garmentData: any) => {
    if (currentScannedTag) {
      const newGarment = {
        ...garmentData,
        rfidCode: currentScannedTag.epc,
        id: `garment-${Date.now()}`,
      };
      
      setRegisteredGarments(prev => [...prev, newGarment]);
      setCurrentScannedTag(null);
      setGarmentModalOpen(false);
      
      // Continuar escaneando
      startScanning();
    }
  };

  const handleGarmentCancel = () => {
    setCurrentScannedTag(null);
    setGarmentModalOpen(false);
    // Continuar escaneando
    startScanning();
  };

  const removeRegisteredGarment = (garmentId: string) => {
    setRegisteredGarments(prev => prev.filter(g => g.id !== garmentId));
    // Remover del seenSet para permitir re-escaneo
    const garment = registeredGarments.find(g => g.id === garmentId);
    if (garment) {
      seenSetRef.current.delete(garment.rfidCode);
    }
  };

  const finishPersonalGuide = () => {
    if (registeredGarments.length === 0) {
      Alert.alert('Error', 'Debe registrar al menos una prenda');
      return;
    }
    
    // Convertir prendas registradas a formato de tags para el formulario
    const garmentTags: ScannedTag[] = registeredGarments.map(g => ({ 
      epc: g.rfidCode, 
      timestamp: Date.now(),
      rssi: 0
    }));
    setScannedTags(garmentTags);
    setFormOpen(true);
    setRegisteredGarments([]);
    stopScanning();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

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
          <Text className="text-lg font-bold text-gray-900 flex-1">GUÍAS</Text>
          
          {/* Botón Escanear QR */}
          <TouchableOpacity 
            onPress={() => setShowQrScanner(true)} 
            className="w-10 h-10 rounded-lg bg-green-600 items-center justify-center active:bg-green-700"
          >
            <IonIcon name="qr-code-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput className="flex-1 h-10 ml-2 text-gray-900" placeholder="Buscar por número, cliente o estado" placeholderTextColor="#9CA3AF" value={query} onChangeText={setQuery} autoCorrect={false} />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <IonIcon name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1">
            {isLoading && guides.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#8EB021" />
            </View>
          ) : !isLoading && filtered.length === 0 ? (
            <Text className="text-gray-500">No se encontraron guías.</Text>
          ) : (
            <View className="-mx-1 flex-row flex-wrap">
            {filtered.map((g: any) => (
              <View key={g.id} className="w-full px-1 mb-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openDetails(g)}
                >
                  <Card padding="md" variant="default">
                    <View className="flex-row items-center">
                      <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
                        <IonIcon name="document-text-outline" size={20} color="#8EB021" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold">{g.guide_number}</Text>
                        <Text className="text-gray-500 text-xs">{g.client_name}</Text>
                      </View>
                      <Text className="text-gray-600 text-xs">{translateEnum(g.status, 'guide_status')}</Text>
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

      {/* Interfaz para prendas registradas (Servicio Personal) */}
      {selectedServiceType === 'personal' && registeredGarments.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              Prendas Registradas ({registeredGarments.length})
            </Text>
            <TouchableOpacity
              onPress={finishPersonalGuide}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#0b1f36' }}
            >
              <Text className="text-white font-medium">Finalizar Guía</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {registeredGarments.map((garment) => (
                <View key={garment.id} className="bg-gray-50 rounded-lg p-3 min-w-[200px]">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                        {garment.description || 'Sin descripción'}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        RFID: {garment.rfidCode.substring(0, 12)}...
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeRegisteredGarment(garment.id)}
                      className="ml-2"
                    >
                      <IonIcon name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Modal de Detalles */}
      <GuideDetailsModal
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        guide={selectedGuide}
        onEdit={openEdit}
      />

      {/* Modal de Formulario */}
      <Modal visible={formOpen || prefilledTags.length > 0} transparent animationType="slide" onRequestClose={closeModal}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">{editingId ? 'Editar Guía' : 'Nueva Guía'}</Text>
            <TouchableOpacity onPress={closeModal}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GuideForm
            clientOptions={clientOptions}
            selectedClientId={selectedClientId}
            onChangeClient={onChangeClient}
            guideItems={(() => {
              const allTags = [...prefilledTags, ...scannedTags];
              const uniqueEPCs = new Set<string>();
              return allTags
                .filter((t: any) => {
                  const epc = t.epc || t.tagEPC;
                  if (uniqueEPCs.has(epc)) return false;
                  uniqueEPCs.add(epc);
                  return true;
                })
                .map((t: any) => ({ tagEPC: t.epc || t.tagEPC, proceso: '' }));
            })()}
            onRemoveItem={(epc) => {
              setScannedTags(prev => prev.filter(t => t.epc !== epc));
              seenSetRef.current.delete(epc);
            }}
            onScan={() => {
              if (isScanning) {
                stopScanning();
              } else {
                startScanning();
              }
            }}
            onSubmit={async () => {
              // Si estaba editando, invalidar la autorización
              if (editingId && selectedGuide) {
                try {
                  await invalidateAuthorizationAsync({
                    entity_type: 'guides',
                    entity_id: selectedGuide.id,
                  });
                } catch (error) {
                  console.error('Error al invalidar autorización:', error);
                }
              }
              
              setFormOpen(false);
              setScannedTags([]);
              seenSetRef.current.clear();
              stopScanning();
              // Limpiar tags escaneados al cerrar
              if (route?.params?.prefilledTags) {
                // @ts-ignore
                navigation.setParams({ prefilledTags: [] });
              }
            }}
            showScanButton={editingId ? true : prefilledTags.length === 0}
            isScanning={isScanning}
            onNavigate={(route: string, params?: any) => {
              // Marcar que estamos navegando al escáner para mantener el estado
              if (route === 'ScanClothes') {
                setIsNavigatingToScanner(true);
              }
              // @ts-ignore
              navigation.navigate(route, params);
            }}
            guideToEdit={editingId ? selectedGuide : undefined}
          />
        </View>
      </Modal>

      {/* Modal de Selección de Tipo de Servicio */}
      <ServiceTypeModal
        visible={showServiceTypeModal}
        onClose={() => setShowServiceTypeModal(false)}
        onSelectService={handleServiceTypeSelect}
        title="Seleccionar Tipo de Servicio"
      />

      {/* Modal de Formulario de Prenda (Servicio Personal) */}
      <Modal visible={garmentModalOpen} transparent animationType="slide" onRequestClose={handleGarmentCancel}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <View className="flex-row items-center flex-1">
              <IonIcon name="shirt-outline" size={24} color="#3B82F6" />
              <Text className="text-xl font-bold text-gray-900 ml-2">Registrar Prenda</Text>
            </View>
            <TouchableOpacity onPress={handleGarmentCancel}>
              <IonIcon name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View className="px-4 py-2">
            <Text className="text-sm text-gray-600 mb-4">
              RFID detectado: {currentScannedTag?.epc}
            </Text>
          </View>
          <GarmentForm
            rfidCode={currentScannedTag?.epc || ''}
            onSubmit={handleGarmentSubmit}
            submitting={false}
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
              const guide = await scanQrAsync(qrData);
              setSelectedGuide(guide);
              setDetailsOpen(true);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo escanear el código QR');
            }
          }}
        />
      )}
    </MainLayout>
  );
}

export default GuidesPage;


