import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';

interface ServiceTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectService: (serviceType: 'industrial' | 'personal') => void;
  title?: string;
}

export const ServiceTypeModal: React.FC<ServiceTypeModalProps> = ({
  visible,
  onClose,
  onSelectService,
  title = 'Seleccionar Tipo de Servicio'
}) => {
  const handleSelect = (serviceType: 'industrial' | 'personal') => {
    onSelectService(serviceType);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-1/5 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <View className="flex-row items-center flex-1">
            <IonIcon name="business-outline" size={24} color="#3B82F6" />
            <Text className="text-xl font-bold text-gray-900 ml-2">{title}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <IonIcon name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 p-4">
          {/* Service Options */}
          <View className="space-y-3">
            {/* Industrial Service */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSelect('industrial')}
            >
              <Card padding="md" className="bg-blue-50 border-blue-200">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 rounded-lg p-3 mr-4">
                    <IonIcon name="construct-outline" size={24} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-blue-900 mb-1">
                      Servicio Industrial
                    </Text>
                    <Text className="text-sm text-blue-700">
                      Procesamiento masivo de prendas industriales
                    </Text>
                  </View>
                  <IonIcon name="chevron-forward" size={20} color="#2563EB" />
                </View>
              </Card>
            </TouchableOpacity>

            {/* Personal Service */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSelect('personal')}
            >
              <Card padding="md" className="bg-green-50 border-green-200">
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-lg p-3 mr-4">
                    <IonIcon name="person-outline" size={24} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-green-900 mb-1">
                      Servicio Personal
                    </Text>
                    <Text className="text-sm text-green-700">
                      Atención personalizada y entrega directa
                    </Text>
                  </View>
                  <IonIcon name="chevron-forward" size={20} color="#059669" />
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
