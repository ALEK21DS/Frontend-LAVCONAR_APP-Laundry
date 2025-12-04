import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { useBundlesByGuide } from '@/laundry/hooks/bundles';
import { CreateBundleModal } from './CreateBundleModal';
import { BundleDetailsModal } from './BundleDetailsModal';
import { Bundle } from '@/laundry/interfaces/bundles';

interface BundlesModalProps {
  visible: boolean;
  onClose: () => void;
  guide: any;
}

export const BundlesModal: React.FC<BundlesModalProps> = ({ visible, onClose, guide }) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  const { bundles, isLoading, refetch } = useBundlesByGuide(guide?.id, visible);

  if (!guide) return null;

  const handleOpenDetails = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setDetailsModalVisible(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalVisible(false);
    setSelectedBundle(null);
    refetch();
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    refetch();
    Alert.alert('Éxito', 'Bulto creado exitosamente');
  };

  const getBundleStatusColor = (status?: string) => {
    switch (status) {
      case 'CREATED':
        return '#3B82F6'; // Azul
      case 'IN_PROCESS':
        return '#F59E0B'; // Amarillo
      case 'COMPLETED':
        return '#10B981'; // Verde
      default:
        return '#6B7280'; // Gris
    }
  };

  const getBundleStatusLabel = (status?: string) => {
    switch (status) {
      case 'CREATED':
        return 'Creado';
      case 'IN_PROCESS':
        return 'En Proceso';
      case 'COMPLETED':
        return 'Completado';
      default:
        return status || 'Sin estado';
    }
  };

  return (
    <>
      <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
          {/* Header */}
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">Bultos de la Guía</Text>
              <Text className="text-sm text-gray-600 mt-1">{guide.guide_number}</Text>
              <Text className="text-xs text-gray-500">{guide.client_name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center">
              <IonIcon name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-4">
            {/* Botón Crear Nuevo Bulto */}
            <View className="mb-4">
              <Button
                title="Crear Nuevo Bulto"
                variant="primary"
                icon={<IonIcon name="add-circle-outline" size={20} color="white" />}
                onPress={() => setCreateModalVisible(true)}
                className="w-full"
              />
            </View>

            {/* Información de la guía */}
            <Card padding="md" variant="outlined" className="mb-4 bg-blue-50">
              <View className="flex-row items-center">
                <IonIcon name="information-circle-outline" size={20} color="#3B82F6" />
                <View className="ml-2 flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    Total: {guide.total_garments || 0} prendas en guía
                  </Text>
                  <Text className="text-xs text-gray-600">
                    {bundles.length} bulto{bundles.length !== 1 ? 's' : ''} creado{bundles.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Lista de bultos */}
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#0b1f36" />
              </View>
            ) : bundles.length === 0 ? (
              <Card padding="lg" variant="outlined" className="items-center py-8">
                <IonIcon name="cube-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4 text-center">
                  No hay bultos creados para esta guía
                </Text>
                <Text className="text-gray-400 text-sm mt-2 text-center">
                  Presiona "Crear Nuevo Bulto" para comenzar
                </Text>
              </Card>
            ) : (
              <View className="space-y-3">
                {bundles.map((bundle) => {
                  const statusColor = getBundleStatusColor(bundle.status);
                  const statusLabel = getBundleStatusLabel(bundle.status);

                  return (
                    <TouchableOpacity
                      key={bundle.id}
                      onPress={() => handleOpenDetails(bundle)}
                      activeOpacity={0.7}
                    >
                      <Card padding="md" variant="default">
                        <View className="flex-row items-center">
                          {/* Icono */}
                          <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
                            <IonIcon name="cube" size={24} color="#8EB021" />
                          </View>

                          {/* Información */}
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-gray-900">
                              {bundle.bundle_number}
                            </Text>
                            <Text className="text-sm text-gray-600 mt-1">
                              {bundle.total_garments} prenda{bundle.total_garments !== 1 ? 's' : ''}
                              {bundle.total_weight ? ` • ${bundle.total_weight.toFixed(2)} kg` : ''}
                            </Text>
                            {bundle.scan_location && (
                              <Text className="text-xs text-gray-500 mt-1">
                                📍 {bundle.scan_location}
                              </Text>
                            )}
                          </View>

                          {/* Badge de estado */}
                          <View className="ml-2">
                            <View
                              className="flex-row items-center px-3 py-1.5 rounded-full"
                              style={{ backgroundColor: statusColor + '20' }}
                            >
                              <View
                                className="w-2 h-2 rounded-full mr-1.5"
                                style={{ backgroundColor: statusColor }}
                              />
                              <Text className="text-xs font-medium" style={{ color: statusColor }}>
                                {statusLabel}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Crear Bulto */}
      <CreateBundleModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        guide={guide}
        onSuccess={handleCreateSuccess}
      />

      {/* Modal de Detalles de Bulto */}
      <BundleDetailsModal
        visible={detailsModalVisible}
        onClose={handleCloseDetails}
        bundle={selectedBundle}
        onDelete={() => {
          handleCloseDetails();
          refetch();
        }}
      />
    </>
  );
};

