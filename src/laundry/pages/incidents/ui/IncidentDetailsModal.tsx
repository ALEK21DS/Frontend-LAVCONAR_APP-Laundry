import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { Incident } from '@/laundry/interfaces/incidents/incidents.interface';
import { translateEnum, formatDateTime } from '@/helpers';

interface IncidentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  incident: Incident | null;
  onEdit?: () => void;
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  visible,
  onClose,
  incident,
  onEdit,
}) => {
  if (!incident) return null;

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'DELAY': '#F59E0B',
      'QUALITY_ISSUE': '#8B5CF6',
      'DAMAGE': '#EF4444',
      'LOSS': '#DC2626',
      'OTHER': '#6B7280',
    };
    return colors[type] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'OPEN': '#EF4444',
      'IN_PROGRESS': '#3B82F6',
      'RESOLVED': '#10B981',
      'CLOSED': '#6B7280',
    };
    return colors[status] || '#6B7280';
  };

  const guideNumber = incident.guide?.guide_number || incident.guide_number || 'Sin guía';
  const userName = incident.user?.name || (incident as any).user_name || 'N/A';
  const userEmail = incident.user?.email || (incident as any).user_email || 'N/A';
  const branchName = incident.branch_offices?.name || (incident as any).branch_office_name || 'N/A';

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <View className="flex-row items-center flex-1">
            <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
              <IonIcon name="warning-outline" size={24} color="#8EB021" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Detalles del Incidente</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <IonIcon name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Información de la Guía */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="document-text-outline" size={20} color="#8EB021" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Guía: {guideNumber}</Text>
            </View>

            {/* Tags de Tipo y Estado */}
            <View className="flex-row items-center space-x-2 mb-4">
              <View 
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${getTypeColor(incident.incident_type)}20` }}
              >
                <Text 
                  className="text-sm font-medium"
                  style={{ color: getTypeColor(incident.incident_type) }}
                >
                  {translateEnum(incident.incident_type, 'incident_type')}
                </Text>
              </View>
              <View 
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${getStatusColor(incident.status)}20` }}
              >
                <Text 
                  className="text-sm font-medium"
                  style={{ color: getStatusColor(incident.status) }}
                >
                  {translateEnum(incident.status, 'incident_status')}
                </Text>
              </View>
            </View>

            {/* Usuario */}
            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Usuario</Text>
              <View className="flex-row items-center">
                <IonIcon name="person-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-800 ml-2">{userName}</Text>
              </View>
            </View>

            {/* Email */}
            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Email</Text>
              <View className="flex-row items-center">
                <IonIcon name="mail-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-800 ml-2">{userEmail}</Text>
              </View>
            </View>

            {/* Sucursal */}
            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Sucursal</Text>
              <View className="flex-row items-center">
                <IonIcon name="business-outline" size={16} color="#4B5563" />
                <Text className="text-sm text-gray-800 ml-2">{branchName}</Text>
              </View>
            </View>

            {/* RFID */}
            {incident.rfid_code && (
              <View>
                <Text className="text-xs text-gray-500 mb-1">RFID</Text>
                <View className="flex-row items-center">
                  <IonIcon name="pricetag-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2 font-mono">{incident.rfid_code}</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Descripción del Incidente */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="document-text-outline" size={20} color="#8EB021" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Descripción del Incidente</Text>
            </View>
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-sm text-gray-800 leading-5">{incident.description}</Text>
            </View>
          </Card>

          {/* Resolución */}
          {(incident.responsible || incident.action_taken || (incident.compensation_amount !== undefined && incident.compensation_amount > 0)) && (
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="checkmark-circle-outline" size={20} color="#8EB021" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Resolución</Text>
              </View>

              <View className="flex-row flex-wrap -mx-2">
                {incident.responsible && (
                  <View className="w-full px-2 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Responsable</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="person-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">{incident.responsible}</Text>
                    </View>
                  </View>
                )}

                {incident.action_taken && (
                  <View className="w-full px-2 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Acción Tomada</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="construct-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">
                        {translateEnum(incident.action_taken, 'action_taken')}
                      </Text>
                    </View>
                  </View>
                )}

                {incident.compensation_amount !== undefined && incident.compensation_amount > 0 && (
                  <View className="w-full px-2 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Monto de Compensación</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="cash-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">
                        ${incident.compensation_amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Información de Registro */}
          {(incident.created_at || incident.updated_at) && (
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="calendar-outline" size={20} color="#8EB021" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Fechas</Text>
              </View>
              <View className="flex-row flex-wrap -mx-2">
                {incident.created_at && (
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Fecha de Creación</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="time-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">{formatDateTime(incident.created_at)}</Text>
                    </View>
                  </View>
                )}
                {incident.updated_at && (
                  <View className="w-1/2 px-2 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Última Actualización</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="reload-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">{formatDateTime(incident.updated_at)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Card>
          )}
        </ScrollView>

        {/* Actions */}
        {onEdit && (
          <View className="p-4 border-t border-gray-200 bg-white">
            <Button
              title="Editar Incidente"
              onPress={() => {
                onClose();
                onEdit();
              }}
              variant="primary"
              icon={<IonIcon name="pencil-outline" size={18} color="white" />}
              fullWidth
            />
          </View>
        )}
      </View>
    </Modal>
  );
};
