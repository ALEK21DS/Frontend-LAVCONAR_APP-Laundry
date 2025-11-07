import React, { useMemo, useState, useEffect } from 'react';
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
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';

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
  // Si es true, NO actualiza el RFID scan inmediatamente, sino que pasa los datos al callback
  deferRfidScanUpdate?: boolean;
  unregisteredCodes?: string[];
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
  initialRfidScanFull,
  deferRfidScanUpdate = false,
  unregisteredCodes = [],
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

  // Número de guía para mostrar en cabecera
  const guideNumber = initialGuide?.guide_number || guideData?.guide_number || '';

  // Calcular códigos inesperados (tags nuevos no presentes en el escaneo anterior)
  const initialCodes: string[] = useMemo(() => {
    if (Array.isArray(initialRfidScanFull?.scanned_rfid_codes)) {
      return initialRfidScanFull.scanned_rfid_codes;
    }
    if (Array.isArray((initialRfidScan as any)?.scanned_rfid_codes)) {
      return (initialRfidScan as any).scanned_rfid_codes;
    }
    return [];
  }, [initialRfidScan, initialRfidScanFull]);

  const hasBaseline = initialCodes.length > 0;

  const computedUnexpected = useMemo(() => {
    if (!hasBaseline) {
      return [];
    }
    const prevSet = new Set((initialCodes || []).map((c: string) => c?.trim()));
    return (scannedTags || []).filter((c) => !prevSet.has(c?.trim()));
  }, [initialCodes, scannedTags, hasBaseline]);
  
  const [formData, setFormData] = useState({
    branch_offices_id: branchOfficeId,
    branch_office_name: branchOfficeName,
    scan_type: initialRfidScan?.scan_type || 'COLLECTED',
    scanned_quantity: scannedTags.length || 0,
    scanned_rfid_codes: scannedTags,
    differences_detected: initialRfidScan?.differences_detected || '',
    unexpected_codes: hasBaseline ? computedUnexpected : unregisteredCodes,
  });

  // Mantener sincronizados cantidad y códigos inesperados si cambia el escaneo en tiempo real
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      scanned_quantity: scannedTags.length || 0,
      scanned_rfid_codes: scannedTags,
      unexpected_codes: computedUnexpected,
    }));
  }, [scannedTags, computedUnexpected, hasBaseline, unregisteredCodes]);

  // Catálogo dinámico de tipos de escaneo (scan_type) con datos frescos
  const { data: scanTypeCatalog } = useCatalogValuesByType('scan_type', true, { forceFresh: true });

  const scanTypes = useMemo(() => {
    const catalogOptions = (scanTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a,b) => (a.display_order||0) - (b.display_order||0))
      .map(v => ({ label: v.label, value: v.code }));

    if (catalogOptions.length > 0) return catalogOptions;

    // Fallback por si el catálogo llega vacío
    return [
    { label: 'Recolección', value: 'COLLECTION' },
    { label: 'Recepción en Almacén', value: 'WAREHOUSE_RECEPTION' },
    { label: 'Pre-lavado', value: 'PRE_WASH' },
    { label: 'Post-lavado', value: 'POST_WASH' },
    { label: 'Post-secado', value: 'POST_DRY' },
    { label: 'Conteo Final', value: 'FINAL_COUNT' },
    { label: 'Entrega', value: 'DELIVERY' },
  ];
  }, [scanTypeCatalog]);

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
    if (formData.scanned_rfid_codes.length === 0) {
      Alert.alert('Error', 'No hay códigos RFID escaneados');
      return;
    }

    let createdGuide: any = editContext?.guideId ? { id: editContext.guideId } : null;
    let createdRfidScan: any = null;

    try {
      // ========== PASO 1: CREAR/ACTUALIZAR GUÍA ==========
      if (editContext?.guideId) {
        const guideDiff = buildDiff(initialGuide, guideData);
        if (Object.keys(guideDiff).length > 0) {
          await updateGuideAsync({ id: editContext.guideId, data: guideDiff });
        }
      } else {
        createdGuide = await createGuideAsync(guideData);
      }

      if (!createdGuide?.id) {
        throw new Error('No se pudo obtener el identificador de la guía.');
      }

      // ========== PASO 2: CREAR/ACTUALIZAR ESCANEO RFID ==========
          // NOTA: user_id NO se envía, el backend lo obtiene del token JWT
          
          const rfidScanData = {
            guide_id: createdGuide.id,
            branch_offices_id: formData.branch_offices_id,
            scan_type: formData.scan_type as any,
            scanned_quantity: formData.scanned_quantity,
            scanned_rfid_codes: formData.scanned_rfid_codes,
            unexpected_codes: formData.unexpected_codes || [],
            differences_detected: formData.differences_detected || undefined,
          } as any;

      // Si deferRfidScanUpdate es true, NO actualizar el RFID scan aquí
      // Los datos se pasarán al callback para actualizarlos después junto con el proceso
      if (deferRfidScanUpdate && editContext?.rfidScanId) {
        // Pasar los datos actualizados al callback sin actualizar el RFID scan
        onSubmit({
          rfidScanUpdateData: {
            id: editContext.rfidScanId,
            data: rfidScanData,
          },
        });
        return;
      }

      // Comportamiento normal: actualizar el RFID scan inmediatamente
      try {
          if (editContext?.rfidScanId) {
            const rsDiff = buildDiff(initialRfidScanFull, rfidScanData);
            if (Object.keys(rsDiff).length > 0) {
              createdRfidScan = await updateRfidScanAsync({ id: editContext.rfidScanId, data: rsDiff });
            } else {
              createdRfidScan = initialRfidScanFull;
            }
          } else {
            createdRfidScan = await createRfidScanAsync(rfidScanData);
          }

          // ✅ TODO EXITOSO
          onSubmit({
            createdGuide,
            createdRfidScan,
            guideData,
          });

        } catch (scanError: any) {
          const errorMessage = scanError.response?.data?.message || scanError.message;
          Alert.alert(
            'Error - Contacte al Superadmin',
            `Guía creada: ${createdGuide?.guide_number || createdGuide.id}\n\n❌ Error al crear escaneo RFID:\n${errorMessage}\n\nContacte al superadmin para completar manualmente el escaneo.`
        );
      }

    } catch (guideError: any) {
      Alert.alert('Error', guideError.message || 'No se pudo crear la guía. Intente nuevamente.');
    }
  };

  const renderUnexpectedCodes = () => {
    const unexpected = formData.unexpected_codes || [];
    const normalizedUnregistered = (unregisteredCodes || []).map(code => code?.trim()).filter(Boolean);

    if (!hasBaseline) {
      if (normalizedUnregistered.length === 0) {
        return null;
      }
      return (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Códigos no registrados</Text>
          <View className="bg-white border border-gray-300 rounded-lg p-3">
            <TextInput
              className="text-gray-900 min-h-[80px] text-left"
              value={normalizedUnregistered.join(', ')}
              editable={false}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      );
    }

    if (hasBaseline && Array.isArray(unexpected) && unexpected.length > 0) {
      return (
        <>
          <View className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', borderColor: '#FBBF24', borderWidth: 1 }}>
            <Text className="text-sm font-semibold" style={{ color: '#92400E' }}>
              Atención: Códigos no coinciden con el escaneo inicial.
            </Text>
            <Text className="text-xs mt-1" style={{ color: '#92400E' }}>
              Se detectaron {unexpected.length} códigos inesperados.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Códigos inesperados</Text>
            <View className="bg-white border border-gray-300 rounded-lg p-3">
              <TextInput
                className="text-gray-900 min-h-[80px] text-left"
                value={unexpected.join(', ')}
                editable={false}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Guía */}
          {guideNumber ? (
            <View className="mb-4">
              <Input
                label="Guía"
                value={guideNumber}
                editable={false}
                className="bg-gray-50"
                icon="document-text-outline"
              />
            </View>
          ) : null}

          {/* Tipo de Escaneo */}
          <View className="mb-4">
            <Dropdown
              label="Tipo de Escaneo *"
              options={scanTypes}
              value={formData.scan_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, scan_type: value }))}
              placeholder="Seleccionar tipo de escaneo"
              icon="scan-outline"
              disabled
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

          {/* Alertas de diferencias */}
          {renderUnexpectedCodes()}

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
