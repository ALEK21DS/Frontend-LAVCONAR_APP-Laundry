import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';

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
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
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
    </Modal>
  );
};
