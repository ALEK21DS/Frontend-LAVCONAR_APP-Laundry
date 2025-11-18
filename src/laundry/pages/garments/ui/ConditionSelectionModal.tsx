import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Button, Card } from '@/components/common';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { CatalogValue } from '@/laundry/api/catalogs/catalogs.api';

interface ConditionSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedCodes: string[]) => void;
  catalogType: 'garment_condition_catalog' | 'physical_condition_catalog';
  title: string;
  initialSelected?: string[];
}

interface GroupedItem {
  category: string;
  values: CatalogValue[];
}

export const ConditionSelectionModal: React.FC<ConditionSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  catalogType,
  title,
  initialSelected = [],
}) => {
  const { data: catalogData, isLoading, error } = useCatalogValuesByType(catalogType, true, { forceFresh: true });
  const [selectedCodes, setSelectedCodes] = useState<string[]>(initialSelected);

  // Mapeo de nombres de categorías según el tipo de catálogo
  const getCategoryDisplayName = useMemo(() => {
    return (category: string): string => {
      if (catalogType === 'garment_condition_catalog') {
        // Para condición de la prenda
        if (category === 'Condición general / Riesgo en el lavado' || category === 'General') {
          return 'CONDICION GENERAL/RIESGO EN EL LAVADO';
        }
        return category.toUpperCase();
      } else if (catalogType === 'physical_condition_catalog') {
        // Para condición física
        const categoryMap: Record<string, string> = {
          'Costura / Confección': 'COSTURA/CONFECCION',
          'Manchas / Suciedad': 'MANCHAS/SUCIEDAD',
          'Daños físicos / Deterioro de la prenda': 'DAÑOS FISICOS/DETERIOR DE LA PRENDA',
        };
        return categoryMap[category] || category.toUpperCase();
      }
      return category;
    };
  }, [catalogType]);

  // Agrupar valores por sección (category_group en metadata)
  const groupedValues = useMemo(() => {
    if (!catalogData?.data || !Array.isArray(catalogData.data)) {
      console.log('[ConditionSelectionModal] No data or data is not an array');
      return [];
    }

    const groups: Record<string, CatalogValue[]> = {};

    catalogData.data
      .filter((v) => v.is_active !== false)
      .forEach((value) => {
        // Obtener la categoría/sección del metadata (priorizar category_group)
        const category = value.metadata?.category_group || value.metadata?.category || value.metadata?.section || 'General';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(value);
      });

    // Ordenar valores dentro de cada grupo por display_order
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    });

    // Convertir a array para FlatList con nombres de categoría mapeados
    return Object.entries(groups).map(([category, values]) => ({
      category: getCategoryDisplayName(category),
      originalCategory: category, // Guardar la categoría original para referencia
      values,
    })) as (GroupedItem & { originalCategory?: string })[];
  }, [catalogData, getCategoryDisplayName]);

  // Debug: Ver qué datos se están recibiendo
  useEffect(() => {
    if (visible) {
      console.log(`[ConditionSelectionModal] Catalog Type: ${catalogType}`);
      console.log(`[ConditionSelectionModal] Data:`, catalogData);
      console.log(`[ConditionSelectionModal] Is Loading:`, isLoading);
      console.log(`[ConditionSelectionModal] Error:`, error);
      console.log(`[ConditionSelectionModal] Grouped Values Length:`, groupedValues.length);
      console.log(`[ConditionSelectionModal] Grouped Values:`, groupedValues);
    }
  }, [visible, catalogData, catalogType, error, isLoading, groupedValues]);

  // Resetear selección cuando cambian los valores iniciales o se abre el modal
  useEffect(() => {
    if (visible) {
      setSelectedCodes(initialSelected);
    }
  }, [visible, initialSelected]);

  const toggleSelection = (code: string) => {
    setSelectedCodes((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedCodes);
    onClose();
  };

  const renderConditionItem = ({ item }: { item: CatalogValue }) => {
    const isSelected = selectedCodes.includes(item.code);
    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item.code)}
        className="mb-1"
      >
        <Card padding="sm" variant="outlined" className={isSelected ? 'bg-[#8EB021]/10 border-[#8EB021]' : ''}>
          <View className="flex-row items-center">
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2.5 ${
              isSelected 
                ? 'bg-[#8EB021] border-[#8EB021]' 
                : 'border-gray-300'
            }`}>
              {isSelected && (
                <IonIcon name="checkmark" size={14} color="#ffffff" />
              )}
            </View>
            <Text className={`text-sm flex-1 ${
              isSelected ? 'text-[#8EB021] font-semibold' : 'text-gray-700'
            }`}>
              {item.label}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSection = ({ item }: { item: GroupedItem }) => (
    <View className="mb-3">
      <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider px-1">
        {item.category}
      </Text>
      {item.values.map((value) => renderConditionItem({ item: value }))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40">
        <View className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl" style={{ elevation: 8 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center ml-3"
            >
              <IonIcon name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 px-4">
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="text-gray-500">Cargando opciones...</Text>
              </View>
            ) : (error as any) ? (
              <View className="flex-1 items-center justify-center py-12">
                <IonIcon name="alert-circle-outline" size={40} color="#EF4444" />
                <Text className="text-red-500 mt-3 text-center">
                  Error al cargar opciones
                </Text>
                <Text className="text-sm text-gray-500 mt-1.5 text-center">
                  {(error as any)?.message || 'No se pudo cargar el catálogo'}
                </Text>
              </View>
            ) : groupedValues.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <IonIcon name="list-outline" size={40} color="#D1D5DB" />
                <Text className="text-gray-500 mt-3">No hay opciones disponibles</Text>
                <Text className="text-sm text-gray-400 mt-1.5 text-center">
                  No se encontraron valores para {catalogType}
                </Text>
              </View>
            ) : (
              <FlatList
                data={groupedValues}
                renderItem={renderSection}
                keyExtractor={(item) => item.category}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>

          {/* Footer */}
          <View className="px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex-row space-x-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-gray-200 rounded-lg py-2 items-center"
            >
              <Text className="text-gray-700 font-semibold text-sm">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 bg-[#0b1f36] rounded-lg py-2 items-center"
              disabled={selectedCodes.length === 0}
            >
              <Text className={`font-semibold text-sm ${
                selectedCodes.length === 0 ? 'text-gray-400' : 'text-white'
              }`}>
                Continuar {selectedCodes.length > 0 && `(${selectedCodes.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

