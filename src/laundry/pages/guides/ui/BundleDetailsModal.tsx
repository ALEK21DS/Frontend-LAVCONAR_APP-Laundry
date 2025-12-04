import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card } from '@/components/common';
import { formatDateTime } from '@/helpers/formatters.helper';
import { useDeleteBundle, useBundle } from '@/laundry/hooks/bundles';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Bundle } from '@/laundry/interfaces/bundles';
import { useCatalogLabelMap } from '@/laundry/hooks';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore } from '@/config/store/config.store';

interface BundleDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  bundle: Bundle | null;
  onDelete?: () => void;
}

export const BundleDetailsModal: React.FC<BundleDetailsModalProps> = ({
  visible,
  onClose,
  bundle,
  onDelete,
}) => {
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [garmentsDetails, setGarmentsDetails] = useState<any[]>([]);
  const [loadingGarments, setLoadingGarments] = useState(false);
  const [expandedGarmentType, setExpandedGarmentType] = useState<string | null>(null);

  const { deleteBundleAsync, isDeleting } = useDeleteBundle();
  const { getLabel: getGarmentTypeLabel } = useCatalogLabelMap('garment_type', { forceFresh: true, fallbackLabel: '—' });

  // Cargar detalles de las prendas cuando se abre el modal
  useEffect(() => {
    if (visible && bundle && bundle.scanned_rfid_codes.length > 0) {
      loadGarmentsDetails();
    }
  }, [visible, bundle]);

  const loadGarmentsDetails = async () => {
    if (!bundle) return;

    try {
      setLoadingGarments(true);
      console.log('📦 Cargando detalles de prendas para bulto:', bundle.bundle_number);
      console.log('🏷️ RFIDs a buscar:', bundle.scanned_rfid_codes);
      
      const { data } = await guidesApi.post('/get-garment-by-rfid-codes', {
        rfid_codes: bundle.scanned_rfid_codes,
      });
      
      console.log('✅ Respuesta del servidor:', data);
      console.log('📊 Registros de prendas encontrados:', data.data?.length || 0);
      
      const garments = data.data || [];
      const totalQuantity = garments.reduce((sum: number, g: any) => sum + (g.quantity || 1), 0);
      console.log('🔢 Total de prendas (suma de quantities):', totalQuantity);
      
      setGarmentsDetails(garments);
    } catch (error: any) {
      console.error('❌ Error al cargar detalles de prendas:', error);
      console.error('📋 Detalles del error:', error.response?.data || error.message);
      setGarmentsDetails([]);
    } finally {
      setLoadingGarments(false);
    }
  };

  const handleDelete = async () => {
    if (!bundle) return;

    try {
      await deleteBundleAsync(bundle.id);
      Alert.alert('Éxito', 'Bulto eliminado exitosamente');
      setDeleteConfirmVisible(false);
      onClose();
      if (onDelete) onDelete();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al eliminar bulto';
      Alert.alert('Error', errorMessage);
    }
  };

  const handlePrintLabel = async () => {
    if (!bundle) return;

    try {
      setIsPrinting(true);
      console.log('📄 Iniciando descarga del PDF de etiqueta del bulto:', bundle.bundle_number);

      // Obtener el token de autenticación desde AsyncStorage
      const token = await AsyncStorage.getItem('auth-token');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de autenticación. Inicie sesión nuevamente.');
        return;
      }

      // Obtener la URL base de la API desde el store
      const { apiBaseUrl } = useConfigStore.getState();

      // Construir la URL completa
      const url = `${apiBaseUrl}/admin-guides/print-bundle-qr/${bundle.id}`;

      // Configurar el nombre del archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `Etiqueta_Bulto_${bundle.bundle_number.replace(/[\/\s]/g, '-')}_${timestamp}.pdf`;

      console.log('💾 Descargando PDF desde:', url);
      console.log('📁 Nombre del archivo:', fileName);

      // Descargar el PDF con autenticación
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: ReactNativeBlobUtil.fs.dirs.DownloadDir + '/' + fileName,
          title: fileName,
          description: `Etiqueta del bulto ${bundle.bundle_number}`,
          mime: 'application/pdf',
          mediaScannable: true,
        },
      }).fetch('GET', url, {
        'Authorization': `Bearer ${token}`,
      });

      console.log('✅ PDF descargado exitosamente');

      // Mostrar confirmación
      Alert.alert(
        '✓ Etiqueta Generada',
        `La etiqueta del bulto ${bundle.bundle_number} se ha descargado correctamente. Revisa la carpeta de Descargas.`,
        [{ text: 'OK' }],
      );
    } catch (error: any) {
      console.error('❌ Error al generar/descargar la etiqueta:', error);
      const errorMessage = error?.message || 'No se pudo generar la etiqueta del bulto';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsPrinting(false);
    }
  };

  if (!bundle) return null;

  const statusColor = bundle.status === 'CREATED' ? '#3B82F6' : bundle.status === 'IN_PROCESS' ? '#F59E0B' : '#10B981';
  const statusLabel = bundle.status === 'CREATED' ? 'Creado' : bundle.status === 'IN_PROCESS' ? 'En Proceso' : 'Completado';

  // Agrupar prendas por TIPO sumando las cantidades (quantity)
  const garmentSummary = garmentsDetails.reduce((acc, g) => {
    // Usar el label del catálogo del tipo de prenda
    const garmentTypeCode = g.garment_type || 'UNKNOWN';
    const key = getGarmentTypeLabel(garmentTypeCode) || garmentTypeCode || 'Sin tipo';
    // Sumar la cantidad (quantity) de cada prenda, no contar ocurrencias
    acc[key] = (acc[key] || 0) + (g.quantity || 1);
    return acc;
  }, {} as Record<string, number>);

  // Calcular el total real de prendas (suma de quantities)
  const totalGarmentsCalculated = garmentsDetails.reduce((sum, g) => sum + (g.quantity || 1), 0);

  const summaryText = loadingGarments 
    ? 'Cargando...' 
    : garmentsDetails.length === 0 
      ? 'No se encontraron detalles de prendas' 
      : Object.entries(garmentSummary)
          .map(([desc, count]) => `${count}x ${desc}`)
          .join(', ');

  return (
    <>
      <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
          {/* Header */}
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <View className="flex-row items-center flex-1">
              <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: '#8EB02120' }}>
                <IonIcon name="cube" size={24} color="#8EB021" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Detalles del Bulto</Text>
                <Text className="text-sm text-gray-600 mt-1">{bundle.bundle_number}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <IonIcon name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Información General */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="information-circle-outline" size={20} color="#8EB021" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Información General</Text>
              </View>

              <View className="space-y-3">
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Guía Asociada</Text>
                  <Text className="text-sm text-gray-900 font-medium">{bundle.guide_number || 'N/A'}</Text>
                </View>

                <View>
                  <Text className="text-xs text-gray-500 mb-1">Cliente</Text>
                  <Text className="text-sm text-gray-900 font-medium">{bundle.client_name || 'N/A'}</Text>
                </View>

                <View>
                  <Text className="text-xs text-gray-500 mb-1">Sucursal</Text>
                  <Text className="text-sm text-gray-900 font-medium">{bundle.branch_office_name || 'N/A'}</Text>
                </View>

                {bundle.scan_location && (
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">Ubicación</Text>
                    <View className="flex-row items-center">
                      <IonIcon name="location-outline" size={16} color="#4B5563" />
                      <Text className="text-sm text-gray-800 ml-2">{bundle.scan_location}</Text>
                    </View>
                  </View>
                )}

                <View>
                  <Text className="text-xs text-gray-500 mb-1">Fecha de Creación</Text>
                  <Text className="text-sm text-gray-900">{formatDateTime(bundle.created_at)}</Text>
                </View>
              </View>
            </Card>

            {/* Resumen de Prendas */}
            <Card padding="md" variant="outlined" className="mb-4">
              <View className="flex-row items-center mb-3">
                <IonIcon name="shirt-outline" size={20} color="#8EB021" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Resumen de Prendas</Text>
              </View>

              {/* Total de prendas y peso */}
              <View className="bg-blue-50 rounded-lg p-3 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-700">Total de Prendas</Text>
                  <Text className="text-xl font-bold text-blue-800">
                    {loadingGarments ? '...' : totalGarmentsCalculated || bundle.total_garments}
                  </Text>
                </View>
                {bundle.total_weight && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-gray-700">Peso Total</Text>
                    <Text className="text-lg font-bold text-blue-800">{bundle.total_weight.toFixed(2)} kg</Text>
                  </View>
                )}
              </View>

              {/* Contenido - Estilo lista con badges clickeable */}
              <View className="bg-white border border-gray-200 rounded-lg p-3">
                <Text className="text-xs text-gray-500 uppercase mb-3 font-semibold">Contenido del Bulto</Text>
                {loadingGarments ? (
                  <View className="py-4">
                    <ActivityIndicator size="small" color="#8EB021" />
                  </View>
                ) : garmentsDetails.length === 0 ? (
                  <Text className="text-sm text-gray-500 text-center py-4">
                    No se encontraron detalles de las prendas
                  </Text>
                ) : (
                  Object.entries(garmentSummary).map(([garmentTypeLabel, count], index) => {
                    const isExpanded = expandedGarmentType === garmentTypeLabel;
                    // Filtrar las prendas de este tipo específico
                    const garmentsOfType = garmentsDetails.filter(g => {
                      const label = getGarmentTypeLabel(g.garment_type || 'UNKNOWN') || g.garment_type || 'Sin tipo';
                      return label === garmentTypeLabel;
                    });
                    
                    return (
                      <View key={garmentTypeLabel}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setExpandedGarmentType(isExpanded ? null : garmentTypeLabel)}
                          className={`flex-row items-center justify-between py-3 ${
                            index < Object.entries(garmentSummary).length - 1 && !isExpanded ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <View className="flex-row items-center flex-1">
                            <Text className="text-base text-gray-900 flex-1">{garmentTypeLabel}</Text>
                            <IonIcon 
                              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                              size={20} 
                              color="#6B7280" 
                              style={{ marginRight: 8 }}
                            />
                          </View>
                          <View className="bg-blue-100 px-4 py-1.5 rounded-full">
                            <Text className="text-base font-bold text-blue-900">{String(count)}</Text>
                          </View>
                        </TouchableOpacity>
                        
                        {/* Detalles expandidos */}
                        {isExpanded && (
                          <View className="bg-gray-50 rounded-lg p-3 mb-3 mt-2">
                            {garmentsOfType.map((garment, idx) => (
                              <View
                                key={garment.rfid_code || idx}
                                className={`py-3 ${idx < garmentsOfType.length - 1 ? 'border-b border-gray-200' : ''}`}
                              >
                                <View className="flex-row items-start mb-2">
                                  <IonIcon name="pricetag-outline" size={16} color="#4B5563" />
                                  <View className="flex-1 ml-2">
                                    <Text className="text-sm font-semibold text-gray-900">
                                      {garment.description || getGarmentTypeLabel(garment.garment_type) || 'Sin descripción'}
                                    </Text>
                                    {garment.garment_brand && (
                                      <Text className="text-xs text-gray-600 mt-1">
                                        Marca: {garment.garment_brand}
                                      </Text>
                                    )}
                                    <Text className="text-xs font-mono text-gray-500 mt-1">
                                      RFID: {garment.rfid_code}
                                    </Text>
                                    <View className="flex-row mt-2 space-x-3">
                                      {garment.weight && (
                                        <Text className="text-xs text-gray-600">
                                          Peso: {garment.weight} lb
                                        </Text>
                                      )}
                                      {garment.quantity && (
                                        <Text className="text-xs text-gray-600 ml-3">
                                          Cantidad: {garment.quantity}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </Card>

            {/* Notas */}
            {bundle.notes && (
              <Card padding="md" variant="outlined" className="mb-4">
                <View className="flex-row items-center mb-2">
                  <IonIcon name="document-text-outline" size={20} color="#8EB021" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">Notas</Text>
                </View>
                <Text className="text-sm text-gray-700">{bundle.notes}</Text>
              </Card>
            )}
          </ScrollView>

          {/* Actions */}
          <View className="p-4 border-t border-gray-200 bg-white">
            <View className="flex-row">
              <Button
                title="Eliminar"
                variant="danger"
                icon={<IonIcon name="trash-outline" size={18} color="white" />}
                onPress={() => setDeleteConfirmVisible(true)}
                className="flex-1 mr-3"
              />
              <Button
                title="Imprimir"
                variant="primary"
                icon={<IonIcon name="print-outline" size={18} color="white" />}
                onPress={handlePrintLabel}
                className="flex-1"
                isLoading={isPrinting}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        transparent
        visible={deleteConfirmVisible}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-md">
            <ScrollView>
              <View className="p-6">
                <View className="items-center mb-4">
                  <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-3">
                    <IonIcon name="warning-outline" size={32} color="#DC2626" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 text-center">
                    ¿Eliminar Bulto?
                  </Text>
                </View>

                <Text className="text-base text-gray-600 text-center mb-4">
                  ¿Estás seguro de que deseas eliminar el bulto{' '}
                  <Text className="font-semibold text-gray-900">{bundle?.bundle_number}</Text>?
                </Text>

                <Text className="text-sm text-gray-500 text-center mb-6">
                  Esta acción no se puede deshacer. Las prendas volverán a estar disponibles para otros bultos.
                </Text>

                <View className="flex-row">
                  <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={() => setDeleteConfirmVisible(false)}
                    className="flex-1 mr-2"
                    disabled={isDeleting}
                  />
                  <Button
                    title="Eliminar"
                    variant="danger"
                    icon={<IonIcon name="trash-outline" size={16} color="white" />}
                    onPress={handleDelete}
                    className="flex-1 ml-2"
                    isLoading={isDeleting}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

