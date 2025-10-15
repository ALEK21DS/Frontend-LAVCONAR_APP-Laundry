import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Button, Dropdown, Card } from '@/components/common';
import { EmptyState } from '@/components/ui/empty-state';
import { useClients } from '@/laundry/hooks/useClients';
import { useGuides } from '@/laundry/hooks/useGuides';
import { useGuideStore } from '@/laundry/store/guide.store';
import { useAuthStore } from '@/auth/store/auth.store';
import { PROCESSES } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { GuideItem } from '@/laundry/interfaces/guides/guides.interface';

type CreateGuidePageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const CreateGuidePage: React.FC<CreateGuidePageProps> = ({ navigation }) => {
  const { clients } = useClients();
  const { createGuide } = useGuides();
  const { user } = useAuthStore();
  const { selectedClientId, setSelectedClientId, guideItems, removeGuideItem, resetGuide } =
    useGuideStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientOptions = clients.map(client => ({
    label: `${client.name} - ${client.identification_number}`,
    value: client.id,
  }));

  const handleRemoveItem = (epc: string) => {
    Alert.alert('Eliminar prenda', '¿Estás seguro de eliminar esta prenda?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeGuideItem(epc),
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      Alert.alert('Error', 'Debes seleccionar un cliente');
      return;
    }

    if (guideItems.length === 0) {
      Alert.alert('Error', 'Debes agregar al menos una prenda');
      return;
    }

    const itemsWithoutProcess = guideItems.filter(item => !item.proceso);
    if (itemsWithoutProcess.length > 0) {
      Alert.alert('Error', 'Todas las prendas deben tener un proceso asignado');
      return;
    }

    setIsSubmitting(true);

    try {
      await createGuide.mutateAsync({
        client_id: selectedClientId,
        branch_office_id: user!.sucursalId,
        collection_date: new Date().toISOString(),
        general_condition: 'REGULAR',
        service_type: 'INDUSTRIAL',
        charge_type: 'BY_UNIT',
        total_garments: guideItems.length,
      });

      Alert.alert('Éxito', 'Guía creada correctamente', [
        {
          text: 'OK',
          onPress: () => {
            resetGuide();
            navigation.navigate('Dashboard');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la guía. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGuideItem = ({ item }: { item: GuideItem }) => {
    const process = PROCESSES.find(p => p.value === item.proceso);

    return (
      <Card variant="outlined" className="mb-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Icon name="pricetag-outline" size={16} color="#6B7280" />
              <Text className="text-sm font-mono text-gray-600 ml-2">{item.tagEPC}</Text>
            </View>
            {process && (
              <View className="flex-row items-center">
                <Icon name="construct-outline" size={16} color="#3B82F6" />
                <Text className="text-sm text-primary-DEFAULT ml-2">{process.label}</Text>
              </View>
            )}
            {item.descripcion && (
              <Text className="text-sm text-gray-500 mt-1">{item.descripcion}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => handleRemoveItem(item.tagEPC)} className="ml-3 p-2">
            <Icon name="close-circle-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <Container safe>
      <View className="flex-row items-center mb-6">
        <Button
          icon={<Icon name="arrow-back-outline" size={24} color="#3B82F6" />}
          variant="ghost"
          size="icon"
          onPress={() => {
            if (guideItems.length > 0) {
              Alert.alert(
                'Descartar cambios',
                '¿Estás seguro de salir? Se perderán los datos ingresados.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: () => {
                      resetGuide();
                      navigation.goBack();
                    },
                  },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        />
        <Text className="text-2xl font-bold text-gray-900 ml-2">Crear Guía</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="mb-6">
          <Dropdown
            label="Cliente *"
            placeholder="Selecciona un cliente"
            options={clientOptions}
            value={selectedClientId || ''}
            onValueChange={setSelectedClientId}
            icon="person-outline"
            searchable
          />

          <Button
            title="Registrar Nuevo Cliente"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('RegisterClient')}
            icon={<Icon name="person-add-outline" size={16} color="#3B82F6" />}
          />
        </View>

        <View className="mb-6">
          <Button
            title="Escanear Prendas"
            onPress={() => navigation.navigate('ScanClothes')}
            icon={<Icon name="scan-outline" size={20} color="white" />}
            fullWidth
            size="lg"
            disabled={!selectedClientId}
          />
          {!selectedClientId && (
            <Text className="text-sm text-gray-500 mt-2 text-center">
              Selecciona un cliente para continuar
            </Text>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Prendas ({guideItems.length})
          </Text>

          {guideItems.length === 0 ? (
            <EmptyState
              icon="shirt-outline"
              title="No hay prendas agregadas"
              message="Escanea prendas con RFID para agregarlas a la guía"
            />
          ) : (
            <FlatList
              data={guideItems}
              renderItem={renderGuideItem}
              keyExtractor={item => item.tagEPC}
              scrollEnabled={false}
            />
          )}
        </View>

        {guideItems.length > 0 && (
          <View className="space-y-3 mb-6">
            <Button
              title="Crear Guía"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
              icon={<Icon name="checkmark-circle-outline" size={20} color="white" />}
            />

            <Button
              title="Limpiar Todo"
              onPress={() => {
                Alert.alert('Limpiar', '¿Estás seguro de limpiar todas las prendas?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Limpiar',
                    style: 'destructive',
                    onPress: resetGuide,
                  },
                ]);
              }}
              variant="outline"
              fullWidth
              disabled={isSubmitting}
            />
          </View>
        )}
      </ScrollView>
    </Container>
  );
};
