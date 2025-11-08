import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card, Button } from '@/components/common';
import { Incident } from '@/laundry/interfaces/incidents/incidents.interface';
import { formatDateTime } from '@/helpers/formatters.helper';
import { getStatusColor, getTypeColor } from '@/laundry/pages/incidents/incidents.utils';
import { useCatalogLabelMap } from '@/laundry/hooks';
import { useDeleteIncident } from '@/laundry/hooks/incidents';

interface IncidentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  incident: Incident | null;
  onEdit?: (incident: Incident) => void;
  onDelete?: () => void;
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  visible,
  onClose,
  incident,
  onEdit,
  onDelete,
}) => {
  const { getLabel: getIncidentTypeLabel } = useCatalogLabelMap('incident_type', { forceFresh: true });
  const { getLabel: getIncidentStatusLabel } = useCatalogLabelMap('incident_status', { forceFresh: true });
  const { getLabel: getActionTakenLabel } = useCatalogLabelMap('action_taken', { forceFresh: true, fallbackLabel: '—' });

  const { deleteIncidentAsync, isDeletingIncident } = useDeleteIncident();
  const [confirmVisible, setConfirmVisible] = useState(false);

  if (!incident) return null;

  const guideNumber = incident.guide?.guide_number || incident.guide_number || 'Sin guía';
  const userName = incident.user?.name || (incident as any).user_name || 'N/A';
  const userEmail = incident.user?.email || (incident as any).user_email || 'N/A';
  const branchName = incident.branch_offices?.name || (incident as any).branch_office_name || 'N/A';

  const handleDelete = async () => {
    try {
      await deleteIncidentAsync(incident.id);
      setConfirmVisible(false);
      Alert.alert('Incidente eliminado', 'El incidente se eliminó correctamente.');
      onDelete?.();
      onClose();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      Alert.alert('Error', backendMessage || error?.message || 'No se pudo eliminar el incidente');
    }
  };

  return (
    <>
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
                  {getIncidentTypeLabel(incident.incident_type, incident.incident_type_label || incident.incident_type || '—')}
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
                  {getIncidentStatusLabel(incident.status, incident.status_label || incident.status || '—')}
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
                        {getActionTakenLabel(incident.action_taken, incident.action_taken_label || incident.action_taken || '—')}
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

        <View className="p-4 border-t border-gray-200 bg-white">
          <View className="flex-row">
            <Button
              title="Eliminar"
              variant="danger"
              icon={<IonIcon name="trash-outline" size={18} color="white" />}
              onPress={() => setConfirmVisible(true)}
              className="flex-1 mr-3"
            />
            {onEdit && (
              <Button
                title="Editar"
                variant="primary"
                icon={<IonIcon name="pencil-outline" size={18} color="white" />}
                onPress={() => {
                  onClose();
                  onEdit(incident);
                }}
                className="flex-1"
              />
            )}
          </View>
        </View>
      </View>
    </Modal>

    <Modal transparent visible={confirmVisible} animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mr-3">
              <IonIcon name="warning-outline" size={26} color="#DC2626" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-900">Eliminar incidente</Text>
              <Text className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer</Text>
            </View>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-xs text-gray-500 uppercase mb-1">Guía</Text>
            <Text className="text-lg font-semibold text-gray-900">{guideNumber}</Text>
            <View className="flex-row mt-3">
              <View className="flex-1 mr-2">
                <Text className="text-xs text-gray-500 uppercase">Tipo</Text>
                <Text className="text-sm text-gray-800 mt-1">{getIncidentTypeLabel(incident.incident_type, incident.incident_type_label || incident.incident_type || '—')}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 uppercase">Estado</Text>
                <Text className="text-sm text-gray-800 mt-1">{getIncidentStatusLabel(incident.status, incident.incident_status_label || incident.status || '—')}</Text>
              </View>
            </View>
            <View className="mt-3">
              <Text className="text-xs text-gray-500 uppercase">Registrado por</Text>
              <Text className="text-sm text-gray-800 mt-1">{userName}</Text>
            </View>
          </View>

          <Text className="text-sm text-gray-600 mb-6">
            Se eliminará el incidente del historial. Esta acción no afecta a la guía ni a los procesos asociados.
          </Text>

          <View className="flex-row">
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setConfirmVisible(false)}
              className="flex-1 mr-3"
              disabled={isDeletingIncident}
            />
            <Button
              title="Eliminar definitivamente"
              variant="danger"
              icon={<IonIcon name="trash-outline" size={18} color="white" />}
              onPress={handleDelete}
              className="flex-1"
              isLoading={isDeletingIncident}
            />
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
};
