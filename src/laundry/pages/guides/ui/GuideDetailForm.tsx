import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, Modal, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Input, Dropdown } from '@/components/common';
import { ScanForm } from '@/laundry/pages/scan/ui/ScanForm';
import { sanitizeDecimalInput, isNonNegative } from '@/helpers/validators.helper';

type GuideDetailFormProps = {
  onSubmit: (data: any) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  guideData: any; // Datos de la guía guardados en memoria
  initialValues?: any;
  scannedTags?: string[];
  onNavigate?: (route: string, params?: any) => void;
  initialRfidScan?: { scan_type?: string; location?: string; differences_detected?: string } | undefined;
  // Contexto de edición
  editContext?: { guideId: string; guideGarmentId?: string; rfidScanId?: string } | undefined;
  initialGuide?: any;
  initialGuideGarment?: any;
  initialRfidScanFull?: any;
};

export const GuideDetailForm: React.FC<GuideDetailFormProps> = ({
  onSubmit,
  onCancel,
  submitting = false,
  guideData,
  initialValues,
  scannedTags = [],
  onNavigate,
  initialRfidScan,
  editContext,
  initialGuide,
  initialGuideGarment,
  initialRfidScanFull
}) => {
  const [formData, setFormData] = useState({
    garment_type: initialValues?.garment_type || '',
    predominant_color: initialValues?.predominant_color || '',
    requested_services: initialValues?.requested_services || ['WASH'],
    initial_state_description: initialValues?.initial_state_description || '',
    additional_cost: initialValues?.additional_cost || '0',
    observations: initialValues?.observations || '',
    // Nuevos campos basados en la imagen - vienen de la guía principal
    garment_weight: initialValues?.total_weight || '0.00',
    quantity: initialValues?.total_garments?.toString() || '1',
    label_printed: initialValues?.label_printed || false,
    incidents: initialValues?.incidents || '',
    // Sucursal del usuario logueado
    branch_office_id: initialValues?.branch_office_id || '',
    branch_office_name: initialValues?.branch_office_name || 'Sucursal',
  });

  const [showScanForm, setShowScanForm] = useState(false);

  const garmentTypes = [
    { label: 'Uniforme', value: 'UNIFORMS' },
    { label: 'Sabanas', value: 'SHEETS' },
    { label: 'Toallas', value: 'TOWELS' },
    { label: 'Manteles', value: 'TABLECLOTHS' },
    { label: 'Cortinas', value: 'CURTAINS' },
    { label: 'Tapetes', value: 'MATS' },
    { label: 'Otros', value: 'OTHER' }
  ];

  const colors = [
    { label: 'Blanco', value: 'WHITE' },
    { label: 'Colores Claros', value: 'LIGHT_COLORS' },
    { label: 'Colores Oscuros', value: 'DARK_COLORS' },
    { label: 'Mixto', value: 'MIXED' },
  ];

  const serviceOptions = [
    { label: 'Lavado', value: 'WASH' },
    { label: 'Secado', value: 'DRY' },
    { label: 'Planchado', value: 'IRON' },
    { label: 'Limpieza', value: 'CLEAN' },
  ];

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      requested_services: prev.requested_services.includes(service)
        ? prev.requested_services.filter((s: string) => s !== service)
        : [...prev.requested_services, service]
    }));
  };

  const handleSubmit = async () => {
    // Validar campos obligatorios
    if (!formData.garment_type) {
      Alert.alert('Error', 'Debe seleccionar un tipo de prenda');
      return;
    }
    if (!formData.predominant_color) {
      Alert.alert('Error', 'Debe seleccionar un color predominante');
      return;
    }
    if (formData.requested_services.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos un servicio');
      return;
    }
    
    // Validar costo adicional si existe
    if (formData.additional_cost && formData.additional_cost !== '0') {
      if (!isNonNegative(formData.additional_cost)) {
        Alert.alert('Error', 'El costo adicional debe ser un número válido mayor o igual a 0');
        return;
      }
    }

    // Abrir el formulario de escaneo y pasar todos los datos
    setShowScanForm(true);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Sucursal - Campo de solo lectura */}
          <View className="mb-4">
            <Input
              label="Sucursal"
              value={formData.branch_office_name}
              editable={false}
              className="bg-gray-50"
            />
          </View>

          {/* Tipo de Prenda */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Tipo de Prenda *</Text>
            <Dropdown
              options={garmentTypes}
              value={formData.garment_type}
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, garment_type: value }))}
              placeholder="Seleccionar tipo de prenda"
            disabled={!!editContext?.guideGarmentId}
            />
          </View>

          {/* Color Predominante */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Color Predominante *</Text>
            <Dropdown
              options={colors}
              value={formData.predominant_color}
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, predominant_color: value }))}
              placeholder="Seleccionar color"
            />
          </View>

          {/* Servicios Solicitados */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Servicios Solicitados *</Text>
            <View className="flex-row flex-wrap">
              {serviceOptions.map((service) => (
                <TouchableOpacity
                  key={service.value}
                  className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                    formData.requested_services.includes(service.value)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-300'
                  }`}
                  onPress={() => handleServiceToggle(service.value)}
                >
                  <Text className={`text-sm ${
                    formData.requested_services.includes(service.value)
                      ? 'text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}>
                    {service.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Descripción del Estado Inicial */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Descripción del Estado Inicial</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-3">
              <TextInput
                className="text-gray-900 min-h-[80px] text-left"
                placeholder="Ej: Buen estado general, pequeñas manchas en la manga izquierda, botones en perfecto estado..."
                placeholderTextColor="#9CA3AF"
                value={formData.initial_state_description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, initial_state_description: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              Describe el estado físico de la prenda al momento de recibirla
            </Text>
          </View>

          {/* Costo Adicional */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Costo Adicional ($)</Text>
            <Input
              value={formData.additional_cost}
              onChangeText={(text) => setFormData(prev => ({ ...prev, additional_cost: sanitizeDecimalInput(text) }))}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Peso y Cantidad */}
          <View className="mb-6 bg-yellow-50 p-4 rounded-lg">
            <Text className="text-base text-yellow-800 font-semibold mb-3">Peso y Cantidad</Text>
            <View className="flex-row -mx-1">
              <View className="flex-1 px-1">
                <Input
                  label="Peso de la Prenda (kg)"
                  placeholder="0.00"
                  value={formData.garment_weight}
                  editable={false}
                  className="bg-gray-50"
                />
              </View>
              <View className="flex-1 px-1">
                <Input
                  label="Cantidad"
                  placeholder="1"
                  value={formData.quantity}
                  editable={false}
                  className="bg-gray-50"
                />
              </View>
            </View>
            <Text className="text-xs text-gray-500 mt-2">
              Estos valores provienen de la guía principal
            </Text>
          </View>

          {/* Etiqueta e Incidencias */}
          <View className="mb-6 bg-blue-50 p-4 rounded-lg">
            <Text className="text-base text-blue-800 font-semibold mb-3">Etiqueta e Incidencias</Text>
            
            {/* Etiqueta Impresa */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Etiqueta Impresa</Text>
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-600 flex-1">
                  ¿Se ha impreso la etiqueta de seguimiento?
                </Text>
                <TouchableOpacity
                  onPress={() => setFormData(prev => ({ ...prev, label_printed: !prev.label_printed }))}
                  className="flex-row items-center"
                >
                  <View className={`w-5 h-5 border-2 rounded mr-2 ${formData.label_printed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                    {formData.label_printed && <IonIcon name="checkmark" size={12} color="white" />}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Incidencias/Novedades */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Incidencias/Novedades</Text>
              <View className="bg-white border border-gray-300 rounded-lg p-3">
                <TextInput
                  className="text-gray-900 min-h-[80px] text-left"
                  placeholder="Ej: Falta un botón, cremallera rota, mancha permanente, etc."
                  placeholderTextColor="#9CA3AF"
                  value={formData.incidents}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, incidents: text }))}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                Separa las incidencias con comas
              </Text>
            </View>
          </View>

          {/* Observaciones */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Observaciones</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-3">
              <TextInput
                className="text-gray-900 min-h-[60px] text-left"
                placeholder="Observaciones adicionales..."
                placeholderTextColor="#9CA3AF"
                value={formData.observations}
                onChangeText={(text) => setFormData(prev => ({ ...prev, observations: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Botón */}
          <View className="flex-row">
            <Button
              title="Continuar a Escaneo"
              variant="primary"
              onPress={handleSubmit}
              isLoading={submitting}
              fullWidth
              disabled={!formData.garment_type || !formData.predominant_color || formData.requested_services.length === 0}
            />
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={showScanForm} animationType="slide" onRequestClose={() => setShowScanForm(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <IonIcon name="scan-outline" size={20} color="#0b1f36" />
              <Text className="text-xl font-bold text-gray-900 ml-2">Nuevo Escaneo RFID</Text>
            </View>
            <TouchableOpacity onPress={() => setShowScanForm(false)} className="ml-auto">
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <View className="px-4 py-2">
            <Text className="text-sm text-gray-600 mb-4">
              Completa los datos para crear un nuevo escaneo RFID
            </Text>
          </View>
          <ScanForm
            onSubmit={(data) => {
              setShowScanForm(false);
              onCancel(); // Cerrar el modal principal
              // Navegar al Dashboard después de completar todo el proceso
              if (onNavigate) {
                onNavigate('Dashboard');
              }
            }}
            onCancel={() => {
              // Al cancelar con la X, cerrar también el modal de Detalle
              setShowScanForm(false);
              onCancel();
            }}
            submitting={false}
            guideData={guideData}
            guideGarmentData={formData}
            scannedTags={scannedTags}
            onNavigate={onNavigate}
            initialRfidScan={initialRfidScan}
            editContext={editContext}
            initialGuide={initialGuide}
            initialGuideGarment={initialGuideGarment}
            initialRfidScanFull={initialRfidScanFull}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};
