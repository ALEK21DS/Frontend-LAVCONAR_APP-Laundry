import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, Input, Card, AutocompleteInput, Dropdown } from '@/components/common';
import IonIcon from 'react-native-vector-icons/Ionicons';

// Listas de sugerencias
const COLOR_SUGGESTIONS = [
  'Azul', 'Amarillo', 'Amarillo limón', 'Anaranjado', 'Amarillo verdoso',
  'Blanco', 'Beige', 'Bermellón', 'Bordó',
  'Celeste', 'Coral', 'Coral claro', 'Carmesí', 'Cereza', 'Cian', 'Caoba',
  'Dorado',
  'Fucsia',
  'Gris', 'Gris claro', 'Gris oscuro', 'Granate', 'Granate oscuro',
  'Índigo',
  'Lavanda', 'Lila',
  'Magenta', 'Marrón', 'Marrón claro', 'Marrón oscuro', 'Morado',
  'Negro', 'Naranja', 'Naranja claro', 'Naranja oscuro',
  'Oro', 'Oliva',
  'Púrpura', 'Plateado', 'Púrpura claro', 'Púrpura oscuro', 'Perla', 'Piel',
  'Rojo', 'Rosa', 'Rosa claro', 'Rosa oscuro', 'Rojo claro', 'Rojo oscuro',
  'Turquesa', 'Turquesa claro', 'Turquesa oscuro', 'Terracota',
  'Verde', 'Verde claro', 'Verde oscuro', 'Verde lima', 'Verde menta', 'Verde oliva',
  'Violeta',
];

const GARMENT_TYPE_SUGGESTIONS = [
  'Pantalón', 'Pantalones', 'Pantalón largo', 'Pantalón corto',
  'Camisa', 'Camisas', 'Camisa manga larga', 'Camisa manga corta',
  'Polo', 'Polos', 'Polo manga larga', 'Polo manga corta',
  'Vestido', 'Vestidos', 'Vestido largo', 'Vestido corto',
  'Gorra', 'Gorras',
  'Chaqueta', 'Chaquetas',
  'Saco', 'Sacos',
  'Chaleco', 'Chalecos',
  'Falda', 'Faldas',
  'Blusa', 'Blusas',
  'Bufanda', 'Bufandas',
  'Guantes', 'Guante',
  'Calcetines', 'Calcetín',
  'Ropa interior', 'Bragas', 'Calzoncillos',
  'Sábana', 'Sábanas',
  'Funda', 'Fundas',
  'Toalla', 'Toallas',
  'Mantel', 'Manteles',
  'Cortina', 'Cortinas',
  'Otro',
];

const PHYSICAL_STATE_OPTIONS = [
  { label: 'Excelente', value: 'EXCELLENT' },
  { label: 'Buena', value: 'GOOD' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Deficiente', value: 'POOR' },
  { label: 'Dañado', value: 'DAMAGED' },
];

const GARMENT_STATUS_OPTIONS = [
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'Inactivo', value: 'INACTIVE' },
];

interface GarmentFormProps {
  rfidCode: string;
  onSubmit: (data: {
    rfidCode: string;
    description: string;
    color: string;
    garmentType?: string;
    brand?: string;
    status?: string;
    physicalState?: string;
    observations: string;
    weight?: number;
  }) => void;
  submitting?: boolean;
  initialValues?: {
    rfidCode?: string;
    description?: string;
    color?: string;
    garmentType?: string;
    brand?: string;
    status?: string;
    physicalState?: string;
    weight?: string;
    observations?: string;
  };
  // Opcionales para escaneo integrado desde la página padre
  onScan?: () => void;
  isScanning?: boolean;
}

