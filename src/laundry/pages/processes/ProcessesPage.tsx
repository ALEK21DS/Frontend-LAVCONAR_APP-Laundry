import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card, PaginationControls } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ProcessForm } from './ui/ProcessForm';
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { useWashingProcesses } from '@/laundry/hooks/washing-processes';
import { useCatalogLabelMap } from '@/laundry/hooks';
import { ProcessDetailsModal } from './ui/ProcessDetailsModal';
import { PROCESS_STATUS_COLORS } from '@/constants/processes';

type ProcessesPageProps = { navigation: NativeStackNavigationProp<any> };

export const ProcessesPage: React.FC<ProcessesPageProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedProcess, setSelectedProcess] = useState<any | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
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

  const { getLabel: getProcessTypeLabel } = useCatalogLabelMap('process_type', { forceFresh: true });
  const { getLabel: getProcessStatusLabel } = useCatalogLabelMap('process_status', { forceFresh: true });

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

  const handleProcessTypeSelect = (processType: string) => {
    setProcessTypeModalOpen(false);
    // Navegar al escáner con el tipo de proceso seleccionado
    navigation.navigate('ScanClothes', {
      mode: 'process',
      processType: processType
    });
  };

  const handleOpenDetails = (process: any) => {
    setSelectedProcess(process);
    setDetailsModalOpen(true);
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
            <ActivityIndicator size="large" color="#8EB021" />
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
                {filtered.map(p => {
                  const statusColor = PROCESS_STATUS_COLORS[p.status as keyof typeof PROCESS_STATUS_COLORS] || '#6B7280';
                  const statusLabel = getProcessStatusLabel(p.status, (p as any).status_label || p.status || 'Sin estado');
                  
                  return (
                    <View key={p.id} className="w-full px-1 mb-2">
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleOpenDetails(p)}
                      >
                        <Card padding="md" variant="default">
                          <View className="flex-row items-center">
                            <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
                              <IonIcon name="construct-outline" size={20} color="#8EB021" />
                            </View>
                            <View className="flex-1 mr-2">
                              <Text className="text-gray-900 font-semibold">
                                {p.guide?.guide_number || p.machine_code || 'Sin código'}
                              </Text>
                              <Text className="text-gray-500 text-xs">
                                {getProcessTypeLabel(p.process_type, (p as any).process_type_label || p.process_type || 'Sin tipo')}
                              </Text>
                              {p.guide?.client?.name && (
                                <Text className="text-gray-400 text-xs mt-1">
                                  Cliente: {p.guide.client.name}
                                </Text>
                              )}
                            </View>
                            <View className="items-end">
                              {/* Badge de estado con color */}
                              <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: statusColor + '20' }}>
                                <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: statusColor }} />
                                <Text className="text-xs font-medium" numberOfLines={1} style={{ color: statusColor }}>
                                  {statusLabel}
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
                  );
                })}
              </View>

              {/* Paginación */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                onPageChange={(page) => setPage(page)}
              />
            </ScrollView>
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

      <ProcessDetailsModal
        visible={detailsModalOpen}
        process={selectedProcess}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedProcess(null);
        }}
      />
    </MainLayout>
  );
};

export default ProcessesPage;


