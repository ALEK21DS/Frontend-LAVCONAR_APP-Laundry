import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { formatDateTime } from '@/helpers';

interface ClientDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  client: any;
  onEdit: () => void;
  onDelete: () => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  visible,
  onClose,
  client,
  onEdit,
  onDelete,
}) => {
  if (!client) return null;

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar al cliente "${client.name}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            onDelete();
            onClose();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <View className="flex-row items-center flex-1">
            <View className="bg-blue-50 rounded-lg p-2 mr-3">
              <IonIcon name="person-outline" size={24} color="#2563EB" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Detalles del Cliente</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <IonIcon name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Información Básica */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="information-circle-outline" size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Información Básica</Text>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Nombre Completo</Text>
              <Text className="text-base text-gray-900 font-medium">{client.name}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Número de Identificación</Text>
              <Text className="text-base text-gray-900 font-medium">{client.identification_number}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Acrónimo</Text>
              <Text className="text-base text-gray-900 font-medium">{client.acronym || 'N/A'}</Text>
            </View>

            <View>
              <Text className="text-xs text-gray-500 mb-1">Estado</Text>
              <View className={`px-3 py-1.5 rounded-full self-start ${client.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`text-sm font-medium ${client.is_active ? 'text-green-700' : 'text-gray-600'}`}>
                  {client.is_active ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Información de Contacto */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="call-outline" size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Información de Contacto</Text>
            </View>

            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Email</Text>
                <View className="flex-row items-center">
                  <IonIcon name="mail-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{client.email || 'N/A'}</Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Número de Identificación</Text>
                <View className="flex-row items-center">
                  <IonIcon name="hash-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{client.identification_number || 'N/A'}</Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Teléfono</Text>
                <View className="flex-row items-center">
                  <IonIcon name="call-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{client.phone || 'N/A'}</Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Dirección</Text>
                <View className="flex-row items-center">
                  <IonIcon name="location-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{client.address || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Sucursal Asignada */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="business-outline" size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Sucursal Asignada</Text>
            </View>
            <Card padding="md" className="bg-blue-50 border-blue-200">
              <Text className="text-base font-semibold text-blue-900">{client.branch_office_name || 'N/A'}</Text>
              <Text className="text-sm text-blue-700">ID: {client.branch_office_id || 'N/A'}</Text>
            </Card>
          </Card>

          {/* Información de Registro */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="calendar-outline" size={20} color="#2563EB" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Información de Registro</Text>
            </View>
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Fecha de Creación</Text>
                <View className="flex-row items-center">
                  <IonIcon name="time-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{formatDateTime(client.created_at)}</Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Última Actualización</Text>
                <View className="flex-row items-center">
                  <IonIcon name="reload-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{formatDateTime(client.updated_at)}</Text>
                </View>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* Actions */}
        <View className="p-4 border-t border-gray-200 bg-white">
          <View className="flex-row space-x-3">
            <View className="flex-1 mr-2">
              <Button
                title="Editar"
                onPress={() => {
                  onClose();
                  onEdit();
                }}
                variant="primary"
                icon={<IonIcon name="pencil-outline" size={18} color="white" />}
                fullWidth
              />
            </View>
             <View className="flex-1 ml-2">
               <Button
                 title="Eliminar"
                 onPress={handleDelete}
                 icon={<IonIcon name="trash-outline" size={18} color="white" />}
                 fullWidth
                 style={{ backgroundColor: '#EF4444' }}
               />
             </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

