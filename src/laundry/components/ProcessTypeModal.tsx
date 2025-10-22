import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PROCESS_TYPES } from '@/constants/processes';

interface ProcessTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProcess: (processType: string) => void;
  serviceType?: 'industrial' | 'personal';
}

export const ProcessTypeModal: React.FC<ProcessTypeModalProps> = ({
  visible,
  onClose,
  onSelectProcess,
  serviceType = 'industrial',
}) => {
  // Filtrar procesos según el tipo de servicio
  const getFilteredProcesses = () => {
    if (serviceType === 'personal') {
      // Para servicio personal, incluir PLANCHADO y DOBLADO
      return PROCESS_TYPES;
    } else {
      // Para servicio industrial, excluir PLANCHADO y DOBLADO
      return PROCESS_TYPES.filter(process => 
        process.value !== 'IRONING' && process.value !== 'FOLDING'
      );
    }
  };

  const filteredProcesses = getFilteredProcesses();

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
              <Text className="text-2xl font-bold text-gray-900">Seleccionar Proceso</Text>
              <Text className="text-sm text-gray-600 mt-1">Elige el tipo de proceso a realizar</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Process Types Grid */}
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap -mx-2">
              {filteredProcesses.map((process) => (
                <TouchableOpacity
                  key={process.value}
                  onPress={() => onSelectProcess(process.value)}
                  className="w-1/2 px-2 mb-4"
                >
                  <View 
                    className="p-4 rounded-2xl border-2 border-gray-100 active:border-gray-200"
                    style={{ backgroundColor: `${process.color}10` }}
                  >
                    <View className="items-center mb-3">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center mb-2"
                        style={{ backgroundColor: process.color }}
                      >
                        <Icon name={process.icon} size={24} color="white" />
                      </View>
                      <Text className="text-lg font-bold text-gray-900 text-center">
                        {process.label}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600 text-center leading-5">
                      {process.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
