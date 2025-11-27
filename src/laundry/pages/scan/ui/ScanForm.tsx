import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { useGarmentsByRfidCodes } from '@/laundry/hooks/guides/garments/useGarmentsByRfidCodes';

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
  serviceType?: 'industrial' | 'personal';
  disableScanType?: boolean;
};

export const ScanForm: React.FC<ScanFormProps> = ({
  onSubmit,
  onCancel,
  submitting = false,
  guideData,
  scannedTags = [],
  onNavigate,
  initialRfidScan,
  editContext,
  initialGuide,
  initialRfidScanFull,
  deferRfidScanUpdate = false,
  unregisteredCodes = [],
  serviceType = 'industrial',
  disableScanType = false,
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
  const initialGuideNumber = initialGuide?.guide_number || guideData?.guide_number || '';
  const [guideNumber, setGuideNumber] = useState(initialGuideNumber);

  useEffect(() => {
    setGuideNumber(initialGuideNumber);
  }, [initialGuideNumber]);

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
  
  const combinedScannedCodes = useMemo(() => {
    if (!hasBaseline) {
      return scannedTags;
    }
    const combined = [...initialCodes];
    scannedTags.forEach(code => {
      if (!combined.includes(code)) {
        combined.push(code);
      }
    });
    return combined;
  }, [initialCodes, scannedTags, hasBaseline]);

  // Obtener las prendas registradas por códigos RFID para calcular cantidades
  const { data: garmentsData, isLoading: isLoadingGarments } = useGarmentsByRfidCodes(
    combinedScannedCodes,
    combinedScannedCodes.length > 0
  );

  // Crear un mapa de RFID -> Prenda para búsqueda rápida
  const garmentsByRfid = useMemo(() => {
    const map = new Map();
    if (garmentsData?.data && Array.isArray(garmentsData.data)) {
      garmentsData.data.forEach((garment: any) => {
        if (garment.rfid_code) {
          const normalizedRfid = garment.rfid_code.trim().toUpperCase();
          map.set(normalizedRfid, garment);
        }
      });
    }
    return map;
  }, [garmentsData]);

  // Función helper para obtener una prenda por RFID
  const getGarmentByRfid = useCallback((rfidCode: string) => {
    if (!rfidCode) return null;
    const normalizedRfid = rfidCode.trim().toUpperCase();
    return garmentsByRfid.get(normalizedRfid);
  }, [garmentsByRfid]);

  // Calcular la cantidad escaneada sumando las cantidades (quantity) de las prendas registradas
  // Si una prenda no tiene cantidad definida, se cuenta como 1
  const scannedQuantity = useMemo(() => {
    if (combinedScannedCodes.length === 0) return 0;
    
    // Si hay una guía inicial, usar el total_garments de la guía si está disponible
    if (initialGuide?.total_garments && initialGuide.total_garments > 0) {
      return initialGuide.total_garments;
    }

    // Sumar las cantidades de las prendas registradas
    const totalFromQuantities = combinedScannedCodes.reduce((total, rfidCode) => {
      const garment = getGarmentByRfid(rfidCode);
      if (garment) {
        const quantity = garment.quantity;
        return total + (quantity && quantity > 0 ? quantity : 1);
      }
      // Prenda no registrada: contar como 1
      return total + 1;
    }, 0);

    return totalFromQuantities;
  }, [combinedScannedCodes, getGarmentByRfid, initialGuide]);

  const [formData, setFormData] = useState({
    branch_offices_id: branchOfficeId,
    branch_office_name: branchOfficeName,
    scan_type: initialRfidScan?.scan_type || 'COLLECTED',
    scanned_quantity: scannedQuantity,
    scanned_rfid_codes: combinedScannedCodes,
    differences_detected: initialRfidScan?.differences_detected || '',
    unexpected_codes: hasBaseline ? computedUnexpected : unregisteredCodes,
  });

  // Mantener sincronizados cantidad y códigos inesperados si cambia el escaneo en tiempo real
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      scanned_quantity: scannedQuantity,
      scanned_rfid_codes: combinedScannedCodes,
      unexpected_codes: computedUnexpected,
    }));
  }, [combinedScannedCodes, computedUnexpected, hasBaseline, unregisteredCodes, scannedQuantity]);

  // Catálogo dinámico de tipos de escaneo (scan_type) con datos frescos
  const { data: scanTypeCatalog } = useCatalogValuesByType('scan_type', true, { forceFresh: true });

  const scanTypes = useMemo(() => {
    return (scanTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a,b) => (a.display_order||0) - (b.display_order||0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [scanTypeCatalog]);

  const hasScanTypeOptions = scanTypes.length > 0;

  // Catálogo de tipos de prenda para mostrar etiquetas en español (modo industrial)
  const { data: garmentTypeCatalog } = useCatalogValuesByType('garment_type', true, { forceFresh: true });

  const garmentTypeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    if (garmentTypeCatalog?.data) {
      garmentTypeCatalog.data
        .filter((item) => item.is_active !== false)
        .forEach((item) => {
          const originalCode = item.code ?? '';
          const normalizedCode = originalCode.trim().toUpperCase().replace(/[\s-]/g, '_');
          if (normalizedCode) {
            map.set(normalizedCode, item.label);
          }
          if (originalCode) {
            map.set(originalCode, item.label);
          }
        });
    }
    return map;
  }, [garmentTypeCatalog]);

  // Agrupar prendas por tipo (modo industrial) o lista individual (modo personal)
  type IndustrialSummaryItem = { garmentType: string; garmentTypeLabel: string; quantity: number; rfidCodes: string[] };
  type PersonalSummaryItem = { rfidCode: string; description: string; quantity: number; isRegistered: boolean };

  const industrialSummary = useMemo<IndustrialSummaryItem[]>(() => {
    if (combinedScannedCodes.length === 0 || isLoadingGarments || serviceType !== 'industrial') {
      return [];
    }

    // Modo industrial: agrupar por tipo de prenda y sumar cantidades
    const grouped = new Map<string, IndustrialSummaryItem>();
    
    combinedScannedCodes.forEach(rfidCode => {
      const garment = getGarmentByRfid(rfidCode);
      
      if (garment) {
        const garmentType = garment.garment_type || 'REGISTERED';
        const normalizedCode = garmentType.trim().toUpperCase().replace(/[\s-]/g, '_');
        const garmentTypeLabel = garmentTypeLabelMap.get(normalizedCode) || garmentTypeLabelMap.get(garmentType) || garmentType;
        const quantity = garment.quantity && garment.quantity > 0 ? garment.quantity : 1;
        
        if (!grouped.has(garmentType)) {
          grouped.set(garmentType, {
            garmentType,
            garmentTypeLabel,
            quantity: 0,
            rfidCodes: []
          });
        }
        
        const group = grouped.get(garmentType)!;
        group.quantity += quantity;
        group.rfidCodes.push(rfidCode);
      } else {
        // Prenda no registrada
        const unregisteredKey = 'UNREGISTERED';
        if (!grouped.has(unregisteredKey)) {
          grouped.set(unregisteredKey, {
            garmentType: 'UNREGISTERED',
            garmentTypeLabel: 'Prendas no registradas',
            quantity: 0,
            rfidCodes: []
          });
        }
        
        const group = grouped.get(unregisteredKey)!;
        group.quantity += 1; // Prendas no registradas se cuentan como 1
        group.rfidCodes.push(rfidCode);
      }
    });

    return Array.from(grouped.values());
  }, [combinedScannedCodes, getGarmentByRfid, serviceType, isLoadingGarments, garmentTypeLabelMap]);

  const personalSummary = useMemo<PersonalSummaryItem[]>(() => {
    if (combinedScannedCodes.length === 0 || isLoadingGarments || serviceType !== 'personal') {
      return [];
    }

    // Modo personal: lista individual con prenda y cantidad
    return combinedScannedCodes.map(rfidCode => {
      const garment = getGarmentByRfid(rfidCode);
      if (garment) {
        return {
          rfidCode,
          description: garment.description || 'Sin descripción',
          quantity: garment.quantity && garment.quantity > 0 ? garment.quantity : 1,
          isRegistered: true,
        };
      }
      return {
        rfidCode,
        description: 'Prenda no registrada',
        quantity: 1,
        isRegistered: false,
      };
    });
  }, [combinedScannedCodes, getGarmentByRfid, serviceType, isLoadingGarments]);

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

    // Si deferRfidScanUpdate es true (procesos), NO crear/actualizar la guía
    // Solo pasar los datos del RFID scan para actualizarlos después junto con el proceso
    if (deferRfidScanUpdate && editContext?.rfidScanId && editContext?.guideId) {
      // Preparar los datos del RFID scan sin incluir el campo 'id' (solo se pasa en rfidScanUpdateData.id)
      const rfidScanData = {
        guide_id: editContext.guideId,
        branch_offices_id: formData.branch_offices_id,
        scan_type: formData.scan_type as any,
        scanned_quantity: formData.scanned_quantity,
        scanned_rfid_codes: formData.scanned_rfid_codes,
        unexpected_codes: formData.unexpected_codes || [],
        differences_detected: formData.differences_detected || undefined,
      } as any;

      // Pasar los datos actualizados al callback sin actualizar el RFID scan aquí
      onSubmit({
        rfidScanUpdateData: {
          id: editContext.rfidScanId,
          data: rfidScanData,
        },
      });
      return;
    }

    // Comportamiento normal: crear/actualizar guía y RFID scan
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
        if (createdGuide?.guide_number) {
          setGuideNumber(createdGuide.guide_number);
        }
      }

      if (!createdGuide?.id && !editContext?.guideId) {
        throw new Error('No se pudo obtener el identificador de la guía.');
      }

      const guideId = createdGuide?.id || editContext?.guideId;
      if (!guideId) {
        throw new Error('No se pudo obtener el identificador de la guía.');
      }

      // ========== PASO 2: CREAR/ACTUALIZAR ESCANEO RFID ==========
      // NOTA: user_id NO se envía, el backend lo obtiene del token JWT
      
      const rfidScanData = {
        guide_id: guideId,
        branch_offices_id: formData.branch_offices_id,
        scan_type: formData.scan_type as any,
        scanned_quantity: formData.scanned_quantity,
        scanned_rfid_codes: formData.scanned_rfid_codes,
        unexpected_codes: formData.unexpected_codes || [],
        differences_detected: formData.differences_detected || undefined,
      } as any;

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
      // Extraer el mensaje de error del backend si está disponible
      const errorMessage = guideError?.response?.data?.message 
        || guideError?.message 
        || 'No se pudo crear la guía. Intente nuevamente.';
      
      console.error('Error al crear guía:', guideError);
      Alert.alert('Error', errorMessage);
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
            {!hasScanTypeOptions && (
              <View className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <Text className="text-sm text-orange-800">
                  No hay tipos de escaneo registrados. Solicita al administrador que configure el catálogo correspondiente.
                </Text>
              </View>
            )}
            <Dropdown
              label="Tipo de Escaneo *"
              options={scanTypes}
              value={hasScanTypeOptions ? formData.scan_type : ''}
            onValueChange={(value) => {
              if (disableScanType) return;
              setFormData(prev => ({ ...prev, scan_type: value }));
            }}
              placeholder={hasScanTypeOptions ? "Seleccionar tipo de escaneo" : "Catálogo vacío"}
              icon="scan-outline"
            disabled={!hasScanTypeOptions || disableScanType}
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

          {/* Información de Prendas Escaneadas */}
          {(serviceType === 'industrial' ? industrialSummary.length > 0 : personalSummary.length > 0) && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                {serviceType === 'industrial' ? 'Prendas Escaneadas por Tipo' : 'Prendas Escaneadas'}
              </Text>
              <View className="bg-white border border-gray-300 rounded-lg p-3">
                {serviceType === 'industrial' ? (
                  // Modo industrial: mostrar tipo y cantidad agrupada
                  industrialSummary.map((item, index) => (
                    <View key={item.garmentType} className={`${index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-900">
                            {item.garmentTypeLabel}
                          </Text>
                          {item.garmentType === 'UNREGISTERED' && (
                            <Text className="text-xs text-orange-600 mt-1">
                              {item.rfidCodes.length} {item.rfidCodes.length === 1 ? 'código no registrado' : 'códigos no registrados'}
                            </Text>
                          )}
                        </View>
                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                          <Text className="text-base font-bold text-blue-900">
                            {item.quantity}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  // Modo personal: mostrar prenda y cantidad individual
                  personalSummary.map((item, index) => (
                    <View key={item.rfidCode} className={`${index > 0 ? 'mt-3 pt-3 border-t border-gray-200' : ''}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={`text-base font-semibold ${item.isRegistered ? 'text-gray-900' : 'text-orange-600'}`}>
                            {item.description}
                          </Text>
                          <Text className="text-xs text-gray-500 mt-1 font-mono">
                            RFID: {item.rfidCode}
                          </Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${item.isRegistered ? 'bg-green-100' : 'bg-orange-100'}`}>
                          <Text className={`text-base font-bold ${item.isRegistered ? 'text-green-900' : 'text-orange-900'}`}>
                            {item.quantity}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

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
