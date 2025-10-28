import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, Button } from '@/components/common';
import { useScanQr } from '@/laundry/hooks/guides';

interface Guide {
  id: string;
  guide_number: string;
  client_name: string;
  status: string;
  created_at: string;
  total_garments: number;
}

interface GuideSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGuide: (guideId: string) => void;
  processType: string;
  guides: Guide[];
  serviceType?: 'industrial' | 'personal';
}

export const GuideSelectionModal: React.FC<GuideSelectionModalProps> = ({
  visible,
  onClose,
  onSelectGuide,
  processType,
  guides,
  serviceType = 'industrial',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedGuide, setScannedGuide] = useState<Guide | null>(null);
  const { scanQrAsync, isScanning } = useScanQr();

  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return guides;
    const query = searchQuery.toLowerCase();
    return guides.filter(guide => 
      guide.guide_number.toLowerCase().includes(query) ||
      guide.client_name.toLowerCase().includes(query)
    );
  }, [guides, searchQuery]);

  const getProcessTypeLabel = (type: string) => {
    const processLabels: Record<string, string> = {
      'IN_PROCESS': 'EN PROCESO',
      'WASHING': 'LAVADO',
      'DRYING': 'SECADO',
      'PACKAGING': 'EMPAQUE',
      'SHIPPING': 'EMBARQUE',
      'LOADING': 'CARGA',
      'DELIVERY': 'ENTREGA',
    };
    return processLabels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'RECEIVED': '#10B981',
      'IN_PROCESS': '#3B82F6',
      'WASHING': '#06B6D4',
      'DRYING': '#F59E0B',
      'PACKAGING': '#8B5CF6',
      'SHIPPING': '#EF4444',
      'LOADING': '#84CC16',
      'DELIVERY': '#22C55E',
    };
    return colors[status] || '#6B7280';
  };

  const renderGuide = ({ item }: { item: Guide }) => (
    <TouchableOpacity
      onPress={() => onSelectGuide(item.id)}
      className="mb-3"
    >
      <Card padding="md" variant="outlined">
        <View className="flex-row items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Icon name="document-text-outline" size={20} color="#6B7280" />
              <Text className="text-lg font-bold text-gray-900 ml-2">
                {item.guide_number}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mb-1">
              Cliente: {item.client_name}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">
                {item.total_garments} prendas
              </Text>
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
              >
                <Text 
                  className="text-xs font-medium"
                  style={{ color: getStatusColor(item.status) }}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40">
        <View className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl" style={{ elevation: 8 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                Guías - {getProcessTypeLabel(processType)}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Selecciona una guía para continuar
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-6 py-4">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
              <Icon name="search-outline" size={18} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-gray-900"
                placeholder="Buscar por número de guía o cliente..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Botón Escanear QR */}
            <TouchableOpacity
              onPress={() => {
                // TODO: Implementar escaneo real de QR con cámara
                Alert.alert(
                  'Escaneo QR',
                  'Esta función abrirá la cámara para escanear el código QR de la guía',
                  [
                    {
                      text: 'Cancelar',
                      style: 'cancel'
                    },
                    {
                      text: 'Simular Escaneo (Demo)',
                      onPress: async () => {
                        try {
                          // Simulación de datos QR
                          const mockQrData = JSON.stringify({
                            type: 'guide',
                            id: guides[0]?.id || 'guide-demo',
                            data: {
                              guideNumber: guides[0]?.guide_number || 'G-2025-0001',
                              scannedAt: new Date().toISOString(),
                            },
                            timestamp: new Date().toISOString(),
                          });
                          
                          const guide = await scanQrAsync(mockQrData);
                          setScannedGuide(guide);
                        } catch (error: any) {
                          Alert.alert('Error', error.message || 'No se pudo escanear el código QR');
                        }
                      }
                    }
                  ]
                );
              }}
              className="bg-blue-500 p-4 rounded-lg flex-row items-center justify-center"
            >
              <Icon name="qr-code-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Escanear Código QR</Text>
            </TouchableOpacity>
          </View>

          {/* Guides List */}
          <View className="flex-1 px-6">
            {filteredGuides.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Icon name="document-outline" size={48} color="#D1D5DB" />
                <Text className="text-lg font-medium text-gray-500 mt-4">
                  No hay guías disponibles
                </Text>
                <Text className="text-sm text-gray-400 mt-2 text-center">
                  No se encontraron guías para este proceso
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredGuides}
                renderItem={renderGuide}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </View>
      
      {/* Modal de Detalles de Guía Escaneada */}
      <Modal
        visible={!!scannedGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setScannedGuide(null)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-white rounded-3xl mx-4 w-11/12 max-w-md" style={{ elevation: 10 }}>
            {/* Header */}
            <View className="bg-blue-500 p-6 rounded-t-3xl">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <Icon name="qr-code-outline" size={28} color="white" />
                  <Text className="text-white text-2xl font-bold ml-3">
                    Guía Encontrada
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setScannedGuide(null)}
                  className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                >
                  <Icon name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-blue-100 text-sm">
                Datos obtenidos del código QR
              </Text>
            </View>

            {/* Body */}
            {scannedGuide && (
              <View className="p-6">
                {/* Número de Guía */}
                <View className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Text className="text-sm text-blue-600 font-medium mb-1">Número de Guía</Text>
                  <Text className="text-2xl font-bold text-blue-900">
                    {scannedGuide.guide_number}
                  </Text>
                </View>

                {/* Información Principal */}
                <View className="space-y-3 mb-6">
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Cliente:</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {scannedGuide.client_name}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Total Prendas:</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {scannedGuide.total_garments}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Estado:</Text>
                    <View 
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${getStatusColor(scannedGuide.status)}20` }}
                    >
                      <Text 
                        className="text-xs font-bold"
                        style={{ color: getStatusColor(scannedGuide.status) }}
                      >
                        {scannedGuide.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between py-2">
                    <Text className="text-sm text-gray-600">Fecha de Creación:</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {new Date(scannedGuide.created_at).toLocaleDateString('es-ES')}
                    </Text>
                  </View>
                </View>

                {/* Botones */}
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => setScannedGuide(null)}
                    className="flex-1 bg-gray-100 p-4 rounded-lg items-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      onSelectGuide(scannedGuide.id);
                      setScannedGuide(null);
                    }}
                    className="flex-1 bg-blue-500 p-4 rounded-lg flex-row items-center justify-center"
                  >
                    <Icon name="arrow-forward-circle-outline" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Continuar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};
