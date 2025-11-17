import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SCAN_RANGE_ORDER, SCAN_RANGE_PRESETS, ScanRangeKey } from '@/constants/scanRange';

type ScanRangeModalProps = {
  visible: boolean;
  selectedKey: ScanRangeKey;
  onClose: () => void;
  onSelect: (key: ScanRangeKey) => void;
};

export const ScanRangeModal: React.FC<ScanRangeModalProps> = ({
  visible,
  selectedKey,
  onClose,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-2xl p-5">
        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center flex-1">
            <Icon name="radio-outline" size={22} color="#0b1f36" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Ajustar alcance</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-gray-600 mb-4">
          Elige el nivel de alcance para controlar la potencia del lector y la sensibilidad del
          escaneo.
        </Text>
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex-row">
          <Icon name="warning-outline" size={18} color="#b45309" />
          <Text className="text-xs text-yellow-800 ml-2 flex-1">
            La sensibilidad del escáner es delicada: potencias altas pueden captar prendas cercanas
            o coincidir con etiquetas vecinas.
          </Text>
        </View>

        <ScrollView>
          {SCAN_RANGE_ORDER.map(key => {
            const option = SCAN_RANGE_PRESETS[key];
            const isSelected = selectedKey === key;

            return (
              <TouchableOpacity
                key={key}
                onPress={() => onSelect(key)}
                activeOpacity={0.9}
                className={`border rounded-xl p-4 mb-3 ${
                  isSelected ? 'border-primary-DEFAULT bg-primary-DEFAULT/5' : 'border-gray-200'
                }`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                        isSelected ? 'bg-primary-DEFAULT' : 'bg-gray-100'
                      }`}>
                      <Icon
                        name={isSelected ? 'checkmark' : 'scan-outline'}
                        size={18}
                        color={isSelected ? '#fff' : '#555'}
                      />
                    </View>
                    <Text className="text-base font-semibold text-gray-900">{option.label}</Text>
                  </View>
                  <Text className="text-xs font-medium text-gray-500">{option.distance}</Text>
                </View>
                <Text className="text-sm text-gray-600 mb-1">{option.description}</Text>
                <Text className="text-xs text-gray-500">
                  RSSI mínimo: {option.minRssi} dBm · Potencia: {option.power} dBm
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

