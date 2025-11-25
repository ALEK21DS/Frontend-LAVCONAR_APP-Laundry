import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Button, Input, Card, Dropdown } from '@/components/common';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useAuthStore } from '@/auth/store/auth.store';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { isSuperAdminUser } from '@/helpers/user.helper';
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
    garmentCondition?: string[];
    physicalCondition?: string[];
    observations: string;
    weight?: number;
    quantity?: number;
    serviceType?: string;
    manufacturingDate?: string;
  }) => void;
  submitting?: boolean;
  initialValues?: {
    rfidCode?: string;
    description?: string;
    colors?: string[];
    garmentType?: string;
    brand?: string;
    branchOfficeId?: string;
    garmentCondition?: string | string[];
    physicalCondition?: string | string[];
    weight?: string;
    quantity?: number | string;
    observations?: string;
    serviceType?: string;
    manufacturingDate?: string;
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
  const isSuperAdmin = isSuperAdminUser(user);
  const userBranchId = user?.branch_office_id || (user as any)?.sucursalId || '';
  const branchOptions = sucursales.map(s => ({ label: s.name, value: s.id }));
  const [colorInput, setColorInput] = useState('');
  
  // Obtener catálogo de colores para convertir códigos a labels
  const { data: colorCatalog } = useCatalogValuesByType('color', true, { forceFresh: true });
  
  // Obtener catálogo de tipos de servicio
  const { data: serviceTypeCatalog } = useCatalogValuesByType('service_type', true, { forceFresh: true });
  
  // Obtener catálogos de condiciones para obtener labels
  const { data: garmentConditionCatalog, isLoading: isLoadingGarmentConditions, error: garmentConditionError } = useCatalogValuesByType('garment_condition_catalog', true, { forceFresh: true });
  const { data: physicalConditionCatalog, isLoading: isLoadingPhysicalConditions, error: physicalConditionError } = useCatalogValuesByType('physical_condition_catalog', true, { forceFresh: true });

  const SERVICE_TYPE_OPTIONS = useMemo(() => {
    return (serviceTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [serviceTypeCatalog]);

  // Mapas de códigos a labels para condiciones
  const garmentConditionCodeToLabel = useMemo(() => {
    const map: Record<string, string> = {};
    if (garmentConditionCatalog?.data) {
      garmentConditionCatalog.data.forEach(item => {
        map[item.code] = item.label;
      });
    }
    return map;
  }, [garmentConditionCatalog]);

  const physicalConditionCodeToLabel = useMemo(() => {
    const map: Record<string, string> = {};
    if (physicalConditionCatalog?.data) {
      physicalConditionCatalog.data.forEach(item => {
        map[item.code] = item.label;
      });
    }
    return map;
  }, [physicalConditionCatalog]);

  const groupCatalogValues = useCallback((catalogData: any) => {
    if (!catalogData?.data || !Array.isArray(catalogData.data)) return [];
    const groups: Record<string, any[]> = {};
    catalogData.data
      .filter((value: any) => value.is_active !== false)
      .forEach((value: any) => {
        const rawCategory =
          value.metadata?.category_label ||
          value.metadata?.category_name ||
          value.metadata?.category ||
          value.metadata?.category_group ||
          value.metadata?.section ||
          'General';
        const formattedCategory = String(rawCategory || 'General').trim().toUpperCase();
        if (!groups[formattedCategory]) {
          groups[formattedCategory] = [];
        }
        groups[formattedCategory].push(value);
      });

    return Object.entries(groups).map(([category, values]) => ({
      category,
      values: (values as any[]).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    }));
  }, []);

  const groupedGarmentConditionOptions = useMemo(() => {
    return groupCatalogValues(garmentConditionCatalog);
  }, [garmentConditionCatalog, groupCatalogValues]);

  const groupedPhysicalConditionOptions = useMemo(() => {
    return groupCatalogValues(physicalConditionCatalog);
  }, [physicalConditionCatalog, groupCatalogValues]);
  
  // Mapa de códigos del catálogo a labels
  const colorCodeToLabel = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (colorCatalog?.data) {
      colorCatalog.data.forEach(item => {
        map[item.code] = item.label;
      });
    }
    return map;
  }, [colorCatalog]);
  
  // Filtrar valores undefined/null y asegurar que sean strings
  // También manejar el caso donde puede venir como 'color' (singular) en initialValues
  // Convertir códigos del catálogo a labels si es necesario
  const initialColors = React.useMemo(() => {
    let colorArray: string[] = [];
    
    if (Array.isArray(initialValues?.colors)) {
      colorArray = initialValues.colors.filter((c): c is string => typeof c === 'string' && c.trim() !== '');
    } else {
      // Verificar si hay una propiedad 'color' (puede venir del backend como singular)
      const colorValue = (initialValues as any)?.color;
      if (Array.isArray(colorValue)) {
        colorArray = colorValue.filter((c): c is string => typeof c === 'string' && c.trim() !== '');
      } else if (colorValue && typeof colorValue === 'string' && colorValue.trim() !== '') {
        colorArray = [colorValue];
      }
    }
    
    // Convertir códigos del catálogo a labels si es necesario
    return colorArray.map(code => {
      // Si el código existe en el catálogo, usar el label
      if (colorCodeToLabel[code]) {
        return colorCodeToLabel[code];
      }
      // Si no existe en el catálogo, asumir que ya es un label
      return code;
    });
  }, [initialValues, colorCodeToLabel]);
  const [colors, setColors] = useState<string[]>(initialColors);
  const [garmentType, setGarmentType] = useState(initialValues?.garmentType || '');
  const [brand, setBrand] = useState(initialValues?.brand || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [branchOfficeId, setBranchOfficeId] = useState(initialValues?.branchOfficeId || userBranchId);
  const [serviceType, setServiceType] = useState(initialValues?.serviceType || '');
  const isPersonalService = serviceType === 'PERSONAL';
  // Normalizar condiciones iniciales a arrays
  const initialGarmentConditions = useMemo(() => {
    if (!initialValues?.garmentCondition) return [];
    if (Array.isArray(initialValues.garmentCondition)) {
      return initialValues.garmentCondition.filter((c): c is string => typeof c === 'string' && c.trim() !== '');
    }
    if (typeof initialValues.garmentCondition === 'string' && initialValues.garmentCondition.trim() !== '') {
      return [initialValues.garmentCondition];
    }
    return [];
  }, [initialValues?.garmentCondition]);

  const initialPhysicalConditions = useMemo(() => {
    if (!initialValues?.physicalCondition) return [];
    if (Array.isArray(initialValues.physicalCondition)) {
      return initialValues.physicalCondition.filter((c): c is string => typeof c === 'string' && c.trim() !== '');
    }
    if (typeof initialValues.physicalCondition === 'string' && initialValues.physicalCondition.trim() !== '') {
      return [initialValues.physicalCondition];
    }
    return [];
  }, [initialValues?.physicalCondition]);

  const [garmentCondition, setGarmentCondition] = useState<string[]>(initialGarmentConditions);
  const [physicalCondition, setPhysicalCondition] = useState<string[]>(initialPhysicalConditions);
  // Estados para controlar qué categorías están expandidas
  const [expandedGarmentCategories, setExpandedGarmentCategories] = useState<Record<string, boolean>>({});
  const [expandedPhysicalCategories, setExpandedPhysicalCategories] = useState<Record<string, boolean>>({});
  const [weight, setWeight] = useState(initialValues?.weight || '');
  const getInitialQuantityValue = () => {
    if (initialValues?.quantity !== undefined && initialValues?.quantity !== null) {
      return initialValues.quantity.toString();
    }
    return '1';
  };
  const [quantity, setQuantity] = useState(getInitialQuantityValue());
  useEffect(() => {
    if (isPersonalService) {
      setQuantity(prev => (prev === '1' ? prev : '1'));
    }
  }, [isPersonalService]);
  
  // Función para formatear automáticamente la fecha mientras se escribe (dd/mm/aaaa)
  const formatDateInput = (input: string): string => {
    // Remover todos los caracteres que no sean números
    const numbersOnly = input.replace(/\D/g, '');
    
    // Limitar a 8 dígitos (dd/mm/aaaa = 8 dígitos)
    const limited = numbersOnly.slice(0, 8);
    
    // Agregar slashes automáticamente
    if (limited.length === 0) return '';
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  };

  // Funciones para convertir entre dd/mm/aaaa y YYYY-MM-DD
  const convertDateToDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    // Si ya está en formato dd/mm/aaaa, devolverlo tal cual
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;
    // Convertir de YYYY-MM-DD a dd/mm/aaaa
    try {
      const [year, month, day] = isoDate.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // Si hay error, devolver el valor original
    }
    return isoDate;
  };

  const convertDateToISO = (displayDate: string): string => {
    if (!displayDate) return '';
    // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) return displayDate;
    // Convertir de dd/mm/aaaa a YYYY-MM-DD
    try {
      const [day, month, year] = displayDate.split('/');
      if (year && month && day) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } catch (e) {
      // Si hay error, devolver vacío
    }
    return '';
  };

  const initialManufacturingDateDisplay = useMemo(() => {
    return convertDateToDisplay(initialValues?.manufacturingDate || '');
  }, [initialValues?.manufacturingDate]);

  const [manufacturingDateDisplay, setManufacturingDateDisplay] = useState(initialManufacturingDateDisplay);
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

  const toggleGarmentConditionSelection = (code: string) => {
    setGarmentCondition(prev =>
      prev.includes(code) ? prev.filter(item => item !== code) : [...prev, code]
    );
  };

  const togglePhysicalConditionSelection = (code: string) => {
    setPhysicalCondition(prev =>
      prev.includes(code) ? prev.filter(item => item !== code) : [...prev, code]
    );
  };

  // Actualizar campos si cambian los valores iniciales
  useEffect(() => {
    if (initialValues) {
      // Usar initialColors que ya convierte códigos a labels
      setColors(initialColors);
      setGarmentType(initialValues.garmentType || '');
      setBrand(initialValues.brand || '');
      setDescription(initialValues.description || '');
      setBranchOfficeId(initialValues.branchOfficeId || userBranchId);
      setGarmentCondition(initialGarmentConditions);
      setPhysicalCondition(initialPhysicalConditions);
      setWeight(initialValues.weight || '');
      // Manejar quantity tanto como string como número
      // Si quantity tiene un valor (incluso 0), usarlo
      if (initialValues.quantity !== undefined && initialValues.quantity !== null) {
        const qtyValue = initialValues.quantity;
        if (typeof qtyValue === 'string') {
          setQuantity(qtyValue.trim() !== '' ? qtyValue : '1');
        } else {
          setQuantity(String(qtyValue));
        }
      }
      setServiceType(initialValues.serviceType || '');
      setManufacturingDateDisplay(convertDateToDisplay(initialValues.manufacturingDate || ''));
      setObservations(initialValues.observations || '');
    }
  }, [initialValues, initialColors, initialGarmentConditions, initialPhysicalConditions]);

  const currentBranch = sucursales.find(s => s.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';

  // Mapa de labels a códigos del catálogo (inverso)
  const colorLabelToCode = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (colorCatalog?.data) {
      colorCatalog.data.forEach(item => {
        map[item.label] = item.code;
      });
    }
    return map;
  }, [colorCatalog]);

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
      // Convertir labels de colores de vuelta a códigos del catálogo
      const colorCodes = colors.map(label => {
        // Si el label existe en el mapa, usar el código
        if (colorLabelToCode[label]) {
          return colorLabelToCode[label];
        }
        // Si no existe en el mapa, asumir que ya es un código
        return label;
      });
      // Convertir fecha de fabricación de dd/mm/aaaa a YYYY-MM-DD antes de enviar
      const manufacturingDateISO = manufacturingDateDisplay ? convertDateToISO(manufacturingDateDisplay) : undefined;
      const quantityValue = quantity ? parseInt(quantity) : undefined;
      
      onSubmit({ 
        rfidCode, 
        description, 
        colors: colorCodes,
        garmentType: garmentType || undefined,
        brand: brand || undefined,
        branchOfficeId: branchOfficeId || undefined,
        garmentCondition: garmentCondition.length > 0 ? garmentCondition : undefined,
        physicalCondition: physicalCondition.length > 0 ? physicalCondition : undefined,
        observations,
        weight: weightValue,
        quantity: quantityValue,
        serviceType: serviceType || undefined,
        manufacturingDate: manufacturingDateISO || undefined
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

        {/* Campo de Sucursal - Seleccionable para superadmin, solo lectura para admin */}
        {isSuperAdmin ? (
          <View className="mb-4">
            <Dropdown
              label="Sucursal *"
              placeholder="Selecciona una sucursal"
              options={branchOptions}
              value={branchOfficeId || ''}
              onValueChange={(value) => {
                setBranchOfficeId(value);
              }}
              icon="business-outline"
            />
          </View>
        ) : (
          <View className="mb-4">
            <Input
              label="Sucursal"
              value={branchOfficeName}
              editable={false}
              className="bg-gray-50"
              icon="business-outline"
            />
          </View>
        )}

        <View className="mb-4">
          <Dropdown
            label="Tipo de Servicio"
            placeholder="Selecciona un tipo de servicio"
            options={SERVICE_TYPE_OPTIONS}
            value={serviceType}
            onValueChange={(value) => {
              setServiceType(value);
              // Si cambia a un servicio que no es industrial, limpiar la fecha de fabricación
              if (value !== 'INDUSTRIAL') {
                setManufacturingDateDisplay('');
              }
            }}
            icon="business-outline"
          />
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
                {colors.filter((c): c is string => typeof c === 'string' && c.trim() !== '').map((c) => {
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
        {/* Peso y Fecha de Fabricación debajo de Color */}
        {serviceType === 'INDUSTRIAL' ? (
          <View className="mb-4 flex-row -mx-1">
            <View className="flex-1 px-1">
              <Input
                label="Peso (lb)"
                placeholder="Ej: 1.5"
                value={weight}
                onChangeText={(t) => { setWeight(t); if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined })); }}
                keyboardType="decimal-pad"
                icon="scale-outline"
                error={errors.weight}
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Fecha de Fabricación"
                placeholder="dd/mm/aaaa"
                value={manufacturingDateDisplay}
                onChangeText={(text) => setManufacturingDateDisplay(formatDateInput(text))}
                keyboardType="numeric"
                icon="calendar-outline"
              />
            </View>
          </View>
        ) : (
          <View className="mb-4">
            <Input
              label="Peso (lb)"
              placeholder="Ej: 1.5"
              value={weight}
              onChangeText={(t) => { setWeight(t); if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined })); }}
              keyboardType="decimal-pad"
              icon="scale-outline"
              error={errors.weight}
            />
          </View>
        )}

        {/* Cantidad debajo del Peso */}
        <View className="mb-4">
          <Input
            label="Cantidad"
            placeholder={isPersonalService ? 'Cantidad fija: 1' : 'Ej: 10'}
            value={quantity}
            onChangeText={text => {
              if (!isPersonalService) {
                setQuantity(text);
              }
            }}
            keyboardType="number-pad"
            icon="layers-outline"
            editable={!isPersonalService}
            selectTextOnFocus={!isPersonalService}
            className={isPersonalService ? 'text-gray-500' : ''}
            containerClassName={isPersonalService ? 'opacity-80' : ''}
          />
          {isPersonalService && (
            <Text className="text-xs text-gray-500 -mt-2 mb-2">
              Para servicio personal la cantidad siempre es 1.
            </Text>
          )}
        </View>

        {/* Condición de la Prenda */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Condición de la Prenda</Text>
          <Text className="text-xs text-gray-500 mb-2">
            {garmentCondition.length > 0
              ? `${garmentCondition.length} ${garmentCondition.length === 1 ? 'opción seleccionada' : 'opciones seleccionadas'}`
              : 'Selecciona una o varias condiciones'}
                  </Text>
            <View className="mt-3 bg-white border border-gray-200 rounded-2xl p-3">
              {isLoadingGarmentConditions ? (
                <View className="py-6 items-center">
                  <Text className="text-gray-500 text-sm">Cargando opciones...</Text>
                </View>
              ) : garmentConditionError ? (
                <View className="py-6 items-center">
                  <IonIcon name="alert-circle-outline" size={24} color="#EF4444" />
                  <Text className="text-sm text-red-500 mt-2 text-center">No se pudieron cargar las condiciones.</Text>
                </View>
              ) : groupedGarmentConditionOptions.length === 0 ? (
                <View className="py-6 items-center">
                  <IonIcon name="list-outline" size={24} color="#9CA3AF" />
                  <Text className="text-sm text-gray-500 mt-2 text-center">Sin valores disponibles.</Text>
                </View>
              ) : (
                groupedGarmentConditionOptions.map(section => {
                    const isExpanded = expandedGarmentCategories[section.category] ?? false;
                    const selectedInCategory = section.values.filter((v: any) =>
                      garmentCondition.includes(v.code)
                    ).length;
                    
                    return (
                      <View key={section.category} className="mb-2">
                        <TouchableOpacity
                          onPress={() => setExpandedGarmentCategories(prev => ({
                            ...prev,
                            [section.category]: !isExpanded
                          }))}
                          className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-row items-center justify-between"
                        >
                          <View className="flex-1 flex-row items-center">
                            <IonIcon 
                              name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} 
                              size={18} 
                              color="#3B82F6" 
                              style={{ marginRight: 8 }} 
                            />
                            <Text className="text-sm font-medium text-gray-900 flex-1">
                              {section.category}
                            </Text>
                            {selectedInCategory > 0 && (
                              <Text className="text-xs text-gray-500 ml-2">
                                ({selectedInCategory})
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View className="mt-2 bg-white border border-gray-200 rounded-lg p-2">
                    {section.values.map((value: any) => {
                      const isSelected = garmentCondition.includes(value.code);
                      return (
                        <TouchableOpacity
                          key={value.code}
                                  className="flex-row items-center py-2 px-2"
                          onPress={() => toggleGarmentConditionSelection(value.code)}
                        >
                          <View
                            className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                              isSelected ? 'bg-[#8EB021] border-[#8EB021]' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <IonIcon name="checkmark" size={14} color="#ffffff" />}
                          </View>
                                  <Text className={`text-sm flex-1 ${isSelected ? 'text-[#0b1f36] font-semibold' : 'text-gray-700'}`}>
                            {value.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
              )}
            </View>
                    );
                  })
          )}
          </View>
        </View>

        {/* Condición Física */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">Condición Física</Text>
          <Text className="text-xs text-gray-500 mb-2">
            {physicalCondition.length > 0
              ? `${physicalCondition.length} ${physicalCondition.length === 1 ? 'opción seleccionada' : 'opciones seleccionadas'}`
              : 'Selecciona una o varias condiciones físicas'}
                  </Text>
            <View className="mt-3 bg-white border border-gray-200 rounded-2xl p-3">
              {isLoadingPhysicalConditions ? (
                <View className="py-6 items-center">
                  <Text className="text-gray-500 text-sm">Cargando opciones...</Text>
                </View>
              ) : physicalConditionError ? (
                <View className="py-6 items-center">
                  <IonIcon name="alert-circle-outline" size={24} color="#EF4444" />
                  <Text className="text-sm text-red-500 mt-2 text-center">No se pudieron cargar las condiciones.</Text>
                </View>
              ) : groupedPhysicalConditionOptions.length === 0 ? (
                <View className="py-6 items-center">
                  <IonIcon name="list-outline" size={24} color="#9CA3AF" />
                  <Text className="text-sm text-gray-500 mt-2 text-center">Sin valores disponibles.</Text>
                </View>
              ) : (
                groupedPhysicalConditionOptions.map(section => {
                    const isExpanded = expandedPhysicalCategories[section.category] ?? false;
                    const selectedInCategory = section.values.filter((v: any) =>
                      physicalCondition.includes(v.code)
                    ).length;
                    
                    return (
                      <View key={section.category} className="mb-2">
                        <TouchableOpacity
                          onPress={() => setExpandedPhysicalCategories(prev => ({
                            ...prev,
                            [section.category]: !isExpanded
                          }))}
                          className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-row items-center justify-between"
                        >
                          <View className="flex-1 flex-row items-center">
                            <IonIcon 
                              name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} 
                              size={18} 
                              color="#3B82F6" 
                              style={{ marginRight: 8 }} 
                            />
                            <Text className="text-sm font-medium text-gray-900 flex-1">
                              {section.category}
                            </Text>
                            {selectedInCategory > 0 && (
                              <Text className="text-xs text-gray-500 ml-2">
                                ({selectedInCategory})
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        {isExpanded && (
                          <View className="mt-2 bg-white border border-gray-200 rounded-lg p-2">
                    {section.values.map((value: any) => {
                      const isSelected = physicalCondition.includes(value.code);
                      return (
                        <TouchableOpacity
                          key={value.code}
                                  className="flex-row items-center py-2 px-2"
                          onPress={() => togglePhysicalConditionSelection(value.code)}
                        >
                          <View
                            className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                              isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <IonIcon name="checkmark" size={14} color="#ffffff" />}
                          </View>
                                  <Text className={`text-sm flex-1 ${isSelected ? 'text-emerald-700 font-semibold' : 'text-gray-700'}`}>
                            {value.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
              )}
            </View>
                    );
                  })
          )}
          </View>
        </View>

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

