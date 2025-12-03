import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetUserAuthorizations } from '@/laundry/hooks/authorizations';
import { useNotificationsStore } from '@/laundry/store/notifications.store';
import { formatDateTime } from '@/helpers';
import { useClient } from '@/laundry/hooks/clients';
import { useGuide } from '@/laundry/hooks/guides/guide';
import type { AuthorizationRequest } from '@/laundry/interfaces/authorizations/authorization.interface';

// Componente para mostrar datos de la entidad
const EntityDataDisplay: React.FC<{ notification: AuthorizationRequest }> = ({ notification }) => {
  const { client } = useClient(
    notification.entity_type === 'clients' ? notification.entity_id : null
  );
  const { guide } = useGuide(
    notification.entity_type === 'guides' ? notification.entity_id : null
  );

  if (notification.entity_type === 'clients' && client) {
    return (
      <View className="flex-row items-center mt-0.5">
        <Icon name="person-outline" size={13} color="#6B7280" />
        <Text className="text-xs font-medium text-gray-700 ml-1.5" numberOfLines={1}>
          {client.name} {client.acronym && `(${client.acronym})`}
        </Text>
      </View>
    );
  }

  if (notification.entity_type === 'guides') {
    if (guide && guide.guide_number) {
      return (
        <View className="flex-row items-center mt-0.5">
          <Icon name="document-text-outline" size={13} color="#6B7280" />
          <Text className="text-xs font-medium text-gray-700 ml-1.5" numberOfLines={1}>
            Guía #{guide.guide_number}
          </Text>
        </View>
      );
    }
    // Fallback: mostrar ID de la entidad
    return (
      <View className="flex-row items-center mt-0.5">
        <Icon name="document-text-outline" size={13} color="#6B7280" />
        <Text className="text-xs font-medium text-gray-700 ml-1.5" numberOfLines={1}>
          ID: {notification.entity_id.substring(0, 8)}...
        </Text>
      </View>
    );
  }

  return null;
};

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress: (notification: AuthorizationRequest) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  onNotificationPress,
}) => {
  const { approvedAuthorizations, refetch } = useGetUserAuthorizations(visible);
  const { getActiveNotifications, markAsProcessed, markAllAsProcessed } = useNotificationsStore();

  // Obtener notificaciones activas (filtradas por las que no han sido procesadas)
  const activeNotifications = getActiveNotifications(approvedAuthorizations);

  // Refetch al abrir el modal
  useEffect(() => {
    if (visible) {
      refetch();
    }
  }, [visible, refetch]);

  const handleNotificationPress = (notification: AuthorizationRequest) => {
    onClose();
    onNotificationPress(notification);
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Eliminar notificación',
      '¿Deseas eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => markAsProcessed(id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (activeNotifications.length === 0) return;

    Alert.alert(
      'Limpiar notificaciones',
      '¿Deseas eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar todas',
          style: 'destructive',
          onPress: () => {
            // Marcar todas las notificaciones activas como procesadas
            const idsToMark = activeNotifications.map(n => n.id);
            markAllAsProcessed(idsToMark);
          },
        },
      ]
    );
  };

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'clients':
        return 'Cliente';
      case 'guides':
        return 'Guía';
      default:
        return entityType;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'UPDATE':
        return 'Editar';
      case 'DELETE':
        return 'Eliminar';
      default:
        return actionType;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'UPDATE':
        return 'pencil-outline';
      case 'DELETE':
        return 'trash-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'UPDATE':
        return '#3B82F6'; // blue
      case 'DELETE':
        return '#DC2626'; // red
      default:
        return '#8EB021'; // green
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
              <Icon name="notifications-outline" size={24} color="#8EB021" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              Notificaciones
            </Text>
            {activeNotifications.length > 0 && (
              <View className="ml-2 bg-red-500 rounded-full px-2 py-0.5 min-w-[20px] items-center">
                <Text className="text-xs font-bold text-white">
                  {activeNotifications.length}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center">
            {activeNotifications.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                className="mr-3 p-2"
                activeOpacity={0.7}
              >
                <Icon name="trash-outline" size={22} color="#DC2626" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} className="p-2">
              <Icon name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {activeNotifications.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Icon name="notifications-off-outline" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No hay notificaciones
              </Text>
              <Text className="text-sm text-gray-500 text-center px-8">
                Te notificaremos cuando tus solicitudes sean aprobadas
              </Text>
            </View>
          ) : (
            activeNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
                className="bg-white border border-gray-200 rounded-lg p-3 mb-2.5 shadow-sm"
              >
                <View className="flex-row items-center">
                  {/* Icon - más pequeño */}
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${getActionColor(notification.action_type)}20` }}
                  >
                    <Icon
                      name={getActionIcon(notification.action_type)}
                      size={20}
                      color={getActionColor(notification.action_type)}
                    />
                  </View>

                  {/* Content - más compacto */}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className="text-sm font-bold text-gray-900">
                        {getActionLabel(notification.action_type)} {getEntityLabel(notification.entity_type)}
                      </Text>
                      <View className="px-1.5 py-0.5 rounded bg-green-100">
                        <Text className="text-[10px] font-semibold text-green-700">
                          APROBADA
                        </Text>
                      </View>
                    </View>

                    {/* Datos de la entidad */}
                    <EntityDataDisplay notification={notification} />

                    <View className="flex-row items-center justify-between mt-1.5">
                      <Text className="text-[10px] text-gray-500">
                        {formatDateTime(notification.updated_at || notification.created_at)}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-[10px] font-medium text-gray-600 mr-0.5">
                          Toca para continuar
                        </Text>
                        <Icon name="arrow-forward" size={10} color="#8EB021" />
                      </View>
                    </View>
                  </View>

                  {/* Delete button - más pequeño */}
                  <TouchableOpacity
                    onPress={(e) => {
                      // Prevenir que se dispare el onPress del card
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                    className="p-1.5 ml-2"
                    activeOpacity={0.7}
                  >
                    <Icon name="close-circle-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

