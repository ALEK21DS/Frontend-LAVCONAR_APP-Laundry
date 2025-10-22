import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button } from '@/components/common';

interface GuideStatusConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  guideNumber: string;
  currentStatus: string;
  newStatus: string;
  processType: string;
  isLoading?: boolean;
}

export const GuideStatusConfirmationModal: React.FC<GuideStatusConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  guideNumber,
  currentStatus,
  newStatus,
  processType,
  isLoading = false,
}) => {
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'RECEIVED': 'Recibida',
      'IN_PROCESS': 'En Proceso',
      'WASHING': 'Lavado',
      'DRYING': 'Secado',
      'IRONING': 'Planchado',
      'FOLDING': 'Doblado',
      'PACKAGING': 'Empaque',
      'SHIPPING': 'Embarque',
      'LOADING': 'Carga',
      'DELIVERY': 'Entregado',
      'COMPLETED': 'Completada',
    };
    return labels[status] || status;
  };

  const getProcessLabel = (type: string) => {
    const labels: Record<string, string> = {
      'IN_PROCESS': 'EN PROCESO',
      'WASHING': 'LAVADO',
      'DRYING': 'SECADO',
      'IRONING': 'PLANCHADO',
      'FOLDING': 'DOBLADO',
      'PACKAGING': 'EMPAQUE',
      'SHIPPING': 'EMBARQUE',
      'LOADING': 'CARGA',
      'DELIVERY': 'ENTREGA',
    };
    return labels[type] || type;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ elevation: 10 }}>
          {/* Icono de Alerta */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center">
              <Icon name="alert-circle-outline" size={32} color="#3B82F6" />
            </View>
          </View>

          {/* Título */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Confirmar Cambio de Estado
          </Text>

          {/* Mensaje */}
          <Text className="text-sm text-gray-600 text-center mb-4">
            ¿Estás seguro de que quieres cambiar el estado de la guía?
          </Text>

          {/* Información de la Guía */}
          <View className="bg-gray-50 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Icon name="document-text-outline" size={18} color="#6B7280" />
              <Text className="text-sm font-semibold text-gray-700 ml-2">Guía</Text>
            </View>
            <Text className="text-base font-bold text-gray-900 mb-3">
              {guideNumber}
            </Text>

            {/* Estado Actual → Nuevo Estado */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Estado Actual</Text>
                <View className="bg-yellow-100 px-3 py-2 rounded">
                  <Text className="text-sm font-medium text-yellow-800">
                    {getStatusLabel(currentStatus)}
                  </Text>
                </View>
              </View>

              <View className="mx-3">
                <Icon name="arrow-forward" size={20} color="#9CA3AF" />
              </View>

              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Nuevo Estado</Text>
                <View className="bg-blue-100 px-3 py-2 rounded">
                  <Text className="text-sm font-medium text-blue-800">
                    {getStatusLabel(newStatus)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Proceso */}
            <View className="mt-3 pt-3 border-t border-gray-200">
              <Text className="text-xs text-gray-500 mb-1">Proceso</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {getProcessLabel(processType)}
              </Text>
            </View>
          </View>

          {/* Advertencia */}
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-start">
              <Icon name="warning-outline" size={18} color="#F59E0B" />
              <Text className="text-xs text-amber-800 ml-2 flex-1">
                Esta acción actualizará el estado de la guía y todas sus prendas asociadas.
              </Text>
            </View>
          </View>

          {/* Botones */}
          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Button
                title="Cancelar"
                variant="outline"
                onPress={onClose}
                disabled={isLoading}
                fullWidth
              />
            </View>
            <View className="flex-1">
              <Button
                title="Confirmar"
                variant="primary"
                onPress={onConfirm}
                isLoading={isLoading}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

