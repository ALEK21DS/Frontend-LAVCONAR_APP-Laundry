import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Container, Button, Card } from '@/components/common';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideMenu } from '@/components/layout/SideMenu';
import { useGuides } from '@/laundry/hooks/useGuides';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GuideForm } from './ui/GuideForm';

 type GuidesPageProps = { navigation: NativeStackNavigationProp<any> };

 export const GuidesPage: React.FC<GuidesPageProps> = ({ navigation }) => {
  const { guides, isLoading, createGuide } = useGuides();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Datos demo si no hay backend
  const demoGuides = [
    { id: 'g-001', guide_number: 'G-0001', client_name: 'Juan Pérez', status: 'IN_PROCESS' },
    { id: 'g-002', guide_number: 'G-0002', client_name: 'María García', status: 'COMPLETED' },
  ];
  const base = guides && guides.length > 0 ? guides : (demoGuides as any[]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((g: any) =>
      [g.guide_number, g.client_name, g.status].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    );
  }, [base, query]);

  return (
    <Container safe padding="none">
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={r => navigation.navigate(r as never)} />
      <TouchableOpacity activeOpacity={0.7} onPress={() => setMenuOpen(true)}>
        <HeaderBar showThemeToggle={false} />
      </TouchableOpacity>

      <View className="px-4 pt-4 flex-1">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Guías</Text>
        </View>

        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 h-10 ml-2 text-gray-900"
            placeholder="Buscar por número, cliente o estado"
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
          {isLoading && guides.length === 0 && <Text className="text-gray-500">Cargando guías...</Text>}
          {!isLoading && filtered.length === 0 && <Text className="text-gray-500">No se encontraron guías.</Text>}

          <View className="-mx-1 flex-row flex-wrap">
            {filtered.map((g: any) => (
              <View key={g.id} className="w-full px-1 mb-2">
                <Card padding="md" variant="default">
                  <View className="flex-row items-center">
                    <View className="bg-yellow-50 rounded-lg p-2 mr-3">
                      <IonIcon name="document-text-outline" size={20} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold">{g.guide_number}</Text>
                      <Text className="text-gray-500 text-xs">{g.client_name}</Text>
                    </View>
                    <Text className="text-gray-600 text-xs mr-3">{g.status}</Text>
                    <TouchableOpacity className="px-3 py-2 rounded-lg bg-blue-600 active:bg-blue-700" onPress={() => { setEditingId(g.id); setFormOpen(true); }}>
                      <Text className="text-white text-xs font-semibold">Ver/Editar</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity className="absolute right-4 bottom-6 w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#1f4eed', elevation: 6 }} onPress={() => { setEditingId(null); setFormOpen(true); }} activeOpacity={0.85}>
          <IonIcon name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">{editingId ? 'Editar Guía' : 'Nueva Guía'}</Text>
            <TouchableOpacity onPress={() => setFormOpen(false)}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GuideForm clientOptions={[]} selectedClientId={undefined} onChangeClient={() => {}} guideItems={[]} onRemoveItem={() => {}} onScan={() => {}} onSubmit={async () => { if (!editingId) { await createGuide.mutateAsync({ client_id: 'demo-client', branch_office_id: 'demo-branch', collection_date: new Date().toISOString(), general_condition: 'REGULAR', service_type: 'INDUSTRIAL', charge_type: 'BY_UNIT', total_garments: 1, }); } setFormOpen(false); }} />
        </View>
      </Modal>
    </Container>
  );
 } 

 export default GuidesPage;


