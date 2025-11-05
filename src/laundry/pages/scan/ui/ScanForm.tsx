import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Input, Dropdown } from '@/components/common';
import { useAuthStore } from '@/auth/store/auth.store';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useCreateRfidScan, useCreateGuide } from '@/laundry/hooks/guides';
import { useUpdateGuide } from '@/laundry/hooks/guides/guide';
// Detalles de guía removidos del flujo
import { useUpdateRfidScan } from '@/laundry/hooks/guides/rfid-scan';
import { safeParseFloat, safeParseInt } from '@/helpers/validators.helper';

type ScanFormProps = {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting?: boolean;
  guideData: any; // Datos de la guía guardados en memoria
  // Detalles de guía removidos del flujo
  scannedTags?: string[];
  onNavigate?: (route: string, params?: any) => void;
  initialRfidScan?: { scan_type?: string; location?: string; differences_detected?: string } | undefined;
  editContext?: { guideId: string; guideGarmentId?: string; rfidScanId?: string } | undefined;
  initialGuide?: any;
  // Detalles de guía removidos del flujo
  initialRfidScanFull?: any;
};

export const ScanForm: React.FC<ScanFormProps> = ({
  onSubmit,
  onCancel,
  submitting = false,
  guideData,
  guideGarmentData,
  scannedTags = [],
  onNavigate,
  initialRfidScan,
  editContext,
  initialGuide,
  initialGuideGarment,
  initialRfidScanFull
}) => {
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();
  const { createGuideAsync, isCreating: isCreatingGuide } = useCreateGuide();
  const { createRfidScanAsync, isCreating: isCreatingRfidScan } = useCreateRfidScan();
  const { updateGuideAsync } = useUpdateGuide();
  const { updateRfidScanAsync } = useUpdateRfidScan();
  
  // Obtener la sucursal del usuario logueado
  const branchOfficeId = user?.branch_office_id || user?.sucursalId || '';
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';
  
  const [formData, setFormData] = useState({
    branch_offices_id: branchOfficeId,
    branch_office_name: branchOfficeName,
    scan_type: initialRfidScan?.scan_type || '',
    scanned_quantity: scannedTags.length || 0,
    scanned_rfid_codes: scannedTags,
    location: initialRfidScan?.location || '',
    differences_detected: initialRfidScan?.differences_detected || '',
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

  const buildDiff = (prev: any, curr: any) => {
    const diff: any = {};
    if (!prev) return curr; // si no hay previo, retornar todo (para crear)
    for (const key of Object.keys(curr)) {
      const prevVal = prev[key];
      const currVal = curr[key];
      const isArray = Array.isArray(prevVal) || Array.isArray(currVal);
      if (isArray) {
        const a = Array.isArray(prevVal) ? prevVal : [];
        const b = Array.isArray(currVal) ? currVal : [];
        if (JSON.stringify(a) !== JSON.stringify(b)) diff[key] = currVal;
        continue;
      }
      if (currVal !== prevVal) diff[key] = currVal;
    }
    return diff;
  };

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
      // ========== PASO 1: CREAR/ACTUALIZAR GUÍA ==========
      if (editContext?.guideId) {
        const guideDiff = buildDiff(initialGuide, guideData);
        if (Object.keys(guideDiff).length > 0) {
          await updateGuideAsync({ id: editContext.guideId, data: guideDiff });
        }
        createdGuide = { id: editContext.guideId };
      } else {
        createdGuide = await createGuideAsync(guideData);
      }

      try {
          // ========== PASO 2: CREAR/ACTUALIZAR ESCANEO RFID ==========
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
          } as any;

          if (editContext?.rfidScanId) {
            const rsDiff = buildDiff(initialRfidScanFull, rfidScanData);
            if (Object.keys(rsDiff).length > 0) {
              await updateRfidScanAsync({ id: editContext.rfidScanId, data: rsDiff });
            }
          } else {
            await createRfidScanAsync(rfidScanData);
          }

          // ✅ TODO EXITOSO
          onSubmit(formData);
          if (onNavigate) {
            onNavigate('Dashboard');
          }

      } catch (scanError: any) {
          const errorMessage = scanError.response?.data?.message || scanError.message;
          Alert.alert(
            'Error - Contacte al Superadmin',
            `Guía creada: ${createdGuide.guide_number}\n\n❌ Error al crear escaneo RFID:\n${errorMessage}\n\nContacte al superadmin para completar manualmente el escaneo.`
          );
      }

    } catch (guideError: any) {
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
              disabled={!!editContext?.rfidScanId}
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
              isLoading={isCreatingGuide || isCreatingRfidScan || submitting}
              fullWidth
              disabled={!formData.scan_type}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
