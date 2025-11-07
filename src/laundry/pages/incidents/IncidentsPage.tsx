import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { useIncidents, useCreateIncident, useUpdateIncident } from '@/laundry/hooks/incidents';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { IncidentForm } from './ui/IncidentForm';
import { IncidentDetailsModal } from './ui/IncidentDetailsModal';
import { useCatalogLabelMap } from '@/laundry/hooks';
import { getStatusColor, getTypeColor } from '@/laundry/pages/incidents/incidents.utils';

type IncidentsPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [query, setQuery] = useState('');
  const [branchOfficeFilter, setBranchOfficeFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [initialValues, setInitialValues] = useState<any | undefined>(undefined);

  // Hooks modulares
  const { incidents, isLoading, refetch, total, totalPages, currentPage } = useIncidents({ 
    page, 
    limit,
    search: query,
    branch_office_id: branchOfficeFilter || undefined,
    incident_type: typeFilter || undefined,
    incident_status: statusFilter || undefined,
    action_taken: actionFilter || undefined,
  });
  const { createIncidentAsync, isCreating } = useCreateIncident();
  const { updateIncidentAsync, isUpdating } = useUpdateIncident();

  const { getLabel: getIncidentTypeLabel } = useCatalogLabelMap('incident_type', { forceFresh: true });
  const { getLabel: getIncidentStatusLabel } = useCatalogLabelMap('incident_status', { forceFresh: true });

  // Recargar la lista cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Resetear a página 1 cuando cambien los filtros
  React.useEffect(() => {
    setPage(1);
  }, [query, branchOfficeFilter, typeFilter, statusFilter, actionFilter]);

  const openCreate = () => {
    setEditingId(null);
    setSelectedIncident(null);
    setInitialValues(undefined);
    setFormOpen(true);
  };

  const openDetails = (incident: any) => {
    setSelectedIncident(incident);
    setDetailsOpen(true);
  };

  const openEdit = () => {
    if (selectedIncident) {
      setEditingId(selectedIncident.id);
      setInitialValues({
        guide_id: selectedIncident.guide_id,
        guide_number: selectedIncident.guide?.guide_number || selectedIncident.guide_number || '',
        rfid_code: selectedIncident.rfid_code || '',
        incident_type: selectedIncident.incident_type,
        description: selectedIncident.description,
        responsible: selectedIncident.responsible || '',
        action_taken: selectedIncident.action_taken || '',
        compensation_amount: selectedIncident.compensation_amount || 0,
        status: selectedIncident.status || 'OPEN',
      });
      setFormOpen(true);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingId) {
        await updateIncidentAsync({
          id: editingId,
          data: {
            guide_id: data.guide_id,
            rfid_code: data.rfid_code || undefined,
            incident_type: data.incident_type,
            description: data.description,
            responsible: data.responsible || undefined,
            action_taken: data.action_taken || undefined,
            compensation_amount: data.compensation_amount || undefined,
            status: data.status || 'OPEN',
          }
        });
        Alert.alert('Éxito', 'Incidente actualizado correctamente');
      } else {
        await createIncidentAsync({
          guide_id: data.guide_id,
          rfid_code: data.rfid_code || undefined,
          incident_type: data.incident_type,
          description: data.description,
          responsible: data.responsible || undefined,
          action_taken: data.action_taken || undefined,
          compensation_amount: data.compensation_amount || undefined,
          status: data.status || 'OPEN',
        });
        Alert.alert('Éxito', 'Incidente creado correctamente');
      }
      setFormOpen(false);
      setEditingId(null);
      setSelectedIncident(null);
      setInitialValues(undefined);
      refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al procesar el incidente';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <MainLayout 
      activeTab="Incidents" 
      onNavigate={(route: string, params?: any) => {
        // @ts-ignore
        navigation.navigate(route, params);
      }}
    >
      <View className="px-4 pt-4 flex-1">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <View className="flex-row items-center">
              <IonIcon name="warning-outline" size={24} color="#0b1f36" />
              <Text className="text-lg font-bold text-gray-900 ml-2">INCIDENTES</Text>
            </View>
            <Text className="text-sm text-gray-600 mt-1">
              {total} incidentes registrados
            </Text>
          </View>
          <TouchableOpacity
            onPress={openCreate}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#0b1f36' }}
          >
            <View className="flex-row items-center">
              <IonIcon name="add" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 h-10 ml-2 text-gray-900"
            placeholder="Buscar..."
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
          {isLoading && incidents.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#8EB021" />
            </View>
          ) : !isLoading && incidents.length === 0 ? (
            <Text className="text-gray-500 text-center mt-8">No se encontraron incidentes.</Text>
          ) : (
            <View className="-mx-1 flex-row flex-wrap">
              {incidents.map((incident: any) => (
                <View key={incident.id} className="w-full px-1 mb-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openDetails(incident)}
                  >
                    <Card padding="md" variant="default">
                      <View className="flex-row items-center">
                        <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
                          <IonIcon name="warning-outline" size={20} color="#8EB021" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold">
                            Guía: {incident.guide?.guide_number || incident.guide_number || 'Sin guía'}
                          </Text>
                          <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                            {incident.description}
                          </Text>
                          <View className="flex-row items-center mt-2 space-x-2">
                            <View 
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: `${getTypeColor(incident.incident_type)}20` }}
                            >
                              <Text 
                                className="text-xs font-medium"
                                style={{ color: getTypeColor(incident.incident_type) }}
                              >
                                {getIncidentTypeLabel(incident.incident_type, incident.incident_type_label || incident.incident_type || '—')}
                              </Text>
                            </View>
                            <View 
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: `${getStatusColor(incident.status)}20` }}
                            >
                              <Text 
                                className="text-xs font-medium"
                                style={{ color: getStatusColor(incident.status) }}
                              >
                                {getIncidentStatusLabel(incident.status, incident.status_label || incident.status || '—')}
                              </Text>
                            </View>
                          </View>
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
      <IncidentDetailsModal
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        incident={selectedIncident}
        onEdit={openEdit}
      />

      {/* Modal de Formulario */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">
              {editingId ? 'Editar Incidente' : 'Nuevo Incidente'}
            </Text>
            <TouchableOpacity onPress={() => {
              setFormOpen(false);
              setEditingId(null);
              setSelectedIncident(null);
              setInitialValues(undefined);
            }}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <IncidentForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingId(null);
              setSelectedIncident(null);
              setInitialValues(undefined);
            }}
            submitting={isCreating || isUpdating}
          />
        </View>
      </Modal>
    </MainLayout>
  );
};

export default IncidentsPage;

