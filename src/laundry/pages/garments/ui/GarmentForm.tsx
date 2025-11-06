import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, Input, Card, Dropdown } from '@/components/common';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useAuthStore } from '@/auth/store/auth.store';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import IonIcon from 'react-native-vector-icons/Ionicons';

// Paleta de colores (como en la web)
const COLOR_SUGGESTIONS = [
  'Blanco', 'Negro', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado',
  'Rosa', 'Marrón', 'Gris', 'Azul Marino', 'Beige', 'Azul Claro', 'Azul Oscuro', 'Verde Claro',
  'Verde Oscuro', 'Rojo Claro', 'Rojo Oscuro', 'Morado Claro', 'Morado Oscuro',
];

// Mapa de nombres -> color visual (hex aproximado)
const COLOR_HEX: Record<string, string> = {
  'blanco': '#ffffff',
  'negro': '#000000',
  'rojo': '#ef4444',
  'azul': '#2563eb',
  'verde': '#22c55e',
  'amarillo': '#fde047',
  'naranja': '#fb923c',
  'morado': '#8b5cf6',
  'rosa': '#f472b6',
  'marrón': '#92400e',
  'gris': '#9ca3af',
  'azul marino': '#1e3a8a',
  'beige': '#f5f5dc',
  'azul claro': '#93c5fd',
  'azul oscuro': '#1d4ed8',
  'verde claro': '#86efac',
  'verde oscuro': '#166534',
  'rojo claro': '#fca5a5',
  'rojo oscuro': '#991b1b',
  'morado claro': '#c4b5fd',
  'morado oscuro': '#5b21b6',
};

// GARMENT_TYPE_SUGGESTIONS removido - ahora se obtiene del catálogo

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

// Componente para el dropdown de tipo de prenda que obtiene valores del catálogo
interface GarmentTypeDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
}

