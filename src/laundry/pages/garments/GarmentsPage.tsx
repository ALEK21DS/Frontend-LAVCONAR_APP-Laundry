import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GarmentForm } from './ui/GarmentForm';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';

type GarmentsPageProps = { navigation: NativeStackNavigationProp<any> };

export const GarmentsPage: React.FC<GarmentsPageProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [rfidCode, setRfidCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const seenSetRef = useRef<Set<string>>(new Set());

  const [items, setItems] = useState(
    [
      { id: 'gm-001', epc: 'E280-...-01', description: 'Camisa blanca', guide_number: 'G-0001', color: 'Blanco' },
      { id: 'gm-002', epc: 'E280-...-02', description: 'Sábana king', guide_number: 'G-0002', color: 'Blanco' },
    ] as Array<{ id: string; epc: string; description: string; guide_number: string; color?: string; observations?: string }>
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(g => [g.description, g.epc, g.guide_number].some(v => v.toLowerCase().includes(q)));
  }, [query, items]);

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
          <Text className="text-2xl font-bold text-gray-900 flex-1">Prendas</Text>
          <TouchableOpacity onPress={() => { setFormOpen(true); setRfidCode(''); }} className="w-10 h-10 rounded-lg bg-blue-600 items-center justify-center active:bg-blue-700">
            <IonIcon name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 h-10 ml-2 text-gray-900"
            placeholder="Buscar por descripción, EPC o guía"
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
          {filtered.length === 0 && <Text className="text-gray-500">No se encontraron prendas.</Text>}
          <View className="-mx-1 flex-row flex-wrap">
            {filtered.map(item => (
              <View key={item.id} className="w-full px-1 mb-2">
                <Card padding="md" variant="default">
                  <View className="flex-row items-center">
                    <View className="bg-blue-50 rounded-lg p-2 mr-3">
                      <IonIcon name="shirt-outline" size={20} color="#1f4eed" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold">{item.description}</Text>
                      <Text className="text-gray-500 text-xs">{item.epc}</Text>
                    </View>
                    <Text className="text-gray-600 text-xs mr-3">{item.guide_number}</Text>
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
            <Text className="text-xl font-bold text-gray-900 flex-1">Nueva Prenda</Text>
            <TouchableOpacity onPress={() => setFormOpen(false)}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GarmentForm
            rfidCode={rfidCode}
            onScan={async () => {
              try {
                if (isScanning) {
                  setIsScanning(false);
                  isScanningRef.current = false;
                  if ((global as any).garmentScanSub) {
                    (global as any).garmentScanSub.remove();
                    (global as any).garmentScanSub = null;
                  }
                  if ((global as any).garmentScanErrSub) {
                    (global as any).garmentScanErrSub.remove();
                    (global as any).garmentScanErrSub = null;
                  }
                  try { await rfidModule.stopScan(); } catch {}
                  seenSetRef.current.clear();
                  return;
                }
                setIsScanning(true);
                isScanningRef.current = true;
                const sub = rfidModule.addTagListener((tag: ScannedTag) => {
                  if (!isScanningRef.current) return;
                  if (seenSetRef.current.has(tag.epc)) return;
                  seenSetRef.current.add(tag.epc);
                  setRfidCode(tag.epc);
                  // detener inmediatamente tras la primera lectura
                  setIsScanning(false);
                  isScanningRef.current = false;
                  try { rfidModule.stopScan(); } catch {}
                  if ((global as any).garmentScanSub) { (global as any).garmentScanSub.remove(); (global as any).garmentScanSub = null; }
                  if ((global as any).garmentScanErrSub) { (global as any).garmentScanErrSub.remove(); (global as any).garmentScanErrSub = null; }
                  seenSetRef.current.clear();
                });
                // @ts-ignore
                (global as any).garmentScanSub = sub;
                const errSub = rfidModule.addErrorListener(() => {});
                // @ts-ignore
                (global as any).garmentScanErrSub = errSub;
                await rfidModule.startScan();
              } catch (e) {
                setIsScanning(false);
                isScanningRef.current = false;
              }
            }}
            isScanning={isScanning}
            onSubmit={(data) => {
              // agregar a la lista demo
              const newItem = {
                id: `gm-${(items.length + 1).toString().padStart(3, '0')}`,
                epc: data.rfidCode || rfidCode || `E280-...-${items.length + 1}`,
                description: data.description,
                color: data.color,
                observations: data.observations,
                guide_number: 'G-0001',
              };
              setItems(prev => [newItem, ...prev]);
              setFormOpen(false);
              setRfidCode('');
            }}
          />
        </View>
      </Modal>
    </MainLayout>
  );
};

export default GarmentsPage;


