import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { GUIDE_STATUS_LABELS, GUIDE_STATUS_COLORS } from '@/constants/processes';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingAuth, setIsWaitingAuth] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!visible) {
      setShowAuthModal(false);
      setDescription('');
      setIsSubmitting(false);
      setIsWaitingAuth(false);
      setIsAuthorized(false);
    }
  }, [visible]);

  if (!guide) return null;

  const handleEditRequest = () => {
    setShowAuthModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!description.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simular envío de solicitud
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setShowAuthModal(false);
    setIsWaitingAuth(true);
    
    // Simular espera de autorización (3 segundos)
    setTimeout(() => {
      setIsWaitingAuth(false);
      setIsAuthorized(true);
      // Mostrar aprobación y luego abrir formulario
      setTimeout(() => {
        setIsAuthorized(false);
        setDescription('');
        onEdit();
        onClose();
      }, 2000);
    }, 3000);
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
              <View className="bg-yellow-50 rounded-lg p-2 mr-3">
                <IonIcon name="document-text-outline" size={24} color="#F59E0B" />
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
                <IonIcon name="information-circle-outline" size={20} color="#3B82F6" />
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

              <View>
                <Text className="text-xs text-gray-500 mb-1">Fecha de Creación</Text>
                <Text className="text-base text-gray-900">{guide.created_at}</Text>
              </View>
            </Card>

            {/* Información Adicional */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="shirt-outline" size={20} color="#3B82F6" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Prendas</Text>
              </View>

              <View>
                <Text className="text-xs text-gray-500 mb-1">Total de Prendas</Text>
                <Text className="text-base text-gray-900 font-medium">{guide.total_garments || 'N/A'}</Text>
              </View>
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
                disabled={isSubmitting}
                className="flex-1 mr-2"
              />
              <Button
                title="Enviar Solicitud"
                onPress={handleSubmitRequest}
                isLoading={isSubmitting}
                disabled={!description.trim()}
                className="flex-1 ml-2"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Espera de Autorización */}
      <Modal transparent visible={isWaitingAuth} animationType="fade" onRequestClose={() => {}}>
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
            <View className="flex-row items-center justify-center mb-4">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Esperando Autorización
            </Text>

            <Text className="text-base text-gray-700 text-center mb-4">
              Tu solicitud ha sido enviada al SuperAdmin.
            </Text>

            <Text className="text-sm text-gray-500 text-center">
              Procesando autorización...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Modal de Autorización Aprobada */}
      <Modal transparent visible={isAuthorized} animationType="fade" onRequestClose={() => {}}>
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full max-w-sm bg-white rounded-xl p-6 shadow-xl">
            <View className="flex-row items-center justify-center mb-4">
              <IonIcon name="checkmark-circle-outline" size={48} color="#10B981" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              ¡Autorización Aprobada!
            </Text>

            <Text className="text-base text-gray-700 text-center">
              El SuperAdmin ha aprobado tu solicitud. Redirigiendo al formulario de edición...
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};
