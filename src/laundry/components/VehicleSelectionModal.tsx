import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { useScanVehicleQr } from '@/laundry/hooks/vehicles';
import { QrScanner } from './QrScanner';

interface Vehicle {
  id: string;
  plate_number: string;
  unit_number?: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  capacity?: number;
}

interface VehicleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  vehicles: Vehicle[];
}

export const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  visible,
  onClose,
  onSelectVehicle,
  vehicles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedVehicle, setScannedVehicle] = useState<Vehicle | null>(null);
  const { scanVehicleQrAsync, isScanning } = useScanVehicleQr();

  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const query = searchQuery.toLowerCase();
    return vehicles.filter(vehicle => 
      vehicle.unit_number?.toLowerCase().includes(query) ||
      vehicle.plate_number.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query)
    );
  }, [vehicles, searchQuery]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'AVAILABLE': '#10B981',
      'IN_USE': '#3B82F6',
      'MAINTENANCE': '#F59E0B',
      'OUT_OF_SERVICE': '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'AVAILABLE': 'Disponible',
      'IN_USE': 'En Uso',
      'MAINTENANCE': 'Mantenimiento',
      'OUT_OF_SERVICE': 'Fuera de Servicio',
    };
    return labels[status] || status;
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      onPress={() => {
        onSelectVehicle(item);
        onClose();
      }}
      className="mb-3"
    >
      <Card padding="md" variant="outlined">
        <View className="flex-row items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Icon name="car-outline" size={20} color="#6B7280" />
              <Text className="text-lg font-bold text-gray-900 ml-2">
                {item.unit_number || item.plate_number}
              </Text>
            </View>
            <Text className="text-sm text-gray-600">
              Placa: {item.plate_number}
            </Text>
            <Text className="text-sm text-gray-600 mb-1">
              Nombre: {item.brand} {item.model} ({item.year})
            </Text>
            <View className="flex-row items-center justify-between">
              {item.capacity && (
                <Text className="text-sm text-gray-500">
                  Capacidad: {item.capacity} kg
                </Text>
              )}
              <View 
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
              >
                <Text 
                  className="text-xs font-medium"
                  style={{ color: getStatusColor(item.status) }}
                >
                  {getStatusLabel(item.status)}
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
                Seleccionar Vehículo
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Selecciona un vehículo para el transporte
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
                placeholder="Buscar por unidad, placa, marca o modelo..."
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
              className="bg-blue-500 p-4 rounded-lg flex-row items-center justify-center"
              disabled={isScanning}
            >
              <Icon name="qr-code-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                {isScanning ? 'Escaneando...' : 'Escanear Código QR'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vehicles List */}
          <View className="flex-1 px-6">
            {filteredVehicles.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Icon name="car-outline" size={48} color="#D1D5DB" />
                <Text className="text-lg font-medium text-gray-500 mt-4">
                  No hay vehículos disponibles
                </Text>
                <Text className="text-sm text-gray-400 mt-2 text-center">
                  No se encontraron vehículos
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredVehicles}
                renderItem={renderVehicle}
                keyExtractor={item => item.id}
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
              const vehicle = await scanVehicleQrAsync(qrData);
              setScannedVehicle(vehicle);
            } catch (error: any) {
              // Mostrar alert con el mensaje del error (ya incluye "no pertenece a tu sucursal" para errores 400/403)
              const errorMessage = error.message || 'No se pudo escanear el código QR del vehículo';
              const isAccessError = errorMessage.includes('no pertenece a tu sucursal');
              Alert.alert(
                isAccessError ? 'Acceso denegado' : 'Error',
                errorMessage
              );
              // Prevenir que el error se propague y se muestre en la consola
              if (isAccessError) {
                return; // Salir silenciosamente
              }
            }
          }}
        />
      )}
      
      {/* Modal de Detalles de Vehículo Escaneado */}
      <Modal
        visible={!!scannedVehicle}
        transparent
        animationType="fade"
        onRequestClose={() => setScannedVehicle(null)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-white rounded-3xl mx-4 w-11/12 max-w-md" style={{ elevation: 10 }}>
            {/* Header */}
            <View className="bg-blue-500 p-6 rounded-t-3xl">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <Icon name="qr-code-outline" size={28} color="white" />
                  <Text className="text-white text-2xl font-bold ml-3">
                    Vehículo Encontrado
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setScannedVehicle(null)}
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
            {scannedVehicle && (
              <View className="p-6">
                {/* Unidad del Vehículo */}
                <View className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Text className="text-sm font-medium mb-1" style={{ color: '#0b1f36' }}>Unidad</Text>
                  <Text className="text-2xl font-bold text-blue-900">
                    {scannedVehicle.unit_number || scannedVehicle.plate_number}
                  </Text>
                </View>

                {/* Información Principal */}
                <View className="space-y-3 mb-6">
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Placa:</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {scannedVehicle.plate_number}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Vehículo:</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {scannedVehicle.brand} {scannedVehicle.model}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Año:</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {scannedVehicle.year}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">Capacidad:</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {scannedVehicle.capacity} kg
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between py-2">
                    <Text className="text-sm text-gray-600">Estado:</Text>
                    <View 
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${getStatusColor(scannedVehicle.status)}20` }}
                    >
                      <Text 
                        className="text-xs font-bold"
                        style={{ color: getStatusColor(scannedVehicle.status) }}
                      >
                        {getStatusLabel(scannedVehicle.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Botones */}
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => setScannedVehicle(null)}
                    className="flex-1 bg-gray-100 p-4 rounded-lg items-center"
                  >
                    <Text className="text-gray-700 font-semibold">Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      onSelectVehicle(scannedVehicle);
                      setScannedVehicle(null);
                      onClose();
                    }}
                    className="flex-1 bg-blue-500 p-4 rounded-lg flex-row items-center justify-center"
                  >
                    <Icon name="checkmark-circle-outline" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Seleccionar</Text>
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

