import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { formatDateTime } from '@/helpers';

interface GarmentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  garment: any;
  onEdit: () => void;
}

export const GarmentDetailsModal: React.FC<GarmentDetailsModalProps> = ({
  visible,
  onClose,
  garment,
  onEdit,
}) => {
  if (!garment) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <View className="flex-row items-center flex-1">
            <View className="bg-blue-50 rounded-lg p-2 mr-3">
              <IonIcon name="shirt-outline" size={24} color="#2563EB" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Detalles de la Prenda</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <IonIcon name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Código RFID */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="pricetag-outline" size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Código RFID</Text>
            </View>
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-base font-mono text-gray-900">{garment.rfid_code || 'N/A'}</Text>
            </View>
          </Card>

          {/* Información de la Prenda */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="information-circle-outline" size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Información</Text>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Descripción</Text>
              <Text className="text-base text-gray-900 font-medium">{garment.description || 'N/A'}</Text>
            </View>

            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-3">
                <Text className="text-xs text-gray-500 mb-1">Color</Text>
                <View className="flex-row items-center">
                  <IonIcon name="color-palette-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{garment.color || 'N/A'}</Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-3">
                <Text className="text-xs text-gray-500 mb-1">Peso</Text>
                <View className="flex-row items-center">
                  <IonIcon name="scale-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">
                    {garment.weight ? `${garment.weight} kg` : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {garment.observations && (
              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Observaciones</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-sm text-gray-800">{garment.observations}</Text>
                </View>
              </View>
            )}

            <View>
              <Text className="text-xs text-gray-500 mb-1">Estado</Text>
              <View className={`px-3 py-1.5 rounded-full self-start ${garment.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`text-sm font-medium ${garment.is_active ? 'text-green-700' : 'text-gray-600'}`}>
                  {garment.is_active ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Información de Registro */}
          {(garment.created_at || garment.updated_at) && (
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="calendar-outline" size={20} color="#2563EB" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Fechas</Text>
              </View>
              <View className="flex-row flex-wrap -mx-2">
                {garment.created_at && (
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Fecha de Creación</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="time-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">{formatDateTime(garment.created_at)}</Text>
                    </View>
                  </View>
                )}
                {garment.updated_at && (
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Última Actualización</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="reload-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">{formatDateTime(garment.updated_at)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Card>
          )}
        </ScrollView>

        {/* Actions */}
        <View className="p-4 border-t border-gray-200 bg-white">
          <Button
            title="Editar Prenda"
            onPress={() => {
              onClose();
              onEdit();
            }}
            variant="primary"
            icon={<IonIcon name="pencil-outline" size={18} color="white" />}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
};

