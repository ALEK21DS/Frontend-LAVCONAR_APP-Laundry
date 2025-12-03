import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card, PaginationControls } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { useGuides, useCreateGuide, useUpdateGuideStatus, useScanQr, useUpdateGuide } from '@/laundry/hooks/guides';
import { useClients } from '@/laundry/hooks/clients';
import { useInvalidateAuthorization } from '@/laundry/hooks/authorizations';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { GuideForm } from './ui/GuideForm';
import { ServiceTypeModal } from '@/laundry/components/ServiceTypeModal';
import { GarmentForm } from '@/laundry/pages/garments/ui/GarmentForm';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { QrScanner } from '@/laundry/components';
import { GuideDetailsModal } from './ui/GuideDetailsModal';
import { useCatalogLabelMap } from '@/laundry/hooks';
import { GUIDE_STATUS_COLORS } from '@/constants/processes';
import { useAuthStore } from '@/auth/store/auth.store';
import { isSuperAdminUser, getPreferredBranchOfficeId } from '@/helpers/user.helper';
import { useNotificationsStore } from '@/laundry/store/notifications.store';

 type GuidesPageProps = { navigation: NativeStackNavigationProp<any> };

export const GuidesPage: React.FC<GuidesPageProps> = ({ navigation, route }: any) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Hooks modulares
  const { guides, isLoading, refetch, total, totalPages, currentPage } = useGuides({ page, limit });
  const { createGuideAsync, isCreating } = useCreateGuide();
  const { updateGuideAsync } = useUpdateGuide();
  const { updateGuideStatusAsync, isUpdating } = useUpdateGuideStatus();
  // Estado para la sucursal seleccionada (para filtrar clientes)
  const { user } = useAuthStore();
  const isSuperAdmin = isSuperAdminUser(user);
  const userBranchOfficeId = getPreferredBranchOfficeId(user) || '';
  const [selectedBranchOfficeId, setSelectedBranchOfficeId] = useState<string>(userBranchOfficeId);
  // Pasar branch_office_id al hook de clientes para filtrar en el backend
  // Para superadmin, usar selectedBranchOfficeId; para admin, usar userBranchOfficeId
  const effectiveBranchOfficeId = isSuperAdmin && selectedBranchOfficeId 
    ? selectedBranchOfficeId 
    : (!isSuperAdmin ? userBranchOfficeId : undefined);
  
  const { clients } = useClients({ 
    limit: 50,
    branch_office_id: effectiveBranchOfficeId || undefined,
    only_active_status: true // Solo clientes activos en selectores
  });
  const { invalidateAuthorizationAsync } = useInvalidateAuthorization();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
  const [editingGuide, setEditingGuide] = useState<any | null>(null); // Guía siendo editada
  
  // Usar editingGuide para pasarlo al formulario
  const guideToEdit = editingId ? editingGuide : undefined;
  const [isNavigatingToScanner, setIsNavigatingToScanner] = useState(false);
  const prefilledTags = route?.params?.prefilledTags || [];
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const { getLabel: getGuideStatusLabel, isLoading: isLoadingGuideStatus } = useCatalogLabelMap('guide_status', { forceFresh: true });

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
  const authorizationIdRef = React.useRef<string | null>(null); // Usar ref para preservar el ID
  const [approvedActionType, setApprovedActionType] = useState<'UPDATE' | 'DELETE' | null>(null);
  const [fromNotification, setFromNotification] = useState(false); // Flag para saber si viene de notificación
  const { markAsProcessed } = useNotificationsStore();

  // Detectar si venimos de una notificación y abrir el modal automáticamente
  useEffect(() => {
    const openEntityId = route?.params?.openEntityId;
    const authorizationId = route?.params?.authorizationId;
    const actionType = route?.params?.actionType;
    
    // Solo procesar si hay un openEntityId Y authorizationId válidos
    if (openEntityId && authorizationId && guides && guides.length > 0) {
      const guideToOpen = guides.find((g: any) => g.id === openEntityId);
      if (guideToOpen) {
        authorizationIdRef.current = authorizationId; // Guardar en ref (no se limpia)
        setFromNotification(true);
        setSelectedGuide(guideToOpen);
        setDetailsOpen(true);
        setApprovedActionType(actionType || null);
        
        // Limpiar los parámetros para evitar que se abra de nuevo
        navigation.setParams({ openEntityId: undefined, authorizationId: undefined, actionType: undefined });
      }
    }
  }, [route?.params?.openEntityId, route?.params?.authorizationId, guides, navigation]);

  // Refs para control de escaneo RFID
  const isScanningRef = useRef<boolean>(false);
  const seenSetRef = useRef<Set<string>>(new Set());
  const MIN_RSSI = -65; // Sensibilidad mínima para tags RFID

  const base = guides || [];

  const clientOptions = useMemo(() => {
    const normalizedType = selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL';
    // Filtrar por tipo de servicio (el backend ya filtra por sucursal)
    let filteredClients = clients.filter(client => {
      const matchesServiceType = (client.service_type || '').toUpperCase() === normalizedType;
      return matchesServiceType;
    });
    
    let options = filteredClients.map(client => ({
      label: client.acronym ? `${client.name} (${client.acronym})` : client.name,
      value: client.id,
      serviceType: (client.service_type || '').toUpperCase(),
      acronym: client.acronym,
    }));

    if (selectedClientId && !options.some(opt => opt.value === selectedClientId)) {
      const fallbackClient = clients.find(client => client.id === selectedClientId);
      if (fallbackClient) {
        options = [
          ...options,
          {
            label: fallbackClient.acronym ? `${fallbackClient.name} (${fallbackClient.acronym})` : fallbackClient.name,
            value: fallbackClient.id,
            serviceType: (fallbackClient.service_type || '').toUpperCase(),
            acronym: fallbackClient.acronym,
          },
        ];
      }
    }

    return options;
  }, [clients, selectedServiceType, selectedClientId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    
    return base.filter((g: any) => {
      const searchableFields = [
        g.guide_number,
        g.client_name,
        g.client?.name,
        g.client_acronym,
        g.client?.acronym,
        g.status,
      ];
      
      return searchableFields
        .filter(Boolean)
        .some((value: any) => String(value).toLowerCase().includes(q));
    });
  }, [base, query]);

  const openCreate = () => { 
    setEditingId(null);
    // Resetear sucursal al valor por defecto del usuario al crear nueva guía
    if (isSuperAdmin) {
      setSelectedBranchOfficeId(userBranchOfficeId);
    }
    setShowServiceTypeModal(true); 
  };

  const openDetails = (guide: any) => {
    setSelectedGuide(guide);
    setDetailsOpen(true);
  };

  const openEdit = () => {
    if (selectedGuide) {
      setEditingId(selectedGuide.id);
      setEditingGuide(selectedGuide); // Guardar la guía en estado separado
      setSelectedClientId(selectedGuide.client_id || '');
      // Sincronizar sucursal de la guía con el estado de filtrado de clientes
      if (isSuperAdmin && selectedGuide.branch_office_id) {
        setSelectedBranchOfficeId(selectedGuide.branch_office_id);
      }
      if (selectedGuide.service_type) {
        setSelectedServiceType(selectedGuide.service_type === 'PERSONAL' ? 'personal' : 'industrial');
      }
      setFormOpen(true);
      // NO marcar como procesada aquí, solo cuando se guarde exitosamente
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedGuide(null);
    setApprovedActionType(null);
  };

  const handleDeleteComplete = () => {
    // Marcar la notificación como procesada si venía de una notificación
    if (authorizationIdRef.current) {
      markAsProcessed(authorizationIdRef.current);
      authorizationIdRef.current = null;
      setFromNotification(false);
    }
  };

  const onChangeClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };
  
  // Callback para cuando GuideForm cambia la sucursal (solo para superadmin)
  const onChangeBranchOffice = (branchOfficeId: string) => {
    setSelectedBranchOfficeId(branchOfficeId);
    // Limpiar cliente cuando cambia la sucursal
    setSelectedClientId('');
  };

  const handleServiceTypeSelect = (serviceType: 'industrial' | 'personal') => {
    setSelectedServiceType(serviceType);
    setSelectedClientId('');
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
    if (editingId && guideToEdit) {
      try {
        await invalidateAuthorizationAsync({
          entity_type: 'guides',
          entity_id: guideToEdit.id,
        });
      } catch (error) {
        console.error('Error al invalidar autorización:', error);
      }
    }
    
    setFormOpen(false);
    setScannedTags([]);
    setSelectedClientId('');
    setEditingId(null);
    setEditingGuide(null); // Limpiar la guía en edición
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
      } catch (error) {
        // Ignorar errores al detener escaneo (puede que ya esté detenido)
      }
      // NO limpiamos seenSetRef aquí para mantener el historial de tags escaneados
    } catch (error) {
      // Ignorar errores silenciosamente para evitar errores en pantalla
      // El error original era que isScanningRef no existía, ahora ya está declarado
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
      isScanningRef.current = false;
    }
  }, [selectedServiceType, stopScanning]);

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
          <TextInput
            className="flex-1 h-10 ml-2 text-gray-900"
            placeholder="Buscar por número, cliente, acrónimo o estado"
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
            {isLoading && guides.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#8EB021" />
            </View>
          ) : !isLoading && filtered.length === 0 ? (
            <Text className="text-gray-500">No se encontraron guías.</Text>
          ) : (
            <View className="-mx-1 flex-row flex-wrap">
            {filtered.map((g: any) => {
              const statusColor = GUIDE_STATUS_COLORS[g.status as keyof typeof GUIDE_STATUS_COLORS] || '#6B7280';
              const statusLabel = isLoadingGuideStatus 
                ? 'Cargando...' 
                : getGuideStatusLabel(g.status, g.status_label || g.status || '—');
              
              return (
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
                      <View className="flex-1 mr-2">
                        <Text className="text-gray-900 font-semibold">{g.guide_number}</Text>
                        <Text className="text-gray-500 text-xs">
                          {g.client_name || g.client?.name || 'Sin cliente'}
                          {g.client_acronym || g.client?.acronym ? ` (${g.client_acronym || g.client?.acronym})` : ''}
                        </Text>
                      </View>
                      {/* Badge de estado con color */}
                      <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: statusColor + '20' }}>
                        <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: statusColor }} />
                        <Text className="text-xs font-medium" numberOfLines={1} style={{ color: statusColor }}>
                          {statusLabel}
                        </Text>
                      </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              );
            })}
            </View>
          )}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </ScrollView>
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

      {/* Modal de Detalles de Guía (componente unificado) */}
      <GuideDetailsModal
        visible={detailsOpen}
        onClose={handleCloseDetails}
        guide={selectedGuide}
        onEdit={openEdit}
        onDelete={handleDeleteComplete}
        hasPreApprovedAuthorization={fromNotification}
        approvedActionType={approvedActionType}
      />

      {/* Modal de Formulario */}
      {(formOpen || prefilledTags.length > 0) && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={closeModal}>
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
            onChangeBranchOffice={onChangeBranchOffice}
            initialServiceType={
              (editingId && guideToEdit?.service_type) ||
              (selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL')
            }
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
            onSubmit={async (result) => {
              try {
                // Usar el ref que nunca se limpia
                const authIdToProcess = authorizationIdRef.current;
                
                // Si estaba editando, guardar los cambios
                if (editingId && guideToEdit) {
                  const { guideData } = result;
                  const authIdToProcess = authorizationIdRef.current;
                  await updateGuideAsync({ id: editingId, data: guideData });
                  Alert.alert('Guía actualizada', 'Los datos de la guía fueron actualizados correctamente');
                  
                  // Invalidar la autorización
                  try {
                    await invalidateAuthorizationAsync({
                      entity_type: 'guides',
                      entity_id: guideToEdit.id,
                    });
                  } catch (error) {
                    console.error('Error al invalidar autorización:', error);
                  }
                  
                  // Marcar notificación como procesada solo después de guardar exitosamente
                  if (authIdToProcess) {
                    markAsProcessed(authIdToProcess);
                    authorizationIdRef.current = null; // Limpiar después de marcar
                    setFromNotification(false);
                  }
                  refetch();
                } else {
                  // Modo crear: navegar a ScanClothes para completar el proceso
                  // (este era el flujo original)
                  navigation.navigate('ScanClothes', {
                    mode: 'create',
                    guideData: result.guideData,
                    draftValues: result.draftValues,
                  });
                  return; // No cerrar el modal aún en modo creación
                }
                
                setFormOpen(false);
                setScannedTags([]);
                seenSetRef.current.clear();
                stopScanning();
                setEditingId(null);
                setEditingGuide(null); // Limpiar la guía en edición
                setSelectedGuide(null);
                setApprovedActionType(null);
                // Limpiar tags escaneados al cerrar
                if (route?.params?.prefilledTags) {
                  // @ts-ignore
                  navigation.setParams({ prefilledTags: [] });
                }
              } catch (error: any) {
                const message = error?.response?.data?.message || error?.message || 'No se pudo actualizar la guía';
                Alert.alert('Error', message);
              }
            }}
            showScanButton={editingId ? false : prefilledTags.length === 0}
            isScanning={isScanning}
            onNavigate={(route: string, params?: any) => {
              // Marcar que estamos navegando al escáner para mantener el estado
              if (route === 'ScanClothes') {
                setIsNavigatingToScanner(true);
              }
              // @ts-ignore
              navigation.navigate(route, params);
            }}
            guideToEdit={guideToEdit}
          />
        </View>
      </Modal>
      )}

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
              // Normalizar el objeto guide: si viene con client.name pero no client_name, extraerlo
              const normalizedGuide = {
                ...guide,
                client_name: guide.client_name || guide.client?.name || 'N/A',
              };
              setSelectedGuide(normalizedGuide);
              setDetailsOpen(true);
            } catch (error: any) {
              // Mostrar alert con el mensaje del error (ya incluye "No tienes acceso a esta guía" para errores 400/403)
              const errorMessage = error.message || 'No se pudo escanear el código QR';
              const isAccessError = errorMessage.includes('No tienes acceso');
              Alert.alert(
                isAccessError ? 'Acceso denegado' : 'Error',
                errorMessage
              );
              // Prevenir que el error se propague y se muestre en la consola
              if (isAccessError) {
                return; // Salir silenciosamente
              }
            }
          }}
        />
      )}
    </MainLayout>
  );
}

export default GuidesPage;


