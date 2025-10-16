import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Card, Dropdown } from '@/components/common';
import { GuideItem } from '@/laundry/interfaces/guides/guides.interface';

type Option = { label: string; value: string };

interface GuideFormProps {
  clientOptions: Option[];
  selectedClientId?: string;
  onChangeClient: (id: string) => void;
  guideItems: GuideItem[];
  onRemoveItem: (epc: string) => void;
  onScan: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export const GuideForm: React.FC<GuideFormProps> = ({
  clientOptions,
  selectedClientId,
  onChangeClient,
  guideItems,
  onRemoveItem,
  onScan,
  onSubmit,
  submitting,
}) => {
  const renderItem = ({ item }: { item: GuideItem }) => (
    <Card variant="outlined" className="mb-3">
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-sm font-mono text-gray-700">{item.tagEPC}</Text>
          {item.proceso && (
            <Text className="text-xs text-gray-500 mt-1">Proceso: {item.proceso}</Text>
          )}
          {item.descripcion && (
            <Text className="text-xs text-gray-500 mt-1">{item.descripcion}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => onRemoveItem(item.tagEPC)} className="p-2">
          <Icon name="close-circle-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <>
      <View className="mb-6">
        <Dropdown
          label="Cliente *"
          placeholder="Selecciona un cliente"
          options={clientOptions}
          value={selectedClientId || ''}
          onValueChange={onChangeClient}
          icon="person-outline"
          searchable
        />
      </View>

      <View className="mb-6">
        <Button
          title="Escanear Prendas"
          onPress={onScan}
          icon={<Icon name="scan-outline" size={20} color="white" />}
          fullWidth
          size="lg"
          disabled={!selectedClientId}
        />
        {!selectedClientId && (
          <Text className="text-sm text-gray-500 mt-2 text-center">Selecciona un cliente para continuar</Text>
        )}
      </View>

      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-3">Prendas ({guideItems.length})</Text>
        {guideItems.length === 0 ? (
          <Card padding="md" className="items-center">
            <Text className="text-gray-500">No hay prendas agregadas</Text>
          </Card>
        ) : (
          <FlatList
            data={guideItems}
            renderItem={renderItem}
            keyExtractor={item => item.tagEPC}
            scrollEnabled={false}
          />
        )}
      </View>

      {guideItems.length > 0 && (
        <Button
          title="Crear Guía"
          onPress={onSubmit}
          isLoading={!!submitting}
          fullWidth
          size="lg"
          icon={<Icon name="checkmark-circle-outline" size={20} color="white" />}
        />
      )}
    </>
  );
};


