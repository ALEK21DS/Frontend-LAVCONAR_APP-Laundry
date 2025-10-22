import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClients } from '@/laundry/hooks/useClients';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClientForm } from './ui/ClientForm';
import { ClientDetailsModal } from './ui/ClientDetailsModal';


type ClientsPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ClientsPage: React.FC<ClientsPageProps> = ({ navigation: _navigation }) => {
  const { clients, isLoading, createClient, updateClient } = useClients();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [initialValues, setInitialValues] = useState<any | undefined>(undefined);

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

  const base = clients && clients.length > 0 ? clients : demoClients;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c: any) => [c.name, c.email, c.identification_number, c.acronym].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [base, query]);

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

        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput className="flex-1 h-10 ml-2 text-gray-900" placeholder="Buscar por nombre, cédula, email o acrónimo" placeholderTextColor="#9CA3AF" value={query} onChangeText={setQuery} autoCorrect={false} />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <IonIcon name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView className="flex-1">
          {isLoading && clients.length === 0 && <Text className="text-gray-500">Cargando clientes...</Text>}
          {!isLoading && filtered.length === 0 && <Text className="text-gray-500">No se encontraron clientes.</Text>}

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
        </ScrollView>
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


