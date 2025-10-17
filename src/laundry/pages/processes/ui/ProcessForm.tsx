import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Dropdown, Card, Input } from '@/components/common';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/auth/store/auth.store';

type Option = { label: string; value: string };

interface ProcessFormProps {
  guideOptions: Option[];
  selectedGuideId?: string;
  onChangeGuide: (id: string) => void;
  onScanRFID?: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export const ProcessForm: React.FC<ProcessFormProps> = ({
  guideOptions,
  selectedGuideId,
  onChangeGuide,
  onScanRFID,
  onSubmit,
  submitting,
}) => {
  const { user } = useAuthStore();
  const branchOfficeId = user?.sucursalId;

  // Estado del formulario
  const [machineCode, setMachineCode] = useState<string>('M-001');
  const [processType, setProcessType] = useState<string>('WASH');
  const [loadWeight, setLoadWeight] = useState<string>('0');
  const [garmentQty, setGarmentQty] = useState<string>('0');
  const [specialTreatment, setSpecialTreatment] = useState<string>('NORMAL');
  const [washTemperature, setWashTemperature] = useState<string>('COLD');
  const [detergentType, setDetergentType] = useState<string>('Detergente líquido');
  const [status, setStatus] = useState<string>('PENDING');
  const [softenerUsed, setSoftenerUsed] = useState<boolean>(false);
  const [bleachUsed, setBleachUsed] = useState<boolean>(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }, []);

  // Opciones
  const PROCESS_TYPES: Option[] = [
    { label: 'Lavado', value: 'WASH' },
    { label: 'Enjuague', value: 'RINSE' },
    { label: 'Secado', value: 'DRY' },
  ];

  const SPECIAL_TREATMENTS: Option[] = [
    { label: 'Remoción de manchas', value: 'STAIN_REMOVAL' },
    { label: 'Delicado', value: 'DELICATE' },
    { label: 'Uso pesado', value: 'HEAVY_DUTY' },
    { label: 'Normal', value: 'NORMAL' },
  ];

  const WASH_TEMPERATURES: Option[] = [
    { label: 'Frío', value: 'COLD' },
    { label: 'Tibio', value: 'WARM' },
    { label: 'Caliente', value: 'HOT' },
  ];

  const STATUS_OPTIONS: Option[] = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'En progreso', value: 'IN_PROGRESS' },
    { label: 'Completado', value: 'COMPLETED' },
    { label: 'Cancelado', value: 'CANCELLED' },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Guía y escaneo */}
      <View className="mb-6">
        <Dropdown
          label="Guía *"
          placeholder="Selecciona una guía"
          options={guideOptions}
          value={selectedGuideId || ''}
          onValueChange={onChangeGuide}
          icon="document-text-outline"
          searchable
        />
        {onScanRFID && (
          <View className="mt-3">
            <Button
              title="Escanear Prenda"
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
          placeholder="Selecciona el tipo"
          options={PROCESS_TYPES}
          value={processType}
          onValueChange={setProcessType}
          icon="construct-outline"
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
          placeholder="Selecciona un tratamiento"
          options={SPECIAL_TREATMENTS}
          value={specialTreatment}
          onValueChange={setSpecialTreatment}
          icon="flask-outline"
        />

        <Dropdown
          label="Temperatura de Lavado"
          placeholder="Selecciona la temperatura"
          options={WASH_TEMPERATURES}
          value={washTemperature}
          onValueChange={setWashTemperature}
          icon="thermometer-outline"
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

      {/* Fechas y estado */}
      <View className="mb-6">
        <View className="flex-row">
          <View className="flex-1 mr-2">
            <Input label="Hora de Inicio *" value={todayStr} editable={false} />
          </View>
          <View className="flex-1 ml-2">
            <Input label="Hora de Fin" placeholder="dd/mm/aaaa" value={''} editable={false} />
          </View>
        </View>

        <Dropdown
          label="Estado"
          placeholder="Selecciona el estado"
          options={STATUS_OPTIONS}
          value={status}
          onValueChange={setStatus}
          icon="radio-button-on-outline"
        />
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