export const GarmentForm: React.FC<GarmentFormProps> = ({ 
  rfidCode, 
  onSubmit, 
  submitting = false, 
  initialValues,
  onScan, 
  isScanning = false 
}) => {
  const [color, setColor] = useState(initialValues?.color || '');
  const [garmentType, setGarmentType] = useState(initialValues?.garmentType || '');
  const [brand, setBrand] = useState(initialValues?.brand || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [status, setStatus] = useState(initialValues?.status || 'ACTIVE');
  const [physicalState, setPhysicalState] = useState(initialValues?.physicalState || '');
  const [weight, setWeight] = useState(initialValues?.weight || '');
  const [observations, setObservations] = useState(initialValues?.observations || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPhysicalStateDropdown, setShowPhysicalStateDropdown] = useState(false);

  // Actualizar campos si cambian los valores iniciales
  useEffect(() => {
    if (initialValues) {
      setColor(initialValues.color || '');
      setGarmentType(initialValues.garmentType || '');
      setBrand(initialValues.brand || '');
      setDescription(initialValues.description || '');
      setStatus(initialValues.status || 'ACTIVE');
      setPhysicalState(initialValues.physicalState || '');
      setWeight(initialValues.weight || '');
      setObservations(initialValues.observations || '');
    }
  }, [initialValues]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    const weightValue = weight ? parseFloat(weight) : undefined;
    if (weight && isNaN(weightValue!)) {
      Alert.alert('Error', 'El peso debe ser un número válido');
      return;
    }
    if (typeof weightValue === 'number' && weightValue < 0) {
      Alert.alert('Error', 'El peso debe ser mayor o igual a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit({ 
        rfidCode, 
        description, 
        color,
        garmentType: garmentType || undefined,
        brand: brand || undefined,
        status: status || undefined,
        physicalState: physicalState || undefined,
        observations,
        weight: weightValue
      });
      setIsSubmitting(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la prenda');
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-700 mb-2">Código RFID</Text>
          <Card padding="md" variant="outlined">
            <Text className="text-lg font-mono text-gray-900">{rfidCode || '—'}</Text>
          </Card>
          {onScan && (
            <View className="mt-3">
              <Button
                title={isScanning ? 'Detener Escaneo' : 'Escanear RFID'}
                onPress={onScan}
                size="sm"
                fullWidth
                style={isScanning ? { backgroundColor: '#dc2626' } : { backgroundColor: '#0b1f36' }}
              />
            </View>
          )}
        </View>

        <AutocompleteInput
          label="Color"
          placeholder="Ej: Azul, Amarillo, etc."
          value={color}
          onChangeText={setColor}
          suggestions={COLOR_SUGGESTIONS}
          icon="color-palette-outline"
        />

        <AutocompleteInput
          label="Tipo de Prenda"
          placeholder="Ej: Pantalón, Camisa, Polo, etc."
          value={garmentType}
          onChangeText={setGarmentType}
          suggestions={GARMENT_TYPE_SUGGESTIONS}
          icon="shirt-outline"
        />

        <Input
          label="Marca de Prenda"
          placeholder="Ej: Nike, Adidas, etc."
          value={brand}
          onChangeText={setBrand}
          icon="pricetag-outline"
        />

        <Input
          label="Descripción *"
          placeholder="Ej: Camisa de vestir"
          value={description}
          onChangeText={setDescription}
          icon="document-text-outline"
        />

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Estado de Prenda</Text>
          <TouchableOpacity
            onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between"
          >
            <Text className="text-gray-900">
              {GARMENT_STATUS_OPTIONS.find(s => s.value === status)?.label || 'Activo'}
            </Text>
            <IonIcon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showStatusDropdown && (
            <View className="bg-white rounded-lg border border-gray-300 mt-1">
              <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                {GARMENT_STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      setStatus(option.value);
                      setShowStatusDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-gray-200 last:border-b-0 flex-row items-center justify-between ${
                      status === option.value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Text className={status === option.value ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                      {option.label}
                    </Text>
                    {status === option.value && (
                      <IonIcon name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Estado Físico</Text>
          <TouchableOpacity
            onPress={() => setShowPhysicalStateDropdown(!showPhysicalStateDropdown)}
            className="bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between"
          >
            <Text className={physicalState ? 'text-gray-900' : 'text-gray-400'}>
              {physicalState
                ? PHYSICAL_STATE_OPTIONS.find(s => s.value === physicalState)?.label || 'Selecciona el estado'
                : 'Selecciona el estado'}
            </Text>
            <IonIcon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showPhysicalStateDropdown && (
            <View className="bg-white rounded-lg border border-gray-300 mt-1">
              <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                <TouchableOpacity
                  onPress={() => {
                    setPhysicalState('');
                    setShowPhysicalStateDropdown(false);
                  }}
                  className="px-4 py-3 border-b border-gray-200"
                >
                  <Text className="text-gray-900">Ninguno</Text>
                </TouchableOpacity>
                {PHYSICAL_STATE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      setPhysicalState(option.value);
                      setShowPhysicalStateDropdown(false);
                    }}
                    className={`px-4 py-3 border-b border-gray-200 last:border-b-0 flex-row items-center justify-between ${
                      physicalState === option.value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Text className={physicalState === option.value ? 'text-blue-600 font-semibold' : 'text-gray-900'}>
                      {option.label}
                    </Text>
                    {physicalState === option.value && (
                      <IonIcon name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <Input
          label="Peso (kg)"
          placeholder="Ej: 0.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          icon="scale-outline"
        />

        <Input
          label="Observaciones"
          placeholder="Información adicional sobre la prenda..."
          value={observations}
          onChangeText={setObservations}
          multiline
          icon="chatbox-ellipses-outline"
        />

        <View className="h-4" />

        <Button
          title={initialValues ? "Actualizar Prenda" : "Crear Prenda"}
          onPress={handleSubmit}
          isLoading={isSubmitting || submitting}
          fullWidth
          style={{ backgroundColor: initialValues ? '#F59E0B' : '#0b1f36' }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