const GarmentTypeDropdown: React.FC<GarmentTypeDropdownProps> = ({ value, onValueChange }) => {
  // forceFresh: asegura que al abrir el form se obtengan valores actualizados
  const { data: catalogData, isLoading } = useCatalogValuesByType('garment_type', true, { forceFresh: true });
  
  // Convertir los valores del catálogo a formato para el Dropdown
  const garmentTypeOptions = React.useMemo(() => {
    if (!catalogData?.data) {
      return [];
    }
    
    // Filtrar solo activos y ordenar por display_order
    return catalogData.data
      .filter((v) => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((item) => ({
        label: item.label,
        value: item.code,
      }));
  }, [catalogData]);

  return (
    <Dropdown
      label="Tipo de Prenda"
      placeholder={isLoading ? "Cargando tipos..." : "Seleccionar tipo de prenda"}
      options={garmentTypeOptions}
      value={value}
      onValueChange={onValueChange}
      icon="shirt-outline"
    />
  );
};

interface GarmentFormProps {
  rfidCode: string;
  onSubmit: (data: {
    rfidCode: string;
    description: string;
    colors: string[];
    garmentType?: string;
    brand?: string;
    branchOfficeId?: string;
    garmentCondition?: string;
    physicalCondition?: string;
    observations: string;
    weight?: number;
  }) => void;
  submitting?: boolean;
  initialValues?: {
    rfidCode?: string;
    description?: string;
    colors?: string[];
    garmentType?: string;
    brand?: string;
    branchOfficeId?: string;
    garmentCondition?: string;
    physicalCondition?: string;
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
  const { sucursales } = useBranchOffices();
  const { user } = useAuthStore();
  const userBranchId = user?.branch_office_id || (user as any)?.sucursalId || '';
  const branchOptions = sucursales.map(s => ({ label: s.name, value: s.id }));
  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState<string[]>(Array.isArray(initialValues?.colors) ? initialValues!.colors! : []);
  const [garmentType, setGarmentType] = useState(initialValues?.garmentType || '');
  const [brand, setBrand] = useState(initialValues?.brand || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [branchOfficeId, setBranchOfficeId] = useState(initialValues?.branchOfficeId || userBranchId);
  const [garmentCondition, setGarmentCondition] = useState(initialValues?.garmentCondition || '');
  const [physicalCondition, setPhysicalCondition] = useState(initialValues?.physicalCondition || '');
  const [weight, setWeight] = useState(initialValues?.weight || '');
  const [observations, setObservations] = useState(initialValues?.observations || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const filteredColorSuggestions = useMemo(() => {
    const q = colorInput.trim().toLowerCase();
    if (!q) return [] as string[];
    return COLOR_SUGGESTIONS.filter(c => c.toLowerCase().includes(q)).slice(0, 10);
  }, [colorInput]);

  // Errores del formulario (inline)
  const [errors, setErrors] = useState<{ 
    description?: string;
    branchOfficeId?: string;
    weight?: string;
  }>({});

  // Actualizar campos si cambian los valores iniciales
  useEffect(() => {
    if (initialValues) {
      setColors(Array.isArray(initialValues.colors) ? initialValues.colors! : []);
      setGarmentType(initialValues.garmentType || '');
      setBrand(initialValues.brand || '');
      setDescription(initialValues.description || '');
      setBranchOfficeId(initialValues.branchOfficeId || userBranchId);
      setGarmentCondition(initialValues.garmentCondition || '');
      setPhysicalCondition(initialValues.physicalCondition || '');
      setWeight(initialValues.weight || '');
      setObservations(initialValues.observations || '');
    }
  }, [initialValues]);

  const currentBranch = sucursales.find(s => s.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!branchOfficeId) newErrors.branchOfficeId = 'La sucursal es obligatoria';
    if (!description.trim()) newErrors.description = 'La descripción es obligatoria';
    const weightValue = weight ? parseFloat(weight) : undefined;
    if (weight && isNaN(weightValue!)) newErrors.weight = 'El peso debe ser un número válido';
    if (typeof weightValue === 'number' && weightValue < 0) newErrors.weight = 'El peso debe ser ≥ 0';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      onSubmit({ 
        rfidCode, 
        description, 
        colors,
        garmentType: garmentType || undefined,
        brand: brand || undefined,
        branchOfficeId: branchOfficeId || undefined,
        garmentCondition: garmentCondition || undefined,
        physicalCondition: physicalCondition || undefined,
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        <View className="mb-4">
          <Input
            label="Sucursal"
            value={branchOfficeName}
            editable={false}
            className="bg-gray-50"
            icon="business-outline"
          />
        </View>

        <View className="mb-4">
          <Input
          label="Color"
            placeholder="Escribe el color (ej: rojo)"
            value={colorInput}
            onChangeText={setColorInput}
          icon="color-palette-outline"
        />
          {/* Autocompletado simple */}
          {filteredColorSuggestions.length > 0 && (
            <View className="bg-white border border-gray-300 rounded-lg">
              {filteredColorSuggestions.map((sug, idx) => (
                <TouchableOpacity
                  key={sug}
                  onPress={() => {
                    if (!colors.includes(sug)) setColors(prev => [...prev, sug]);
                    setColorInput('');
                  }}
                  className={`px-3 py-2 ${idx < filteredColorSuggestions.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                  <Text className="text-gray-800">{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Botones Agregar/Limpiar removidos: ahora se agrega desde el dropdown */}

          {colors.length > 0 && (
            <Card padding="sm" variant="outlined" className="mt-3">
              <Text className="text-sm font-medium text-gray-700 mb-2">Colores seleccionados</Text>
              <View className="flex-row flex-wrap -m-1">
                {colors.map((c) => {
                  const key = c.toLowerCase();
                  const dot = COLOR_HEX[key] || '#6b7280';
                  return (
                  <View key={c} className="m-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 flex-row items-center">
                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: dot }} />
                    <Text className="text-xs text-blue-800 mr-2">{c}</Text>
                    <TouchableOpacity onPress={() => setColors(prev => prev.filter(v => v !== c))}>
                      <IonIcon name="close" size={14} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                );})}
              </View>
            </Card>
          )}

          {/* Paleta removida para simplificar en móvil; usar autocompletado y chips */}
        </View>

        <View className="mb-4">
          <GarmentTypeDropdown
            value={garmentType}
            onValueChange={setGarmentType}
          />
        </View>

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
          onChangeText={(t) => { setDescription(t); if (errors.description) setErrors(prev => ({ ...prev, description: undefined })); }}
          icon="document-text-outline"
          error={errors.description}
        />

        <Input
          label="Condición de la Prenda"
          placeholder="Ej: Buen estado general..."
          value={garmentCondition}
          onChangeText={setGarmentCondition}
          multiline
          icon="create-outline"
        />

        <Input
          label="Condición Física"
          placeholder="Ej: Sin manchas, sin roturas..."
          value={physicalCondition}
          onChangeText={setPhysicalCondition}
          multiline
          icon="pulse-outline"
        />

        <Input
          label="Peso (kg)"
          placeholder="Ej: 0.5"
          value={weight}
          onChangeText={(t) => { setWeight(t); if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined })); }}
          keyboardType="decimal-pad"
          icon="scale-outline"
          error={errors.weight}
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

