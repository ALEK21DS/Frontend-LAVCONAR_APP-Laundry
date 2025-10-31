import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { GUIDE_STATUS_LABELS, GUIDE_STATUS_COLORS } from '@/constants/processes';
import { formatDateTime } from '@/helpers/formatters.helper';
import { usePrintGuide } from '@/laundry/hooks/guides';
import { useCreateAuthorizationRequest, useGetAuthorizationById, useInvalidateAuthorization } from '@/laundry/hooks/authorizations';

interface GuideDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  guide: any;
  onEdit: () => void;
}

export const GuideDetailsModal: React.FC<GuideDetailsModalProps> = ({
  visible,
  onClose,
  guide,
  onEdit,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [description, setDescription] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string>('');
  
  // Hook para exportar PDF
  const { downloadGuidePDF, isPrinting } = usePrintGuide();
  
  // Hook para crear solicitud de autorización
  const { createAuthorizationRequestAsync, isCreating } = useCreateAuthorizationRequest();
  
  // Hook para invalidar autorizaciones existentes
  const { invalidateAuthorizationAsync } = useInvalidateAuthorization();
  
  // Hook para verificar el estado de la solicitud específica (solo se activa cuando checkingAuth es true)
  // El hook hace polling automático cada 3 segundos
  const { authorization, status: authStatus, isChecking } = useGetAuthorizationById(
    currentRequestId,
    checkingAuth && !!currentRequestId
  );

  // Efecto para monitorear el estado de autorización
  useEffect(() => {
    if (checkingAuth && authStatus) {
      if (authStatus === 'APPROVED') {
        // Autorización aprobada - abrir formulario directamente
        setCheckingAuth(false);
        setDescription('');
        setCurrentRequestId('');
        onEdit();
        onClose();
      } else if (authStatus === 'REJECTED') {
        // Autorización rechazada
        Alert.alert(
          'Solicitud Rechazada', 
          'El superadmin ha rechazado tu solicitud de edición.'
        );
        setCheckingAuth(false);
        setDescription('');
        setCurrentRequestId('');
      }
    }
  }, [checkingAuth, authStatus]);

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!visible) {
      setShowAuthModal(false);
      setDescription('');
      setCheckingAuth(false);
      setCurrentRequestId('');
    }
  }, [visible]);

  if (!guide) return null;

  const handleEditRequest = () => {
    setShowAuthModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor ingresa una razón para la solicitud');
      return;
    }

    try {
      // Crear la solicitud de autorización y guardar su ID
      const authRequest = await createAuthorizationRequestAsync({
        entity_type: 'guides',
        entity_id: guide.id,
        action_type: 'UPDATE',
        reason: description,
      });
      
      // Guardar el ID de la solicitud para verificar específicamente esta autorización
      setCurrentRequestId(authRequest.id);
      setShowAuthModal(false);
      setCheckingAuth(true);
    } catch (error: any) {
      const errorMessage = error.message || 'No se pudo enviar la solicitud';
      
      // Si el error es porque ya hay una solicitud pendiente, mostrar mensaje apropiado
      if (errorMessage.includes('pendiente') || errorMessage.includes('pending')) {
        Alert.alert(
          'Solicitud Pendiente', 
          'Ya existe una solicitud de autorización pendiente para esta guía. Espera a que sea procesada o contacta al superadmin.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const getStatusColor = (status: string) => {
    return GUIDE_STATUS_COLORS[status as keyof typeof GUIDE_STATUS_COLORS] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    return GUIDE_STATUS_LABELS[status as keyof typeof GUIDE_STATUS_LABELS] || status;
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
                <IonIcon name="document-text-outline" size={24} color="#8EB021" />
              </View>
              <Text className="text-xl font-bold text-gray-900">Detalles de la Guía</Text>
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
                <Text className="text-xs text-gray-500 mb-1">Número de Guía</Text>
                <Text className="text-base text-gray-900 font-medium">{guide.guide_number}</Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Cliente</Text>
                <Text className="text-base text-gray-900 font-medium">{guide.client_name}</Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Estado</Text>
                <View className={`px-3 py-1.5 rounded-full self-start`} style={{ backgroundColor: getStatusColor(guide.status) + '20' }}>
                  <Text className={`text-sm font-medium`} style={{ color: getStatusColor(guide.status) }}>
                    {getStatusLabel(guide.status)}
                  </Text>
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Fecha de Recolección</Text>
                <Text className="text-base text-gray-900">{guide.collection_date ? formatDateTime(guide.collection_date) : 'N/A'}</Text>
              </View>

              {guide.service_priority && (
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Prioridad</Text>
                  <View className={`px-3 py-1.5 rounded-full self-start ${
                    guide.service_priority === 'HIGH' ? 'bg-red-100' :
                    guide.service_priority === 'URGENT' ? 'bg-red-200' :
                    guide.service_priority === 'NORMAL' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    <Text className={`text-sm font-medium ${
                      guide.service_priority === 'HIGH' ? 'text-red-700' :
                      guide.service_priority === 'URGENT' ? 'text-red-800' :
                      guide.service_priority === 'NORMAL' ? 'text-blue-700' :
                      'text-gray-700'
                    }`}>
                      {guide.service_priority === 'HIGH' ? 'Alta' :
                       guide.service_priority === 'URGENT' ? 'Urgente' :
                       guide.service_priority === 'NORMAL' ? 'Normal' :
                       guide.service_priority === 'LOW' ? 'Baja' :
                       guide.service_priority}
                    </Text>
                  </View>
                </View>
              )}
            </Card>

            {/* Información Adicional */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="shirt-outline" size={20} color="#8EB021" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Prendas</Text>
              </View>

              <View className="flex-row -mx-2">
                <View className="flex-1 px-2">
                  <Text className="text-xs text-gray-500 mb-1">Total de Prendas</Text>
                  <Text className="text-base text-gray-900 font-medium">{guide.total_garments || 'N/A'}</Text>
                </View>

                {guide.total_weight && (
                  <View className="flex-1 px-2">
                    <Text className="text-xs text-gray-500 mb-1">Peso Total</Text>
                    <Text className="text-base text-gray-900 font-medium">{guide.total_weight} kg</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Información de Servicio */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="settings-outline" size={20} color="#8EB021" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Información de Servicio</Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Tipo de Servicio</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {guide.service_type === 'PERSONAL' ? 'Personal' : 'Industrial'}
                </Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Tipo de Cobro</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {guide.charge_type === 'BY_WEIGHT' ? 'Por Peso' : guide.charge_type === 'BY_UNIT' ? 'Por Unidad' : 'Fijo'}
                </Text>
              </View>

              {guide.washing_type && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Tipo de Lavado</Text>
                  <Text className="text-base text-gray-900 font-medium">
                    {guide.washing_type === 'DRY' ? 'En Seco' : guide.washing_type === 'WET' ? 'Húmedo' : 'Mixto'}
                  </Text>
                </View>
              )}

              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">Condición General</Text>
                <Text className="text-base text-gray-900 font-medium">
                  {guide.general_condition === 'GOOD' ? 'Buena' : 
                   guide.general_condition === 'REGULAR' ? 'Regular' : 
                   guide.general_condition === 'POOR' ? 'Deficiente' : 
                   guide.general_condition === 'DAMAGED' ? 'Dañado' : 'N/A'}
                </Text>
              </View>

              {guide.notes && (
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Notas</Text>
                  <Text className="text-sm text-gray-700">{guide.notes}</Text>
                </View>
              )}
            </Card>

            {/* Personal Involucrado */}
            {guide.service_type === 'INDUSTRIAL' && (
              <Card padding="md" variant="outlined" className="mb-4">
                <View className="flex-row items-center mb-3">
                  <IonIcon name="people-outline" size={20} color="#10B981" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">Personal Involucrado</Text>
                </View>

                {guide.driver_name && (
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Conductor</Text>
                    <Text className="text-base text-gray-900 font-medium">{guide.driver_name}</Text>
                  </View>
                )}

                {guide.delivered_by && (
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Entregado Por</Text>
                    <Text className="text-base text-gray-900 font-medium">{guide.delivered_by}</Text>
                  </View>
                )}

                {guide.received_by && (
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Recibido Por</Text>
                    <Text className="text-base text-gray-900 font-medium">{guide.received_by}</Text>
                  </View>
                )}

                {guide.vehicle_plate && (
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Vehículo</Text>
                    <View className="flex-row items-center">
                <IonIcon name="car-outline" size={16} color="#8EB021" />
                      <Text className="text-base text-gray-900 font-medium ml-2">{guide.vehicle_plate}</Text>
                    </View>
                  </View>
                )}

                {(!guide.driver_name && !guide.delivered_by && !guide.received_by && !guide.vehicle_plate) && (
                  <Text className="text-sm text-gray-500 italic">No hay información de personal registrada</Text>
                )}
              </Card>
            )}

            {/* Exportar Guía */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="download-outline" size={20} color="#F59E0B" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Exportar Guía</Text>
              </View>

              <TouchableOpacity
                onPress={() => downloadGuidePDF(guide.id)}
                disabled={isPrinting}
                className={`flex-row items-center justify-center p-4 rounded-lg ${
                  isPrinting ? 'bg-gray-300' : 'bg-red-500'
                }`}
              >
                <IonIcon 
                  name={isPrinting ? "hourglass-outline" : "document-text-outline"} 
                  size={20} 
                  color="white" 
                />
                <Text className="text-white font-semibold ml-2">
                  {isPrinting ? 'Generando PDF...' : 'Generar PDF'}
                </Text>
              </TouchableOpacity>

              <Text className="text-xs text-gray-500 mt-2 text-center">
                El PDF se descargará y aparecerá en las notificaciones
              </Text>
            </Card>
          </ScrollView>

          {/* Actions */}
          <View className="p-4 border-t border-gray-200 bg-white">
            <Button
              title="Editar Guía"
              onPress={handleEditRequest}
              variant="primary"
              icon={<IonIcon name="pencil-outline" size={18} color="white" />}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Autorización */}
      <Modal transparent visible={showAuthModal} animationType="fade" onRequestClose={() => setShowAuthModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
            <View className="flex-row items-center justify-center mb-4">
              <IonIcon name="shield-checkmark-outline" size={28} color="#3B82F6" />
              <Text className="text-2xl font-bold text-gray-900 ml-3">Autorización Requerida</Text>
            </View>

            <Text className="text-base text-gray-700 text-center mb-6">
              Se necesita autorización del SuperAdmin para editar esta guía.
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Descripción de la Solicitud</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg p-3 min-h-[80px] text-gray-900"
                placeholder="Describe por qué necesitas editar esta guía..."
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
                onPress={() => setShowAuthModal(false)}
                disabled={isCreating}
                className="flex-1 mr-2"
              />
              <Button
                title="Enviar Solicitud"
                onPress={handleSubmitRequest}
                isLoading={isCreating}
                disabled={!description.trim()}
                className="flex-1 ml-2"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Espera de Autorización */}
      <Modal transparent visible={checkingAuth} animationType="fade" onRequestClose={() => {}}>
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
            <View className="flex-row items-center justify-center mb-4">
              <ActivityIndicator size="large" color="#8EB021" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Esperando Autorización
            </Text>

            <Text className="text-base text-gray-700 text-center mb-4">
              Tu solicitud ha sido enviada al SuperAdmin.
            </Text>

            <Text className="text-sm text-gray-500 text-center">
              Verificando autorización...
            </Text>
          </View>
        </View>
      </Modal>

    </>
  );
};
