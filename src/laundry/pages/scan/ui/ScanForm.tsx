import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Input, Dropdown } from '@/components/common';
import { useAuthStore } from '@/auth/store/auth.store';

type ScanFormProps = {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting?: boolean;
  initialValues?: any;
  scannedTags?: string[];
  onNavigate?: (route: string, params?: any) => void;
};

export const ScanForm: React.FC<ScanFormProps> = ({
  onSubmit,
  onCancel,
  submitting = false,
  initialValues,
  scannedTags = [],
  onNavigate
}) => {
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    guide_id: initialValues?.guide_id || '',
    branch_office: initialValues?.branch_office || user?.sucursalId || 'centro',
    scan_type: initialValues?.scan_type || '',
    scanned_quantity: initialValues?.scanned_quantity || String(scannedTags.length || 1),
    rfid_codes: initialValues?.rfid_codes || scannedTags.join(', ') || '',
    detected_differences: initialValues?.detected_differences || '',
  });

  const [showGuideDropdown, setShowGuideDropdown] = useState(false);

  const branchOffices = [
    { label: 'Sucursal Centro', value: 'centro' },
    { label: 'Sucursal Norte', value: 'norte' },
    { label: 'Sucursal Sur', value: 'sur' },
    { label: 'Sucursal Este', value: 'este' },
    { label: 'Sucursal Oeste', value: 'oeste' },
  ];

  const scanTypes = [
    { label: 'Escaneo de Entrada', value: 'entrada' },
    { label: 'Escaneo de Salida', value: 'salida' },
    { label: 'Escaneo de Inventario', value: 'inventario' },
    { label: 'Escaneo de Verificación', value: 'verificacion' },
  ];

  const handleSubmit = () => {
    onSubmit(formData);
    // Navegar al Dashboard después de guardar
    if (onNavigate) {
      onNavigate('Dashboard');
    }
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

          {/* Sucursal */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Sucursal</Text>
            <Input
              value={branchOffices.find(office => office.value === formData.branch_office)?.label || 'Sucursal'}
              editable={false}
              className="bg-gray-50"
            />
          </View>

          {/* Tipo de Escaneo */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Tipo de Escaneo *</Text>
            <Dropdown
              options={scanTypes}
              value={formData.scan_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, scan_type: value }))}
              placeholder="Seleccionar tipo de escaneo"
            />
          </View>

          {/* Cantidad Escaneada */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Cantidad Escaneada *</Text>
            <Input
              value={formData.scanned_quantity}
              onChangeText={(text) => setFormData(prev => ({ ...prev, scanned_quantity: text }))}
              placeholder="1"
              keyboardType="numeric"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Número total de prendas escaneadas
            </Text>
          </View>

          {/* Códigos RFID Escaneados */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Códigos RFID Escaneados *</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-3">
              <TextInput
                className="text-gray-900 min-h-[100px] text-left"
                placeholder="Ingresa los códigos RFID separados por comas o líneas Ej: RFID001, RFID002, RFID003"
                placeholderTextColor="#9CA3AF"
                value={formData.rfid_codes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, rfid_codes: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Diferencias Detectadas */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Diferencias Detectadas</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-3">
              <TextInput
                className="text-gray-900 min-h-[80px] text-left"
                placeholder="Describe las diferencias encontradas..."
                placeholderTextColor="#9CA3AF"
                value={formData.detected_differences}
                onChangeText={(text) => setFormData(prev => ({ ...prev, detected_differences: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-1">
              Descripción de cualquier diferencia detectada
            </Text>
          </View>

          {/* Botón */}
          <View className="flex-row">
            <Button
              title="Guardar Escaneo"
              variant="primary"
              onPress={handleSubmit}
              isLoading={submitting}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
