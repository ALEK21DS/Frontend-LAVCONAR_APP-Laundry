import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { useScanGarmentQr } from '@/laundry/hooks/guides';
import { QrScanner } from './QrScanner';

interface Garment {
  id: string;
  rfid_code: string;
  description?: string;
  color?: string;
}

interface GarmentSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectGarment: (rfidCode: string) => void;
  garments: Garment[];
  isLoading?: boolean;
}

export const GarmentSelectionModal: React.FC<GarmentSelectionModalProps> = ({
  visible,
  onClose,
  onSelectGarment,
  garments,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedGarment, setScannedGarment] = useState<Garment | null>(null);
  const { scanGarmentQrAsync, isScanning } = useScanGarmentQr();

  const filteredGarments = useMemo(() => {
    if (!searchQuery.trim()) return garments;
    const query = searchQuery.toLowerCase();
    return garments.filter(garment => 
      garment.rfid_code.toLowerCase().includes(query) ||
      garment.description?.toLowerCase().includes(query)
    );
  }, [garments, searchQuery]);

  const renderGarment = ({ item }: { item: Garment }) => (
    <TouchableOpacity
      onPress={() => {
        onSelectGarment(item.rfid_code);
        onClose();
      }}
      className="mb-3"
    >
      <Card padding="md" variant="outlined">
        <View className="flex-row items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Icon name="pricetag-outline" size={20} color="#6B7280" />
              <Text className="text-lg font-bold text-gray-900 ml-2 font-mono">
                {item.rfid_code}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mb-1">
              {item.description || 'Sin descripción'}
            </Text>
            {item.color && (
              <Text className="text-xs text-gray-500">
                Color: {item.color}
              </Text>
            )}
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
                Seleccionar Prenda
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Selecciona una prenda para el incidente
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
                placeholder="Buscar por RFID o descripción..."
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
              onPress={() => setShowQrScanner(true)}
              className="bg-green-600 p-4 rounded-lg flex-row items-center justify-center"
              disabled={isScanning}
            >
              <Icon name="qr-code-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                {isScanning ? 'Escaneando...' : 'Escanear Código QR'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Garments List */}
          <View className="flex-1 px-6">
            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#8EB021" />
                <Text className="text-sm text-gray-500 mt-4">
                  Cargando prendas...
                </Text>
              </View>
            ) : filteredGarments.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Icon name="shirt-outline" size={48} color="#D1D5DB" />
                <Text className="text-lg font-medium text-gray-500 mt-4">
                  No hay prendas disponibles
                </Text>
                <Text className="text-sm text-gray-400 mt-2 text-center">
                  No se encontraron prendas para este incidente
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredGarments}
                renderItem={renderGarment}
                keyExtractor={item => item.rfid_code}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </View>
      
      {/* Escáner QR */}
      {showQrScanner && (
        <QrScanner
          visible={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={async (qrData: string) => {
            setShowQrScanner(false);
            try {
              const garment = await scanGarmentQrAsync(qrData);
              setScannedGarment(garment);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo escanear el código QR');
            }
          }}
        />
      )}
      
      {/* Modal de Detalles de Prenda Escaneada */}
      <Modal
        visible={!!scannedGarment}
        transparent
        animationType="fade"
        onRequestClose={() => setScannedGarment(null)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-white rounded-3xl mx-4 w-11/12 max-w-md" style={{ elevation: 10 }}>
            {/* Header */}
            <View className="bg-green-600 p-6 rounded-t-3xl">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <Icon name="qr-code-outline" size={28} color="white" />
                  <Text className="text-white text-2xl font-bold ml-3">
                    Prenda Encontrada
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setScannedGarment(null)}
                  className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                >
                  <Icon name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-green-100 text-sm">
                Datos obtenidos del código QR
              </Text>
            </View>

            {/* Body */}
            {scannedGarment && (
              <View className="p-6">
                {/* RFID */}
                <View className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Text className="text-sm font-medium mb-1" style={{ color: '#0b1f36' }}>Código RFID</Text>
                  <Text className="text-2xl font-bold text-green-900 font-mono">
                    {scannedGarment.rfid_code}
                  </Text>
                </View>

                {/* Información Principal */}
                <View className="space-y-3 mb-6">
                  {scannedGarment.description && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-600">Descripción:</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {scannedGarment.description}
                      </Text>
                    </View>
                  )}
                  
                  {scannedGarment.color && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-600">Color:</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {scannedGarment.color}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botones */}
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => setScannedGarment(null)}
                    className="flex-1 bg-gray-100 p-4 rounded-lg items-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      onSelectGarment(scannedGarment.rfid_code);
                      setScannedGarment(null);
                      onClose();
                    }}
                    className="flex-1 bg-green-600 p-4 rounded-lg flex-row items-center justify-center"
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

