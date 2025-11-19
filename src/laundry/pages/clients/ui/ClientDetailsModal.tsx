import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, TextInput, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { formatDateTime } from '@/helpers';
import { useAuthStore } from '@/auth/store/auth.store';
import { isSuperAdminUser } from '@/helpers/user.helper';
import { useCreateAuthorizationRequest, useGetAuthorizationById } from '@/laundry/hooks/authorizations';
import { useDeleteClient } from '@/laundry/hooks/clients';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';


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
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authAction, setAuthAction] = useState<'EDIT' | 'DELETE' | null>(null);
  const [description, setDescription] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState('');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const { user } = useAuthStore();
  const isSuperAdmin = isSuperAdminUser(user);
  const { createAuthorizationRequestAsync, isCreating } = useCreateAuthorizationRequest();
  const { authorization, status: authStatus } = useGetAuthorizationById(
    currentRequestId,
    checkingAuth && !!currentRequestId
  );

  const { deleteClientAsync, isDeleting } = useDeleteClient();

  // Obtener catálogo de tipos de servicio para mostrar la etiqueta
  const { data: serviceTypeCatalog } = useCatalogValuesByType('service_type', true, { forceFresh: true });

  const serviceTypeLabel = useMemo(() => {
    if (!client?.service_type) return 'N/A';
    const catalogItem = serviceTypeCatalog?.data?.find(v => v.code === client.service_type);
    return catalogItem?.label || client.service_type;
  }, [client?.service_type, serviceTypeCatalog]);

  useEffect(() => {
    if (checkingAuth && authStatus) {
      if (authStatus === 'APPROVED') {
        const action = authAction;
        setCheckingAuth(false);
        setDescription('');
        setCurrentRequestId('');
        setAuthAction(null);
        setAuthModalVisible(false);

        if (action === 'EDIT') {
          onClose();
          onEdit();
        } else if (action === 'DELETE') {
          setDeleteConfirmVisible(true);
        }
      } else if (authStatus === 'REJECTED') {
        Alert.alert(
          'Solicitud rechazada',
          authAction === 'DELETE'
            ? 'El superadmin ha rechazado tu solicitud de eliminación.'
            : 'El superadmin ha rechazado tu solicitud de edición.'
        );
        setCheckingAuth(false);
        setDescription('');
        setCurrentRequestId('');
        setAuthAction(null);
        setAuthModalVisible(false);
      }
    }
  }, [checkingAuth, authStatus, authAction, onClose, onEdit]);

  useEffect(() => {
    if (!visible) {
      setAuthModalVisible(false);
      setDescription('');
      setCheckingAuth(false);
      setCurrentRequestId('');
      setAuthAction(null);
      setDeleteConfirmVisible(false);
    }
  }, [visible]);

  if (!client) return null;

  const handleEditRequest = () => {
    // Si es superadmin, ejecutar directamente sin solicitar autorización
    if (isSuperAdmin) {
      onClose();
      onEdit();
      return;
    }
    // Si no es superadmin, solicitar autorización
    setAuthAction('EDIT');
    setDescription('');
    setAuthModalVisible(true);
  };

  const handleDeleteRequest = () => {
    // Si es superadmin, abrir directamente el modal de confirmación de eliminación
    if (isSuperAdmin) {
      setDeleteConfirmVisible(true);
      return;
    }
    // Si no es superadmin, solicitar autorización
    setAuthAction('DELETE');
    setDescription('');
    setAuthModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    if (!authAction) return;
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor ingresa una razón para la solicitud');
      return;
    }

    try {
      const authRequest = await createAuthorizationRequestAsync({
        entity_type: 'clients',
        entity_id: client.id,
        action_type: authAction === 'DELETE' ? 'DELETE' : 'UPDATE',
        reason: description,
      });

      setCurrentRequestId(authRequest.id);
      setAuthModalVisible(false);
      setCheckingAuth(true);
    } catch (error: any) {
      const message = error?.message || 'No se pudo enviar la solicitud';
      Alert.alert('Error', message);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteClientAsync(client.id);
      setDeleteConfirmVisible(false);
      Alert.alert('Cliente eliminado', 'El cliente se eliminó correctamente.');
      onDelete();
      onClose();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      Alert.alert('Error', backendMessage || error?.message || 'No se pudo eliminar el cliente');
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
              <IonIcon name="person-outline" size={24} color="#8EB021" />
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
              <IonIcon name="information-circle-outline" size={20} color="#8EB021" />
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

            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Tipo de Servicio</Text>
              <Text className="text-base text-gray-900 font-medium">{serviceTypeLabel}</Text>
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
              <IonIcon name="call-outline" size={20} color="#8EB021" />
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
                  <IonIcon name="card-outline" size={16} color="#4B5563" />
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
              <IonIcon name="business-outline" size={20} color="#8EB021" />
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
              <IonIcon name="calendar-outline" size={20} color="#8EB021" />
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
          <View className="flex-row">
            <Button
              title="Eliminar"
              variant="danger"
              icon={<IonIcon name="trash-outline" size={18} color="white" />}
              onPress={handleDeleteRequest}
              className="flex-1 mr-3"
            />
            <Button
              title="Editar"
              variant="primary"
              icon={<IonIcon name="pencil-outline" size={18} color="white" />}
              onPress={handleEditRequest}
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </Modal>

    {/* Modal de Autorización */}
    <Modal transparent visible={authModalVisible} animationType="fade" onRequestClose={() => setAuthModalVisible(false)}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
          <View className="flex-row items-center justify-center mb-4">
            <IonIcon name="shield-checkmark-outline" size={28} color="#3B82F6" />
            <Text className="text-2xl font-bold text-gray-900 ml-3">Autorización requerida</Text>
          </View>

          <Text className="text-base text-gray-700 text-center mb-6">
            {authAction === 'DELETE'
              ? 'Se necesita autorización del SuperAdmin para eliminar este cliente.'
              : 'Se necesita autorización del SuperAdmin para editar este cliente.'}
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Descripción de la solicitud</Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg p-3 min-h-[80px] text-gray-900"
              placeholder="Describe por qué necesitas realizar esta acción..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="flex-row justify-around">
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setAuthModalVisible(false)}
              disabled={isCreating}
              className="flex-1 mr-2"
            />
            <Button
              title="Enviar solicitud"
              onPress={handleSubmitRequest}
              isLoading={isCreating}
              disabled={!description.trim()}
              className="flex-1 ml-2"
            />
          </View>
        </View>
      </View>
    </Modal>

    {/* Modal de Espera */}
    <Modal transparent visible={checkingAuth} animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
          <View className="flex-row items-center justify-center mb-4">
            <ActivityIndicator size="large" color="#8EB021" />
          </View>
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Esperando autorización
          </Text>
          <Text className="text-base text-gray-700 text-center mb-4">
            Tu solicitud ha sido enviada al SuperAdmin.
          </Text>
          <Text className="text-sm text-gray-500 text-center">Verificando autorización...</Text>
        </View>
      </View>
    </Modal>

    {/* Modal de Confirmación de Eliminación */}
    <Modal transparent visible={deleteConfirmVisible} animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <View className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mr-3">
              <IonIcon name="warning-outline" size={26} color="#DC2626" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-900">Confirmar eliminación</Text>
              <Text className="text-sm text-gray-600 mt-1">Revisa los datos antes de eliminar al cliente</Text>
            </View>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-xs text-gray-500 uppercase mb-1">Cliente</Text>
            <Text className="text-lg font-semibold text-gray-900">{client?.name || 'Sin nombre'}</Text>
            <View className="flex-row mt-3">
              <View className="flex-1 mr-2">
                <Text className="text-xs text-gray-500 uppercase">Identificación</Text>
                <Text className="text-sm text-gray-800 mt-1">{client?.identification_number || '—'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 uppercase">Estado</Text>
                <Text className="text-sm text-gray-800 mt-1">{client?.is_active ? 'Activo' : 'Inactivo'}</Text>
              </View>
            </View>
            <View className="mt-3">
              <Text className="text-xs text-gray-500 uppercase">Sucursal asignada</Text>
              <Text className="text-sm text-gray-800 mt-1">{client?.branch_office_name || '—'}</Text>
            </View>
          </View>

          <Text className="text-sm text-gray-600 mb-6">
            Esta acción no se puede deshacer y eliminará el acceso del cliente a la plataforma.
          </Text>

          <View className="flex-row">
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setDeleteConfirmVisible(false)}
              className="flex-1 mr-3"
              disabled={isDeleting}
            />
            <Button
              title="Eliminar definitivamente"
              variant="danger"
              icon={<IonIcon name="trash-outline" size={18} color="white" />}
              onPress={handleDeleteConfirm}
              className="flex-1"
              isLoading={isDeleting}
            />
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
};

