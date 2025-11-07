import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { GUIDE_STATUS_LABELS, GUIDE_STATUS_COLORS } from '@/constants/processes';
import { formatDateTime } from '@/helpers/formatters.helper';
import { usePrintGuide } from '@/laundry/hooks/guides';
import { useCreateAuthorizationRequest, useGetAuthorizationById, useInvalidateAuthorization } from '@/laundry/hooks/authorizations';
import { useCatalogLabelMap } from '@/laundry/hooks';

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

  const { getLabel: getGuideStatusLabel } = useCatalogLabelMap('guide_status', { forceFresh: true, fallbackLabel: '—' });
  const { getLabel: getGeneralConditionLabel } = useCatalogLabelMap('general_condition', { forceFresh: true, fallbackLabel: '—' });
  const { getLabel: getServicePriorityLabel } = useCatalogLabelMap('service_priority', { forceFresh: true, fallbackLabel: '—' });
  const { getLabel: getWashingTypeLabel } = useCatalogLabelMap('washing_type', { forceFresh: true, fallbackLabel: '—' });
  const { getLabel: getRequestedServiceLabel } = useCatalogLabelMap('requested_service', { forceFresh: true, fallbackLabel: '—' });

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
        {/* Header - alineado al de prenda */}
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

        {/* Content - secciones espejo del modal de prenda */}
          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Información Básica */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="information-circle-outline" size={20} color="#8EB021" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Información</Text>
              </View>

              <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-2">Número de Guía</Text>
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xl font-bold text-blue-900">{guide.guide_number || 'N/A'}</Text>
              </View>
              </View>

            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-3">
                <Text className="text-xs text-gray-500 mb-1">Cliente</Text>
                <View className="flex-row items-center">
                  <IonIcon name="person-outline" size={16} color="#4B5563" />
                  <Text className="text-sm text-gray-800 ml-2">{guide.client_name || 'N/A'}</Text>
                </View>
              </View>
              <View className="w-1/2 px-2 mb-3">
                <Text className="text-xs text-gray-500 mb-1">Estado</Text>
                <View className={`px-3 py-1.5 rounded-full self-start`} style={{ backgroundColor: getStatusColor(guide.status) + '20' }}>
                  <Text className={`text-sm font-medium`} style={{ color: getStatusColor(guide.status) }}>
                    {getGuideStatusLabel(guide.status, guide.status_label || GUIDE_STATUS_LABELS[guide.status as keyof typeof GUIDE_STATUS_LABELS] || guide.status || '—')}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Números de Identificación */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="id-card-outline" size={20} color="#8EB021" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Números de Identificación</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-700">Número de Precinto:</Text>
              <View className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                <Text className="text-sm text-blue-800">{guide.precinct_number || '—'}</Text>
              </View>
            </View>
          </Card>

          {/* Información del Servicio */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center mb-3">
              <IonIcon name="construct-outline" size={20} color="#8EB021" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Información del Servicio</Text>
              </View>

              <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Tipo de Servicio</Text>
              <View className="px-3 py-1 rounded-full self-start bg-gray-100">
              <Text className="text-sm text-gray-800">{guide.service_type === 'PERSONAL' ? 'Personal' : 'Industrial'}</Text>
              </View>
              </View>

            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Condición General</Text>
              <View className="px-3 py-1 rounded-full self-start bg-gray-100">
                <Text className="text-sm text-gray-800">{getGeneralConditionLabel(guide.general_condition, guide.general_condition_label || '—')}</Text>
              </View>
                  </View>

            <View className="flex-row -mx-2 mb-3">
              <View className="w-1/2 px-2">
                <Text className="text-xs text-gray-500 mb-1">Prioridad del Servicio</Text>
                <View className="px-3 py-1 rounded-full self-start bg-gray-100">
                  <Text className="text-sm text-gray-800">{getServicePriorityLabel(guide.service_priority, guide.service_priority_label || '—')}</Text>
                </View>
              </View>
              <View className="w-1/2 px-2">
                <Text className="text-xs text-gray-500 mb-1">Tipo de Lavado</Text>
                <View className="px-3 py-1 rounded-full self-start bg-gray-100">
                  <Text className="text-sm text-gray-800">{getWashingTypeLabel(guide.washing_type, guide.washing_type_label || '—')}</Text>
                </View>
              </View>
                </View>

            <View>
              <Text className="text-xs text-gray-500 mb-2">Servicios Solicitados</Text>
              <View className="flex-row flex-wrap -m-1">
                {(Array.isArray(guide.requested_services) ? guide.requested_services : []).map((srv: string) => (
                  <View key={srv} className="m-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                  <Text className="text-xs text-blue-800">{getRequestedServiceLabel(srv, guide.requested_services_labels?.[srv] || srv)}</Text>
                  </View>
                ))}
                {(!guide.requested_services || guide.requested_services.length === 0) && (
                  <Text className="text-sm text-gray-500">—</Text>
                )}
              </View>
              </View>
            </Card>

          {/* Resumen de Guía */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
              <IonIcon name="shirt-outline" size={20} color="#8EB021" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Resumen</Text>
              </View>

            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-3">
                <Text className="text-xs text-gray-500 mb-1">Total Prendas</Text>
                <Text className="text-sm text-gray-800">{guide.total_garments ?? 0}</Text>
              </View>
              <View className="w-1/2 px-2 mb-3">
                <Text className="text-xs text-gray-500 mb-1">Peso Total</Text>
                <Text className="text-sm text-gray-800">{guide.total_weight ? `${guide.total_weight} kg` : 'N/A'}</Text>
              </View>
              {guide.collection_date && (
                <View className="w-1/2 px-2 mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Fecha de Recolección</Text>
                  <Text className="text-sm text-gray-800">{formatDateTime(guide.collection_date)}</Text>
                </View>
              )}
              {guide.delivery_date && (
                <View className="w-1/2 px-2 mb-3">
                  <Text className="text-xs text-gray-500 mb-1">Fecha de Entrega</Text>
                  <Text className="text-sm text-gray-800">{formatDateTime(guide.delivery_date)}</Text>
                </View>
              )}
            </View>

            {guide.notes && (
              <View className="mt-2">
                <Text className="text-xs text-gray-500 mb-1">Notas</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-sm text-gray-800">{guide.notes}</Text>
                    </View>
                  </View>
                )}
              </Card>

            {/* Exportar Guía */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="download-outline" size={20} color="#F59E0B" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Exportar Guía</Text>
              </View>
              <TouchableOpacity
                onPress={() => downloadGuidePDF(guide.id)}
                disabled={isPrinting}
              className={`flex-row items-center justify-center p-4 rounded-lg ${isPrinting ? 'bg-gray-300' : 'bg-red-500'}`}
              >
              <IonIcon name={isPrinting ? 'hourglass-outline' : 'document-text-outline'} size={20} color="white" />
              <Text className="text-white font-semibold ml-2">{isPrinting ? 'Generando PDF...' : 'Generar PDF'}</Text>
              </TouchableOpacity>
            <Text className="text-xs text-gray-500 mt-2 text-center">El PDF se descargará y aparecerá en las notificaciones</Text>
            </Card>

          {/* (Sin bloque de Exportar para igualar al modal de prenda) */}
          </ScrollView>

          {/* Actions */}
          <View className="p-4 border-t border-gray-200 bg-white">
            <Button
              title="Editar Guía"
            onPress={() => {
              onClose();
              onEdit();
            }}
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


