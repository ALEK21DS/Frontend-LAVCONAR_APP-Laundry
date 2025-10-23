import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClients } from '@/laundry/hooks/useClients';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ClientForm } from './ui/ClientForm';
import { ClientDetailsModal } from './ui/ClientDetailsModal';


type ClientsPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ClientsPage: React.FC<ClientsPageProps> = ({ navigation: _navigation }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { clients, isLoading, createClient, updateClient, refetch, total, totalPages, currentPage } = useClients(page, limit);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [initialValues, setInitialValues] = useState<any | undefined>(undefined);

  // Recargar la lista de clientes cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const demoClients = [
    { 
      id: 'demo-1', 
      name: 'Juan Pérez', 
      email: 'juan.perez@example.com', 
      identification_number: '0102030405', 
      acronym: 'JP', 
      phone: '+593 99 123 4567',
      address: 'Av. Amazonas N24-03, Quito',
      branch_office_id: 'Sucursal Centro',
      branch_id: '99e24613-45dc-4e84-ac5b-7b898275c989',
      is_active: true,
      created_at: '21 de octubre de 2025, 07:34',
      updated_at: '21 de octubre de 2025, 07:34'
    },
    { 
      id: 'demo-2', 
      name: 'María García', 
      email: 'maria.garcia@example.com', 
      identification_number: '0911223344', 
      acronym: 'MG', 
      phone: '+593 98 765 4321',
      address: 'Calle Loja 456, Guayaquil',
      branch_office_id: 'Sucursal Norte',
      branch_id: '88d13524-36cb-3d73-bc4a-6a787164b878',
      is_active: true,
      created_at: '20 de octubre de 2025, 15:22',
      updated_at: '21 de octubre de 2025, 09:15'
    },
    { 
      id: 'demo-3', 
      name: 'Comercial Andes S.A.', 
      email: 'contacto@andes.com', 
      identification_number: '1790012345001', 
      acronym: 'ANDES', 
      phone: '+593 2 234 5678',
      address: 'Av. Naciones Unidas E4-29, Quito',
      branch_office_id: 'Sucursal Sur',
      branch_id: '77c02413-27ba-2c62-ab3a-5a676053a767',
      is_active: false,
      created_at: '19 de octubre de 2025, 11:45',
      updated_at: '20 de octubre de 2025, 14:30'
    },
  ];

  const base = clients || [];

  const filtered = useMemo(() => {
    let result = base;
    
    // Filtrar por estado
    if (statusFilter === 'active') {
      result = result.filter((c: any) => c.is_active === true);
    } else if (statusFilter === 'inactive') {
      result = result.filter((c: any) => c.is_active === false);
    }
    
    // Filtrar por búsqueda
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((c: any) => 
        [c.name, c.email, c.identification_number, c.acronym]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [base, query, statusFilter]);

  const toggleStatusFilter = () => {
    if (statusFilter === 'all') {
      setStatusFilter('active');
    } else if (statusFilter === 'active') {
      setStatusFilter('inactive');
    } else {
      setStatusFilter('all');
    }
  };

  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case 'active':
        return 'Activos';
      case 'inactive':
        return 'Inactivos';
      default:
        return 'Todos';
    }
  };

  const getStatusFilterColor = () => {
    switch (statusFilter) {
      case 'active':
        return '#10B981'; // Verde
      case 'inactive':
        return '#6B7280'; // Gris
      default:
        return '#2563EB'; // Azul
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setInitialValues(undefined);
    setFormOpen(true);
  };

  const openDetails = (client: any) => {
    setSelectedClient(client);
    setDetailsOpen(true);
  };

  const openEdit = () => {
    if (selectedClient) {
      setEditingId(selectedClient.id);
      setInitialValues({
        name: selectedClient.name,
        email: selectedClient.email,
        identification_number: selectedClient.identification_number,
        phone: selectedClient.phone,
        address: selectedClient.address,
        acronym: selectedClient.acronym,
        branch_office_id: selectedClient.branch_office_id,
        is_active: selectedClient.is_active,
      });
      setFormOpen(true);
    }
  };

  const handleDelete = () => {
    // TODO: Implementar eliminación con el backend
    console.log('Eliminar cliente:', selectedClient?.id);
  };

  return (
    <MainLayout 
      activeTab="Clients" 
      onNavigate={(route: string, params?: any) => {
        // @ts-ignore
        _navigation.navigate(route, params);
      }}
    >
      <View className="px-4 pt-4 flex-1">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Clientes</Text>
          <TouchableOpacity onPress={openCreate} className="w-10 h-10 rounded-lg bg-blue-600 items-center justify-center active:bg-blue-700">
            <IonIcon name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-center">
          <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
            <IonIcon name="search-outline" size={18} color="#6B7280" />
            <TextInput className="flex-1 h-10 ml-2 text-gray-900" placeholder="Buscar por nombre, cédula, email o acrónimo" placeholderTextColor="#9CA3AF" value={query} onChangeText={setQuery} autoCorrect={false} />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <IonIcon name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={toggleStatusFilter}
            className="ml-2 px-3 h-10 rounded-lg items-center justify-center"
            style={{ backgroundColor: getStatusFilterColor() }}
          >
            <Text className="text-white text-xs font-semibold">
              {getStatusFilterLabel()}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {isLoading && clients.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : !isLoading && filtered.length === 0 ? (
            <Text className="text-gray-500">No se encontraron clientes.</Text>
          ) : (
            <View className="-mx-1 flex-row flex-wrap">
            {filtered.map((client: any) => (
              <View key={client.id} className="w-full px-1 mb-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openDetails(client)}
                >
                  <Card padding="md" variant="default">
                    <View className="flex-row items-center">
                      <View className="bg-blue-50 rounded-lg p-2 mr-3">
                        <IonIcon name="person-outline" size={20} color="#2563EB" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold mb-1">{client.name}</Text>
                        <Text className="text-gray-500 text-xs mb-1">{client.identification_number}</Text>
                        <View className={`px-2 py-0.5 rounded-full self-start ${client.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Text className={`text-xs font-medium ${client.is_active ? 'text-green-700' : 'text-gray-600'}`}>
                            {client.is_active ? 'Activo' : 'Inactivo'}
                          </Text>
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

      {/* Modal de Detalles */}
      <ClientDetailsModal
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        client={selectedClient}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {/* Modal de Formulario */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>
            <TouchableOpacity onPress={() => setFormOpen(false)}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <ClientForm initialValues={initialValues} submitting={createClient.isPending || updateClient.isPending} onSubmit={async data => { if (editingId) { await updateClient.mutateAsync({ id: editingId, data }); } else { await createClient.mutateAsync(data); } setFormOpen(false); }} />
        </View>
      </Modal>
    </MainLayout>
  );
};

export default ClientsPage;


