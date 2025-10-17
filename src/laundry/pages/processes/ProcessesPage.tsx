import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProcessForm } from './ui/ProcessForm';

type ProcessesPageProps = { navigation: NativeStackNavigationProp<any> };

export const ProcessesPage: React.FC<ProcessesPageProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Datos demo de procesos
  const demo = [
    { id: 'p-001', guide_number: 'G-0001', name: 'Lavado', status: 'IN_PROCESS' },
    { id: 'p-002', guide_number: 'G-0002', name: 'Secado', status: 'COMPLETED' },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demo;
    return demo.filter(p => [p.name, p.guide_number, p.status].some(v => v.toLowerCase().includes(q)));
  }, [query]);

  const openCreate = () => { setEditingId(null); setFormOpen(true); };

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
          <Text className="text-2xl font-bold text-gray-900 flex-1">Procesos</Text>
          <TouchableOpacity onPress={openCreate} className="w-10 h-10 rounded-lg bg-blue-600 items-center justify-center active:bg-blue-700">
            <IonIcon name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
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

        <ScrollView className="flex-1">
          {filtered.length === 0 && <Text className="text-gray-500">No se encontraron procesos.</Text>}

          <View className="-mx-1 flex-row flex-wrap">
            {filtered.map(p => (
              <View key={p.id} className="w-full px-1 mb-2">
                <Card padding="md" variant="default">
                  <View className="flex-row items-center">
                    <View className="bg-green-50 rounded-lg p-2 mr-3">
                      <IonIcon name="construct-outline" size={20} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold">{p.name}</Text>
                      <Text className="text-gray-500 text-xs">{p.guide_number}</Text>
                    </View>
                    <Text className="text-gray-600 text-xs mr-3">{p.status}</Text>
                    <TouchableOpacity className="w-9 h-9 rounded-lg bg-blue-600 active:bg-blue-700 items-center justify-center" onPress={() => { setEditingId(p.id); setFormOpen(true); }}>
                      <IonIcon name="pencil-outline" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

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


