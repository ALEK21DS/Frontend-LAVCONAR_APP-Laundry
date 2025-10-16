import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { useGuides } from '@/laundry/hooks/useGuides';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GuideForm } from './ui/GuideForm';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';

 type GuidesPageProps = { navigation: NativeStackNavigationProp<any> };

export const GuidesPage: React.FC<GuidesPageProps> = ({ navigation, route }: any) => {
  const { guides, isLoading, createGuide } = useGuides();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const prefilledTags = route?.params?.prefilledTags || [];
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const seenSetRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef<boolean>(false);
  const MIN_RSSI = -65;

  const demoGuides = [
    { id: 'g-001', guide_number: 'G-0001', client_name: 'Juan Pérez', status: 'IN_PROCESS' },
    { id: 'g-002', guide_number: 'G-0002', client_name: 'María García', status: 'COMPLETED' },
  ];
  const base = guides && guides.length > 0 ? guides : (demoGuides as any[]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((g: any) => [g.guide_number, g.client_name, g.status].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [base, query]);

  const openCreate = () => { setEditingId(null); setFormOpen(true); };

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
      } catch {}
      seenSetRef.current.clear();
    } catch (error) {
      console.error('Error al detener escaneo:', error);
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
        setScannedTags(prev => [...prev, tag]);
      });
      (global as any).rfidSubscription = subscription;
      const errSub = rfidModule.addErrorListener((msg: string) => {
        console.warn('RFID error:', msg);
      });
      (global as any).rfidErrSubscription = errSub;
      await rfidModule.startScan();
      Alert.alert('Escaneo iniciado', 'Acerca las prendas al lector');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el escaneo RFID');
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <MainLayout activeTab="Guides" onNavigate={route => navigation.navigate(route as never)}>
      <View className="px-4 pt-4 flex-1">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900 flex-1">Guías</Text>
          <TouchableOpacity onPress={openCreate} className="w-10 h-10 rounded-lg bg-blue-600 items-center justify-center active:bg-blue-700">
            <IonIcon name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="mb-4 flex-row items-center bg-white border border-gray-200 rounded-lg px-3">
          <IonIcon name="search-outline" size={18} color="#6B7280" />
          <TextInput className="flex-1 h-10 ml-2 text-gray-900" placeholder="Buscar por número, cliente o estado" placeholderTextColor="#9CA3AF" value={query} onChangeText={setQuery} autoCorrect={false} />
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
                    <TouchableOpacity className="w-9 h-9 rounded-lg bg-blue-600 active:bg-blue-700 items-center justify-center" onPress={() => { setEditingId(g.id); setFormOpen(true); }}>
                      <IonIcon name="pencil-outline" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal visible={formOpen || prefilledTags.length > 0} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">{editingId ? 'Editar Guía' : 'Nueva Guía'}</Text>
            <TouchableOpacity onPress={() => setFormOpen(false)}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <GuideForm
            clientOptions={[{ label: 'Cliente Demo', value: 'client-demo-1' }]}
            selectedClientId={'client-demo-1'}
            onChangeClient={() => {}}
            guideItems={[...prefilledTags.map((t: any) => ({ tagEPC: t.epc, proceso: '' })), ...scannedTags.map(t => ({ tagEPC: t.epc, proceso: '' }))]}
            onRemoveItem={(epc) => {
              setScannedTags(prev => prev.filter(t => t.epc !== epc));
            }}
            onScan={() => {
              if (isScanning) {
                stopScanning();
              } else {
                startScanning();
              }
            }}
            onSubmit={() => { 
              setFormOpen(false);
              setScannedTags([]);
              seenSetRef.current.clear();
              stopScanning();
              // Limpiar tags escaneados al cerrar
              if (route?.params?.prefilledTags) {
                // @ts-ignore
                navigation.setParams({ prefilledTags: [] });
              }
            }}
            showScanButton={prefilledTags.length === 0}
          />
        </View>
      </Modal>
    </MainLayout>
  );
 } 

 export default GuidesPage;


