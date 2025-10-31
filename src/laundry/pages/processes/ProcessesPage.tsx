import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ProcessForm } from './ui/ProcessForm';
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { useWashingProcesses } from '@/laundry/hooks/washing-processes';
import { translateEnum } from '@/helpers/enum-translations';

type ProcessesPageProps = { navigation: NativeStackNavigationProp<any> };

export const ProcessesPage: React.FC<ProcessesPageProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Resetear a la primera página al buscar
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Obtener procesos del backend con paginación
  const { washingProcesses, total, totalPages, currentPage, isLoading, refetch } = useWashingProcesses({
    page,
    limit,
    search: debouncedQuery,
  });

  // Refrescar al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filtered = useMemo(() => {
    // El filtrado ya lo hace el backend con el parámetro search
    return washingProcesses;
  }, [washingProcesses]);

  const openCreate = () => { setProcessTypeModalOpen(true); };

  const openProcessTypeModal = () => {
    setProcessTypeModalOpen(true);
  };

  const handleProcessTypeSelect = (processType: string) => {
    setProcessTypeModalOpen(false);
    // Navegar al escáner con el tipo de proceso seleccionado
    navigation.navigate('ScanClothes', {
      mode: 'process',
      processType: processType
    });
  };

  return (
    <MainLayout 
      activeTab="Processes" 
      onNavigate={(route: string, params?: any) => {
        // @ts-ignore
        navigation.navigate(route, params);
      }}
    >
      <View className="px-4 pt-4 flex-1">
        <View className="flex-row items-center mb-4">
          <Text className="text-lg font-bold text-gray-900 flex-1">PROCESOS</Text>
        </View>

        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 h-10 ml-2 text-gray-900"
            placeholder="Buscar por guía, nombre o estado"
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

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0b1f36" />
          </View>
        ) : (
          <>
            <ScrollView className="flex-1">
              {filtered.length === 0 && (
                <Text className="text-gray-500 text-center mt-8">
                  No se encontraron procesos.
                </Text>
              )}

              <View className="-mx-1 flex-row flex-wrap">
                {filtered.map(p => (
                  <View key={p.id} className="w-full px-1 mb-2">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={openProcessTypeModal}
                    >
                      <Card padding="md" variant="default">
                        <View className="flex-row items-center">
                          <View className="bg-purple-50 rounded-lg p-2 mr-3">
                            <IonIcon name="construct-outline" size={20} color="#8B5CF6" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-900 font-semibold">
                              {p.guide?.guide_number || p.machine_code || 'Sin código'}
                            </Text>
                            <Text className="text-gray-500 text-xs">
                              {translateEnum(p.process_type, 'process_type') || 'Sin tipo'}
                            </Text>
                            {p.guide?.client?.name && (
                              <Text className="text-gray-400 text-xs mt-1">
                                Cliente: {p.guide.client.name}
                              </Text>
                            )}
                          </View>
                          <View className="items-end">
                            {/* Badge de estado */}
                            <View className={`flex-row items-center px-2 py-1 rounded-full ${
                              p.status === 'COMPLETED' ? 'bg-green-100' :
                              p.status === 'IN_PROGRESS' ? 'bg-blue-100' :
                              p.status === 'PENDING' ? 'bg-yellow-100' :
                              p.status === 'CANCELLED' ? 'bg-red-100' :
                              p.status === 'FAILED' ? 'bg-red-100' :
                              'bg-gray-100'
                            }`}>
                              <View className={`w-2 h-2 rounded-full mr-1 ${
                                p.status === 'COMPLETED' ? 'bg-green-500' :
                                p.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                p.status === 'PENDING' ? 'bg-yellow-500' :
                                p.status === 'CANCELLED' ? 'bg-red-500' :
                                p.status === 'FAILED' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`} />
                              <Text className={`text-xs font-medium ${
                                p.status === 'COMPLETED' ? 'text-green-700' :
                                p.status === 'IN_PROGRESS' ? 'text-blue-700' :
                                p.status === 'PENDING' ? 'text-yellow-700' :
                                p.status === 'CANCELLED' ? 'text-red-700' :
                                p.status === 'FAILED' ? 'text-red-700' :
                                'text-gray-700'
                              }`}>
                                {translateEnum(p.status, 'process_status') || 'Sin estado'}
                              </Text>
                            </View>
                            {p.garment_quantity && (
                              <Text className="text-gray-400 text-xs mt-1">
                                {p.garment_quantity} prendas
                              </Text>
                            )}
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Paginación */}
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
          </>
        )}
      </View>

      {/* Modal de Selección de Tipo de Proceso */}
      <ProcessTypeModal
        visible={processTypeModalOpen}
        onClose={() => setProcessTypeModalOpen(false)}
        onSelectProcess={handleProcessTypeSelect}
      />

      {/* Modal de Formulario (mantenido para compatibilidad) */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">{editingId ? 'Editar Proceso' : 'Nuevo Proceso'}</Text>
            <TouchableOpacity onPress={() => setFormOpen(false)}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <ProcessForm
            guideOptions={[]}
            selectedGuideId={undefined}
            onChangeGuide={() => {}}
            onScanRFID={() => {}}
            onSubmit={() => setFormOpen(false)}
          />
        </View>
      </Modal>
    </MainLayout>
  );
};

export default ProcessesPage;


