import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Button, Dropdown, Card, Input } from '@/components/common';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/auth/store/auth.store';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';

type Option = { label: string; value: string };

interface ProcessFormProps {
  guideOptions: Option[];
  selectedGuideId?: string;
  onChangeGuide: (id: string) => void;
  onScanRFID?: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  scannedTags?: string[]; // Tags RFID escaneados
  processType?: string; // Tipo de proceso (IN_PROCESS, WASHING, etc.)
}

export const ProcessForm: React.FC<ProcessFormProps> = ({
  guideOptions,
  selectedGuideId,
  onChangeGuide,
  onScanRFID,
  onSubmit,
  submitting,
  scannedTags = [],
  processType = 'IN_PROCESS',
}) => {
  const { user } = useAuthStore();
  const branchOfficeId = user?.sucursalId;

  // Estado del formulario
  const [machineCode, setMachineCode] = useState<string>('M-001');
  const [selectedProcessType, setSelectedProcessType] = useState<string>('WASHING');
  const [loadWeight, setLoadWeight] = useState<string>('0');
  const [garmentQty, setGarmentQty] = useState<string>('0');
  const [specialTreatment, setSpecialTreatment] = useState<string>('NONE');
  const [washTemperature, setWashTemperature] = useState<string>('COLD');
  const [detergentType, setDetergentType] = useState<string>('Detergente líquido');
  const [softenerUsed, setSoftenerUsed] = useState<boolean>(false);
  const [bleachUsed, setBleachUsed] = useState<boolean>(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }, []);

  // Catálogos dinámicos
  const { data: processStatusCatalog, isLoading: isLoadingProcessStatus } = useCatalogValuesByType('process_status', true, { forceFresh: true });
  const { data: specialTreatmentCatalog, isLoading: isLoadingSpecialTreatment } = useCatalogValuesByType('special_treatment', true, { forceFresh: true });
  const { data: washTemperatureCatalog, isLoading: isLoadingWashTemperature } = useCatalogValuesByType('wash_temperature', true, { forceFresh: true });

  // Opciones desde catálogos
  // PROCESS_TYPES: filtrar solo los tipos de proceso relevantes (WASHING, DRYING, IRONING, DRY_CLEANING si existe)
  const PROCESS_TYPES = useMemo(() => {
    if (!processStatusCatalog?.data) return [];
    const processTypeCodes = ['WASHING', 'DRYING', 'IRONING', 'DRY_CLEANING'];
    return processStatusCatalog.data
      .filter(v => v.is_active && processTypeCodes.includes(v.code))
      .sort((a, b) => {
        const orderA = processTypeCodes.indexOf(a.code);
        const orderB = processTypeCodes.indexOf(b.code);
        return orderA - orderB;
      })
      .map(v => ({ label: v.label, value: v.code }));
  }, [processStatusCatalog]);

  const SPECIAL_TREATMENTS = useMemo(() => {
    if (!specialTreatmentCatalog?.data) return [];
    return specialTreatmentCatalog.data
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [specialTreatmentCatalog]);

  const WASH_TEMPERATURES = useMemo(() => {
    if (!washTemperatureCatalog?.data) return [];
    return washTemperatureCatalog.data
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [washTemperatureCatalog]);

  // Estados de carga combinados
  const isLoadingCatalogs = isLoadingProcessStatus || isLoadingSpecialTreatment || isLoadingWashTemperature;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Guía y escaneo */}
      <View className="mb-6">
        {/* Guía seleccionada (solo lectura) */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">Guía</Text>
          <Card padding="md" variant="outlined">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <IonIcon name="document-text-outline" size={20} color="#3B82F6" />
                <View className="ml-3">
                  <Text className="text-base font-semibold text-gray-900">
                    {guideOptions.find(g => g.value === selectedGuideId)?.label || 'Guía seleccionada'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    ID: {selectedGuideId || 'No seleccionada'}
                  </Text>
                </View>
              </View>
              <View className="bg-green-100 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-green-800">Confirmada</Text>
              </View>
            </View>
          </Card>
        </View>
        
        {/* Información de prendas escaneadas */}
        {scannedTags.length > 0 && (
          <View className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <View className="flex-row items-center mb-2">
              <IonIcon name="checkmark-circle" size={20} color="#10B981" />
              <Text className="text-sm font-medium text-green-800 ml-2">
                Prendas Escaneadas ({scannedTags.length})
              </Text>
            </View>
            <Text className="text-xs text-green-700 mb-2">
              {processType === 'IN_PROCESS' 
                ? 'Validando prendas contra la guía...' 
                : 'Prendas listas para procesar'
              }
            </Text>
            <View className="flex-row flex-wrap">
              {scannedTags.slice(0, 5).map((tag, index) => (
                <View key={index} className="bg-green-100 px-2 py-1 rounded mr-2 mb-1">
                  <Text className="text-xs text-green-800 font-mono">
                    {tag.substring(0, 8)}...
                  </Text>
                </View>
              ))}
              {scannedTags.length > 5 && (
                <View className="bg-green-100 px-2 py-1 rounded">
                  <Text className="text-xs text-green-800">
                    +{scannedTags.length - 5} más
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {onScanRFID && (
          <View className="mt-3">
            <Button
              title={scannedTags.length > 0 ? "Escanear Más Prendas" : "Escanear Prendas"}
              onPress={onScanRFID}
              size="sm"
              icon={<IonIcon name="scan-outline" size={18} color="white" />}
              fullWidth
              style={{ backgroundColor: '#1f4eed' }}
            />
          </View>
        )}
      </View>

      {/* Información básica */}
      <View className="mb-6">
        <Input
          label="Código de Máquina *"
          placeholder="M-001"
          value={machineCode}
          onChangeText={setMachineCode}
          icon="hardware-chip-outline"
        />

        <Dropdown
          label="Tipo de Proceso *"
          placeholder={isLoadingProcessStatus ? "Cargando..." : "Selecciona el tipo"}
          options={PROCESS_TYPES}
          value={selectedProcessType}
          onValueChange={setSelectedProcessType}
          icon="construct-outline"
          disabled={isLoadingProcessStatus || PROCESS_TYPES.length === 0}
        />

        {/* Sucursal (solo lectura desde el usuario) */}
        <View className="mt-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">Sucursal</Text>
          <Card padding="md" variant="outlined">
            <View className="flex-row items-center">
              <IonIcon name="business-outline" size={20} color="#6B7280" />
              <Text className="text-base text-gray-900 ml-2">{branchOfficeId || 'No asignada'}</Text>
            </View>
          </Card>
        </View>
      </View>

      {/* Información del proceso */}
      <View className="mb-6">
        <View className="flex-row">
          <View className="flex-1 mr-2">
            <Input
              label="Cantidad de Prendas"
              value={garmentQty}
              onChangeText={setGarmentQty}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1 ml-2">
            <Input
              label="Peso de Carga (kg)"
              value={loadWeight}
              onChangeText={setLoadWeight}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Dropdown
          label="Tratamiento Especial"
          placeholder={isLoadingSpecialTreatment ? "Cargando..." : "Selecciona un tratamiento"}
          options={SPECIAL_TREATMENTS}
          value={specialTreatment}
          onValueChange={setSpecialTreatment}
          icon="flask-outline"
          disabled={isLoadingSpecialTreatment || SPECIAL_TREATMENTS.length === 0}
        />

        <Dropdown
          label="Temperatura de Lavado"
          placeholder={isLoadingWashTemperature ? "Cargando..." : "Selecciona la temperatura"}
          options={WASH_TEMPERATURES}
          value={washTemperature}
          onValueChange={setWashTemperature}
          icon="thermometer-outline"
          disabled={isLoadingWashTemperature || WASH_TEMPERATURES.length === 0}
        />

        <Dropdown
          label="Tipo de Detergente"
          placeholder="Selecciona el detergente"
          options={[
            { label: 'Detergente líquido', value: 'Detergente líquido' },
            { label: 'Detergente en polvo', value: 'Detergente en polvo' },
            { label: 'Detergente ecológico', value: 'Detergente ecológico' },
          ]}
          value={detergentType}
          onValueChange={setDetergentType}
          icon="beaker-outline"
        />
      </View>

      {/* Fechas */}
      <View className="mb-6">
        <View className="flex-row">
          <View className="flex-1 mr-2">
            <Input label="Hora de Inicio *" value={todayStr} editable={false} />
          </View>
          <View className="flex-1 ml-2">
            <Input label="Hora de Fin" placeholder="dd/mm/aaaa" value={''} editable={false} />
          </View>
        </View>
      </View>

      {/* Insumos usados */}
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            className="w-6 h-6 rounded border border-gray-400 items-center justify-center mr-3"
            onPress={() => setSoftenerUsed(!softenerUsed)}
            activeOpacity={0.7}
          >
            {softenerUsed && <IonIcon name="checkmark" size={16} color="#1f4eed" />}
          </TouchableOpacity>
          <Text className="text-gray-800">Suavizante Usado</Text>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            className="w-6 h-6 rounded border border-gray-400 items-center justify-center mr-3"
            onPress={() => setBleachUsed(!bleachUsed)}
            activeOpacity={0.7}
          >
            {bleachUsed && <IonIcon name="checkmark" size={16} color="#1f4eed" />}
          </TouchableOpacity>
          <Text className="text-gray-800">Blanqueador Usado</Text>
        </View>
      </View>

      <Button title="Guardar Proceso" onPress={onSubmit} isLoading={!!submitting} fullWidth />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


