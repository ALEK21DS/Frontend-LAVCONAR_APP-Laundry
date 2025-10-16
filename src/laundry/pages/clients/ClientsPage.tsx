import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Container, Button, Card } from '@/components/common';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideMenu } from '@/components/layout/SideMenu';
import { useClients } from '@/laundry/hooks/useClients';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClientForm } from './ui/ClientForm';


type ClientsPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ClientsPage: React.FC<ClientsPageProps> = ({ navigation: _navigation }) => {
  const { clients, isLoading, createClient, updateClient } = useClients();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<any | undefined>(undefined);

  // Lista demo si aún no hay datos (modo sin backend)
  const demoClients = [
    { id: 'demo-1', name: 'Juan Pérez', email: 'juan.perez@example.com', identification_number: '0102030405', acronym: 'JP' },
    { id: 'demo-2', name: 'María García', email: 'maria.garcia@example.com', identification_number: '0911223344', acronym: 'MG' },
    { id: 'demo-3', name: 'Comercial Andes S.A.', email: 'contacto@andes.com', identification_number: '1790012345001', acronym: 'ANDES' },
  ];

  const base = clients && clients.length > 0 ? clients : demoClients;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c: any) => [c.name, c.email, c.identification_number, c.acronym].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [base, query]);

  return (
    <Container safe padding="none">
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={route => _navigation.navigate(route as never)} />

      <TouchableOpacity activeOpacity={0.7} onPress={() => setMenuOpen(true)}>
        <HeaderBar showThemeToggle={false} />
      </TouchableOpacity>

      <View className="px-4 pt-4 flex-1">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Clientes</Text>
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
                <Card padding="md" variant="default">
                  <View className="flex-row items-center">
                    <View className="bg-blue-50 rounded-lg p-2 mr-3">
                      <IonIcon name="person-outline" size={20} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold">{client.name}</Text>
                      <Text className="text-gray-500 text-xs">{client.identification_number}</Text>
                    </View>
                    <TouchableOpacity className="px-3 py-2 rounded-lg bg-blue-600 active:bg-blue-700" onPress={() => {
                      setEditingId(client.id);
                      setInitialValues({ name: client.name, email: client.email, identification_number: client.identification_number, phone: client.phone, address: client.address, acronym: client.acronym, branch_office_id: client.branch_office_id });
                      setFormOpen(true);
                    }}>
                      <Text className="text-white text-xs font-semibold">Editar</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* FAB "Nuevo" */}
        <TouchableOpacity className="absolute right-4 bottom-6 w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#1f4eed', elevation: 6 }} onPress={() => { setEditingId(null); setInitialValues(undefined); setFormOpen(true); }} activeOpacity={0.85}>
          <IonIcon name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Modal */}
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
    </Container>
  );
};

export default ClientsPage;


