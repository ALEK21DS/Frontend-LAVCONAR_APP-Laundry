import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import { Button, Input, Dropdown } from '@/components/common';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/auth/store/auth.store';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { useMachines, Machine } from '@/laundry/hooks/machines';
import { useCreateWashingProcess, useUpdateWashingProcess, useWashingProcessByGuide } from '@/laundry/hooks/washing-processes';
import { useUpdateRfidScan } from '@/laundry/hooks/guides/rfid-scan';
import { safeParseFloat, safeParseInt } from '@/helpers/validators.helper';
import { MachineSelectionModal } from '@/laundry/components';

interface WashingProcessFormProps {
  visible: boolean;
  guideId: string;
  guideNumber: string;
  branchOfficeId: string;
  branchOfficeName: string;
  processType: string;
  rfidScanId?: string;
  rfidScan?: any;
  pendingScanTypeUpdate?: string;
  rfidScanUpdateData?: any; // Datos del RFID scan actualizado desde ScanForm
  onSuccess: () => void;
  onCancel: () => void;
  initialProcess?: any;
}

export const WashingProcessForm: React.FC<WashingProcessFormProps> = ({
  visible,
  guideId,
  guideNumber,
  branchOfficeId,
  branchOfficeName,
  processType,
  rfidScanId,
  rfidScan,
  pendingScanTypeUpdate,
  rfidScanUpdateData,
  onSuccess,
  onCancel,
  initialProcess,
}) => {
  const { user } = useAuthStore();
  const { createWashingProcessAsync, isCreating } = useCreateWashingProcess();
  const { updateWashingProcessAsync, isUpdating } = useUpdateWashingProcess();
  const { updateRfidScanAsync } = useUpdateRfidScan();

  // Buscar proceso existente por tipo
  const { data: existingProcess } = useWashingProcessByGuide(guideId, processType, true);

  // Catálogos
  const { data: specialTreatmentCatalog } = useCatalogValuesByType('special_treatment', true, { forceFresh: true });
  const { data: washTemperatureCatalog } = useCatalogValuesByType('wash_temperature', true, { forceFresh: true });

  // Determinar tipo de máquina según el proceso
  const machineType = processType === 'WASHING' ? 'WASHER' : processType === 'DRYING' ? 'DRYER' : undefined;
  
  // Máquinas (solo para procesos que requieren máquina)
  const { data: machines, isLoading: isLoadingMachines } = useMachines(
    branchOfficeId, 
    machineType
  );

  // Estado del formulario
  const [formData, setFormData] = useState({
    machine_code: initialProcess?.machine_code || '',
    start_time: initialProcess?.start_time 
      ? new Date(initialProcess.start_time).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    end_time: initialProcess?.end_time 
      ? new Date(initialProcess.end_time).toISOString().slice(0, 16)
      : '',
    load_weight: initialProcess?.load_weight?.toString() || '',
    garment_quantity: initialProcess?.garment_quantity?.toString() || '',
    special_treatment: initialProcess?.special_treatment || '',
    wash_temperature: initialProcess?.wash_temperature || '',
    detergent_type: initialProcess?.detergent_type || '',
    softener_used: initialProcess?.softener_used || false,
    bleach_used: initialProcess?.bleach_used || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Opciones de catálogos
  const specialTreatmentOptions = useMemo(() => {
    const catalogOptions = (specialTreatmentCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));

    return catalogOptions.length > 0 ? catalogOptions : [
      { label: 'Ninguno', value: 'NONE' },
      { label: 'Remoción de manchas', value: 'STAIN_REMOVAL' },
      { label: 'Delicado', value: 'DELICATE' },
      { label: 'Uso pesado', value: 'HEAVY_DUTY' },
      { label: 'Desinfección', value: 'DISINFECTION' },
    ];
  }, [specialTreatmentCatalog]);

  const washTemperatureOptions = useMemo(() => {
    const catalogOptions = (washTemperatureCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));

    return catalogOptions.length > 0 ? catalogOptions : [
      { label: 'Frío (20°C)', value: 'COLD' },
      { label: 'Tibio (40°C)', value: 'WARM' },
      { label: 'Caliente (60°C)', value: 'HOT' },
      { label: 'Muy Caliente (90°C)', value: 'VERY_HOT' },
    ];
  }, [washTemperatureCatalog]);

  // Obtener máquina seleccionada por código
  const selectedMachineByCode = useMemo(() => {
    if (!formData.machine_code || !machines || !Array.isArray(machines)) return null;
    return machines.find((m: Machine) => m.code === formData.machine_code) || null;
  }, [formData.machine_code, machines]);

  // Filtrar máquinas activas (is_active y status_machine === 'ACTIVE')
  const availableMachines = useMemo(() => {
    if (!machines || !Array.isArray(machines)) return [];
    return machines.filter((m: Machine) => m.is_active && m.status_machine === 'ACTIVE');
  }, [machines]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.start_time) {
      newErrors.start_time = 'La fecha de inicio es requerida';
    }

    if (formData.load_weight) {
      const weight = safeParseFloat(formData.load_weight);
      if (weight !== undefined && weight < 0) {
        newErrors.load_weight = 'El peso debe ser mayor o igual a 0';
      }
    }

    if (formData.garment_quantity) {
      const quantity = safeParseInt(formData.garment_quantity);
      if (quantity !== undefined && quantity < 0) {
        newErrors.garment_quantity = 'La cantidad debe ser mayor o igual a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const processData = {
        guide_id: guideId,
        branch_offices_id: branchOfficeId,
        machine_code: formData.machine_code || undefined,
        process_type: processType,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
        load_weight: formData.load_weight ? safeParseFloat(formData.load_weight) : undefined,
        garment_quantity: formData.garment_quantity ? safeParseInt(formData.garment_quantity) : undefined,
        special_treatment: formData.special_treatment || undefined,
        wash_temperature: formData.wash_temperature || undefined,
        detergent_type: formData.detergent_type || undefined,
        softener_used: formData.softener_used,
        bleach_used: formData.bleach_used,
        status: processType,
      };

      // Si existe un proceso, actualizar; si no, crear
      if (existingProcess?.id) {
        await updateWashingProcessAsync({ id: existingProcess.id, data: processData });
      } else {
        await createWashingProcessAsync(processData);
      }

      // Actualizar el RFID scan si hay datos pendientes
      // Esto se hace DESPUÉS de guardar el proceso para que solo se actualice si todo fue exitoso
      const rfidScanIdToUpdate = rfidScanUpdateData?.id || rfidScanId;
      if (rfidScanIdToUpdate) {
        try {
          let rfidScanDataToUpdate: any = null;
          
          // Si hay rfidScanUpdateData (viene del ScanForm), usar esos datos
          if (rfidScanUpdateData?.data) {
            rfidScanDataToUpdate = rfidScanUpdateData.data;
          }
          // Si hay pendingScanTypeUpdate (viene de "No escanear"), usar esos datos
          else if (pendingScanTypeUpdate && rfidScan) {
            rfidScanDataToUpdate = {
              guide_id: rfidScan.guide_id,
              branch_offices_id: rfidScan.branch_offices_id,
              scan_type: pendingScanTypeUpdate,
              scanned_quantity: rfidScan.scanned_quantity,
              scanned_rfid_codes: rfidScan.scanned_rfid_codes,
              unexpected_codes: rfidScan.unexpected_codes || [],
              differences_detected: rfidScan.differences_detected,
            };
          }
          
          if (rfidScanDataToUpdate) {
            await updateRfidScanAsync({
              id: rfidScanIdToUpdate,
              data: rfidScanDataToUpdate,
            });
          }
        } catch (rfidError: any) {
          // Si falla la actualización del RFID scan, mostrar error pero no revertir el proceso
          Alert.alert('Advertencia', 'El proceso se guardó correctamente, pero no se pudo actualizar el estado del escaneo RFID: ' + (rfidError.message || 'Error desconocido'));
        }
      }

      Alert.alert('Éxito', 'Proceso guardado correctamente');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el proceso');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/40">
          <View className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl" style={{ elevation: 8 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  {processType === 'WASHING' ? 'Proceso de Lavado' :
                   processType === 'DRYING' ? 'Proceso de Secado' :
                   processType === 'IRONING' ? 'Proceso de Planchado' :
                   processType === 'FOLDING' ? 'Proceso de Doblado' :
                   processType === 'IN_PROCESS' ? 'Recepción en Almacén' :
                   processType === 'PACKAGING' ? 'Proceso de Empaque' :
                   processType === 'SHIPPING' ? 'Proceso de Embarque' :
                   processType === 'LOADING' ? 'Proceso de Carga' :
                   processType === 'DELIVERY' ? 'Proceso de Entrega' :
                   'Proceso'}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">Complete los datos del proceso</Text>
              </View>
              <TouchableOpacity
                onPress={onCancel}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Icon name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="p-4">
          {/* Guía */}
          <View className="mb-4">
            <Input
              label="Guía"
              value={guideNumber}
              editable={false}
              className="bg-gray-50"
              icon="document-text-outline"
            />
          </View>

          {/* Sucursal */}
          <View className="mb-4">
            <Input
              label="Sucursal"
              value={branchOfficeName}
              editable={false}
              className="bg-gray-50"
              icon="business-outline"
            />
          </View>

          {/* Fecha y hora de inicio */}
          <View className="mb-4">
            <Input
              label="Fecha y hora de inicio *"
              value={formData.start_time}
              onChangeText={(text) => setFormData(prev => ({ ...prev, start_time: text }))}
              placeholder="YYYY-MM-DDTHH:mm"
              icon="calendar-outline"
              error={errors.start_time}
            />
          </View>

          {/* Fecha y hora de fin */}
          <View className="mb-4">
            <Input
              label="Fecha y hora de fin"
              value={formData.end_time}
              onChangeText={(text) => setFormData(prev => ({ ...prev, end_time: text }))}
              placeholder="YYYY-MM-DDTHH:mm"
              icon="calendar-outline"
            />
          </View>

          {/* Máquina (solo para Lavado y Secado) */}
          {(processType === 'WASHING' || processType === 'DRYING') && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Máquina</Text>
              <TouchableOpacity
                onPress={() => setMachineModalOpen(true)}
                className="bg-purple-500 p-4 rounded-lg flex-row items-center justify-between"
                disabled={isLoadingMachines}
              >
                {selectedMachineByCode ? (
                  <>
                    <View className="flex-row items-center flex-1">
                      <Icon name="construct-outline" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2 text-base">
                        {selectedMachineByCode.code}
                      </Text>
                    </View>
                    <Icon name="create-outline" size={20} color="white" />
                  </>
                ) : (
                  <>
                    <View className="flex-row items-center flex-1">
                      <Icon name="construct-outline" size={20} color="white" />
                      <Text className="text-white font-medium ml-2">
                        Seleccionar Máquina
                      </Text>
                    </View>
                    <Icon name="qr-code-outline" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Peso de la carga */}
          <View className="mb-4">
            <Input
              label="Peso de la carga (kg)"
              value={formData.load_weight}
              onChangeText={(text) => setFormData(prev => ({ ...prev, load_weight: text }))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              icon="scale-outline"
              error={errors.load_weight}
            />
          </View>

          {/* Cantidad de prendas */}
          <View className="mb-4">
            <Input
              label="Cantidad de prendas"
              value={formData.garment_quantity}
              onChangeText={(text) => setFormData(prev => ({ ...prev, garment_quantity: text }))}
              placeholder="0"
              keyboardType="number-pad"
              icon="shirt-outline"
              error={errors.garment_quantity}
            />
          </View>

          {/* Campos específicos solo para Lavado */}
          {processType === 'WASHING' && (
            <>
              {/* Tratamiento especial */}
              <View className="mb-4">
                <Dropdown
                  label="Tratamiento especial"
                  options={specialTreatmentOptions}
                  value={formData.special_treatment}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, special_treatment: value }))}
                  placeholder="Seleccionar tratamiento"
                  icon="medical-outline"
                />
              </View>

              {/* Temperatura de lavado */}
              <View className="mb-4">
                <Dropdown
                  label="Temperatura de lavado"
                  options={washTemperatureOptions}
                  value={formData.wash_temperature}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, wash_temperature: value }))}
                  placeholder="Seleccionar temperatura"
                  icon="thermometer-outline"
                />
              </View>

              {/* Tipo de detergente */}
              <View className="mb-4">
                <Input
                  label="Tipo de detergente"
                  value={formData.detergent_type}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, detergent_type: text }))}
                  placeholder="Ej: Detergente industrial concentrado"
                  icon="flask-outline"
                />
              </View>

              {/* Suavizante usado */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between p-4 bg-white border border-gray-300 rounded-lg">
                  <Text className="text-sm font-medium text-gray-700">Suavizante usado</Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600 mr-2">{formData.softener_used ? 'Sí' : 'No'}</Text>
                    <Button
                      title={formData.softener_used ? 'Desactivar' : 'Activar'}
                      variant={formData.softener_used ? 'outline' : 'primary'}
                      onPress={() => setFormData(prev => ({ ...prev, softener_used: !prev.softener_used }))}
                      className="px-4 py-2"
                    />
                  </View>
                </View>
              </View>

              {/* Blanqueador usado */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between p-4 bg-white border border-gray-300 rounded-lg">
                  <Text className="text-sm font-medium text-gray-700">Blanqueador usado</Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600 mr-2">{formData.bleach_used ? 'Sí' : 'No'}</Text>
                    <Button
                      title={formData.bleach_used ? 'Desactivar' : 'Activar'}
                      variant={formData.bleach_used ? 'outline' : 'primary'}
                      onPress={() => setFormData(prev => ({ ...prev, bleach_used: !prev.bleach_used }))}
                      className="px-4 py-2"
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Botones */}
          <View className="flex-row space-x-2 mb-4">
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onCancel}
              className="flex-1"
            />
            <Button
              title="Guardar"
              variant="primary"
              onPress={handleSubmit}
              isLoading={isCreating || isUpdating}
              className="flex-1"
            />
              </View>
              {/* Cierre del contenedor principal de contenido */}
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Selección de Máquinas */}
      <MachineSelectionModal
        visible={machineModalOpen}
        onClose={() => setMachineModalOpen(false)}
        onSelectMachine={(machine) => {
          setSelectedMachine(machine);
          setFormData(prev => ({ ...prev, machine_code: machine.code }));
          setMachineModalOpen(false);
        }}
        machines={availableMachines}
      />
    </Modal>
  );
};

