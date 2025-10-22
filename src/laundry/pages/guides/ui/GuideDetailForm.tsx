import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, Modal } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Input, Dropdown } from '@/components/common';
import { ScanForm } from '@/laundry/pages/scan/ui/ScanForm';

type GuideDetailFormProps = {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting?: boolean;
  initialValues?: any;
  scannedTags?: string[];
  onNavigate?: (route: string, params?: any) => void;
};

export const GuideDetailForm: React.FC<GuideDetailFormProps> = ({
  onSubmit,
  onCancel,
  submitting = false,
  initialValues,
  scannedTags = [],
  onNavigate
}) => {
  const [formData, setFormData] = useState({
    guide_id: initialValues?.guide_id || '',
    garment_type: initialValues?.garment_type || '',
    predominant_color: initialValues?.predominant_color || '',
    requested_services: initialValues?.requested_services || [],
    initial_state_description: initialValues?.initial_state_description || '',
    additional_cost: initialValues?.additional_cost || '0',
    observations: initialValues?.observations || '',
    // Nuevos campos basados en la imagen - vienen de la guía principal
    garment_weight: initialValues?.total_weight || '0.00',
    quantity: initialValues?.total_garments?.toString() || '1',
    label_printed: initialValues?.label_printed || false,
    incidents: initialValues?.incidents || '',
  });

  const [showGuideDropdown, setShowGuideDropdown] = useState(false);
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
    { label: 'Blanco', value: 'blanco' },
    { label: 'Colores Claros', value: 'LIGHT_COLORS' },
    { label: 'Colores Oscuros', value: 'DARK_COLORS' },
    { label: 'Mixto', value: 'MIXED' },
  ];

  const serviceOptions = [
    { label: 'Lavado', value: 'lavado' },
    { label: 'Secado', value: 'secado' },
    { label: 'Planchado', value: 'planchado' },
    { label: 'Limpieza', value: 'limpieza' },
  ];

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      requested_services: prev.requested_services.includes(service)
        ? prev.requested_services.filter((s: string) => s !== service)
        : [...prev.requested_services, service]
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setShowScanForm(true);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Guía */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Guía *</Text>
            <TouchableOpacity
              className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3"
              onPress={() => setShowGuideDropdown(!showGuideDropdown)}
            >
              <IonIcon name="search-outline" size={18} color="#6B7280" />
              <Text className="flex-1 ml-2 text-gray-900">
                {formData.guide_id || 'Buscar guía por número...'}
              </Text>
              <IonIcon 
                name={showGuideDropdown ? 'chevron-up' : 'chevron-down'} 
                size={18} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>

          {/* Tipo de Prenda */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Tipo de Prenda</Text>
            <Dropdown
              options={garmentTypes}
              value={formData.garment_type}
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, garment_type: value }))}
              placeholder="Seleccionar tipo de prenda"
            />
          </View>

          {/* Color Predominante */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Color Predominante</Text>
            <Dropdown
              options={colors}
              value={formData.predominant_color}
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, predominant_color: value }))}
              placeholder="Seleccionar color"
            />
          </View>

          {/* Servicios Solicitados */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Servicios Solicitados</Text>
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
              onChangeText={(text) => setFormData(prev => ({ ...prev, additional_cost: text }))}
              placeholder="0"
              keyboardType="numeric"
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
              title="Guardar"
              variant="primary"
              onPress={handleSubmit}
              isLoading={submitting}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={showScanForm} animationType="slide" onRequestClose={() => setShowScanForm(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <IonIcon name="scan-outline" size={20} color="#1f4eed" />
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
              console.log('Escaneo RFID creado:', data);
              setShowScanForm(false);
              onCancel(); // Cerrar el modal principal
              // Navegar al Dashboard después de completar todo el proceso
              if (onNavigate) {
                onNavigate('Dashboard');
              }
            }}
            onCancel={() => setShowScanForm(false)}
            submitting={false}
            initialValues={{ guide_id: formData.guide_id }}
            scannedTags={scannedTags}
            onNavigate={onNavigate}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};
