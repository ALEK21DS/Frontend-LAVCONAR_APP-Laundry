import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Input, Dropdown } from '@/components/common';
import { useAuthStore } from '@/auth/store/auth.store';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useCreateRfidScan, useCreateGuide, useCreateGuideGarment } from '@/laundry/hooks/guides';
import { safeParseFloat, safeParseInt } from '@/helpers/validators.helper';

type ScanFormProps = {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting?: boolean;
  guideData: any; // Datos de la guía guardados en memoria
  guideGarmentData: any; // Datos del detalle guardados en memoria
  scannedTags?: string[];
  onNavigate?: (route: string, params?: any) => void;
};

export const ScanForm: React.FC<ScanFormProps> = ({
  onSubmit,
  onCancel,
  submitting = false,
  guideData,
  guideGarmentData,
  scannedTags = [],
  onNavigate
}) => {
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();
  const { createGuideAsync, isCreating: isCreatingGuide } = useCreateGuide();
  const { createGuideGarmentAsync, isCreating: isCreatingGuideGarment } = useCreateGuideGarment();
  const { createRfidScanAsync, isCreating: isCreatingRfidScan } = useCreateRfidScan();
  
  // Obtener la sucursal del usuario logueado
  const branchOfficeId = user?.branch_office_id || user?.sucursalId || '';
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';
  
  const [formData, setFormData] = useState({
    branch_offices_id: branchOfficeId,
    branch_office_name: branchOfficeName,
    scan_type: '',
    scanned_quantity: scannedTags.length || 0,
    scanned_rfid_codes: scannedTags,
    location: '',
    differences_detected: '',
  });

  const scanTypes = [
    { label: 'Recolección', value: 'COLLECTION' },
    { label: 'Recepción en Almacén', value: 'WAREHOUSE_RECEPTION' },
    { label: 'Pre-lavado', value: 'PRE_WASH' },
    { label: 'Post-lavado', value: 'POST_WASH' },
    { label: 'Post-secado', value: 'POST_DRY' },
    { label: 'Conteo Final', value: 'FINAL_COUNT' },
    { label: 'Entrega', value: 'DELIVERY' },
  ];

  const handleSubmit = async () => {
    // Validar campos obligatorios
    if (!formData.scan_type) {
      Alert.alert('Error', 'Debe seleccionar un tipo de escaneo');
      return;
    }
    if (formData.scanned_rfid_codes.length === 0) {
      Alert.alert('Error', 'No hay códigos RFID escaneados');
      return;
    }

    let createdGuide: any = null;

    try {
      // ========== PASO 1: CREAR GUÍA ==========
      console.log('📤 1. Creando guía...');
      createdGuide = await createGuideAsync(guideData);
      console.log('✅ Guía creada:', createdGuide.guide_number);

      try {
        // ========== PASO 2: CREAR DETALLE ==========
        console.log('📤 2. Creando detalle de guía...');
        const guideGarmentPayload = {
          guide_id: createdGuide.id,
          branch_offices_id: guideGarmentData.branch_office_id,
          garment_type: guideGarmentData.garment_type,
          predominant_color: guideGarmentData.predominant_color,
          requested_services: guideGarmentData.requested_services,
          initial_state_desc: guideGarmentData.initial_state_description || undefined,
          additional_cost: safeParseFloat(guideGarmentData.additional_cost) || 0,
          observations: guideGarmentData.observations || undefined,
          garment_weight: safeParseFloat(guideGarmentData.garment_weight),
          quantity: safeParseInt(guideGarmentData.quantity) || 1,
          novelties: guideGarmentData.incidents ? guideGarmentData.incidents.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          label_printed: guideGarmentData.label_printed || false,
        };
        await createGuideGarmentAsync(guideGarmentPayload);
        console.log('✅ Detalle de guía creado');

        try {
          // ========== PASO 3: CREAR ESCANEO RFID ==========
          console.log('📤 3. Creando escaneo RFID...');
          
          // NOTA: user_id NO se envía, el backend lo obtiene del token JWT
          
          const rfidScanData = {
            guide_id: createdGuide.id,
            branch_offices_id: formData.branch_offices_id,
            scan_type: formData.scan_type as any,
            scanned_quantity: formData.scanned_quantity,
            scanned_rfid_codes: formData.scanned_rfid_codes,
            unexpected_codes: [],
            location: formData.location || undefined,
            differences_detected: formData.differences_detected || undefined,
          };
          
          console.log('📤 Datos a enviar:', JSON.stringify(rfidScanData, null, 2));
          await createRfidScanAsync(rfidScanData);
          console.log('✅ Escaneo RFID creado');

          // ✅ TODO EXITOSO
          onSubmit(formData);
          if (onNavigate) {
            onNavigate('Dashboard');
          }

        } catch (scanError: any) {
          console.error('❌ Error en paso 3 (Escaneo RFID):', scanError);
          console.error('❌ Error response:', scanError.response?.data);
          console.error('❌ Error status:', scanError.response?.status);
          console.error('❌ Error message:', scanError.message);
          
          const errorMessage = scanError.response?.data?.message || scanError.message;
          Alert.alert(
            'Error - Contacte al Superadmin',
            `Guía creada: ${createdGuide.guide_number}\nDetalle creado correctamente\n\n❌ Error al crear escaneo RFID:\n${errorMessage}\n\nContacte al superadmin para completar manualmente el escaneo.`
          );
        }

      } catch (detailError: any) {
        console.error('❌ Error en paso 2 (Detalle):', detailError);
        Alert.alert(
          'Error - Contacte al Superadmin',
          `Guía creada: ${createdGuide.guide_number}\n\n❌ Error al crear detalle\n\nContacte al superadmin para completar manualmente el detalle y escaneo.`
        );
      }

    } catch (guideError: any) {
      console.error('❌ Error en paso 1 (Guía):', guideError);
      Alert.alert('Error', guideError.message || 'No se pudo crear la guía. Intente nuevamente.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Sucursal */}
          <View className="mb-4">
            <Input
              label="Sucursal"
              value={formData.branch_office_name}
              editable={false}
              className="bg-gray-50"
            />
          </View>

          {/* Tipo de Escaneo */}
          <View className="mb-4">
            <Dropdown
              label="Tipo de Escaneo *"
              options={scanTypes}
              value={formData.scan_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, scan_type: value }))}
              placeholder="Seleccionar tipo de escaneo"
              icon="scan-outline"
            />
          </View>

          {/* Cantidad Escaneada */}
          <View className="mb-4">
            <Input
              label="Cantidad Escaneada *"
              value={String(formData.scanned_quantity)}
              editable={false}
              className="bg-gray-50"
            />
          </View>

          {/* Códigos RFID Escaneados */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Códigos RFID Escaneados *</Text>
            <View className="bg-gray-50 border border-gray-300 rounded-lg p-3">
              <TextInput
                className="text-gray-900 min-h-[100px] text-left"
                value={formData.scanned_rfid_codes.join(', ')}
                editable={false}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Ubicación */}
          <View className="mb-4">
            <Input
              label="Ubicación"
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Ej: Almacén principal, Área de lavado..."
              icon="location-outline"
            />
          </View>

          {/* Diferencias Detectadas */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Diferencias Detectadas</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-3">
              <TextInput
                className="text-gray-900 min-h-[80px] text-left"
                placeholder="Describe las diferencias encontradas..."
                placeholderTextColor="#9CA3AF"
                value={formData.differences_detected}
                onChangeText={(text) => setFormData(prev => ({ ...prev, differences_detected: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Botón */}
          <View className="flex-row">
            <Button
              title="Guardar Escaneo"
              variant="primary"
              onPress={handleSubmit}
              isLoading={isCreatingGuide || isCreatingGuideGarment || isCreatingRfidScan || submitting}
              fullWidth
              disabled={!formData.scan_type}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
