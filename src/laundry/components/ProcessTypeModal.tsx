import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';

interface ProcessTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProcess: (processType: string) => void;
  serviceType?: 'industrial' | 'personal';
}

// Mapeo de iconos y colores por defecto para procesos conocidos
const DEFAULT_PROCESS_CONFIG: Record<string, { icon: string; color: string; description: string }> = {
  'IN_PROCESS': { icon: 'construct-outline', color: '#3B82F6', description: 'Guías recibidas para procesar' },
  'WASHING': { icon: 'water-outline', color: '#06B6D4', description: 'Guías en proceso para lavar' },
  'DRYING': { icon: 'sunny-outline', color: '#F59E0B', description: 'Guías lavadas para secar' },
  'IRONING': { icon: 'flame-outline', color: '#DC2626', description: 'Guías secas para planchar' },
  'FOLDING': { icon: 'layers-outline', color: '#7C3AED', description: 'Guías planchadas para doblar' },
  'PACKAGING': { icon: 'cube-outline', color: '#8B5CF6', description: 'Guías secas para empacar' },
  'SHIPPING': { icon: 'boat-outline', color: '#EF4444', description: 'Guías empacadas para embarcar' },
  'LOADING': { icon: 'car-outline', color: '#84CC16', description: 'Guías embarcadas para cargar' },
  'DELIVERY': { icon: 'checkmark-circle-outline', color: '#22C55E', description: 'Guías cargadas para entregar' },
};

// Icono y color por defecto para procesos nuevos
const DEFAULT_ICON = 'ellipse-outline';
const DEFAULT_COLOR = '#6B7280';

export const ProcessTypeModal: React.FC<ProcessTypeModalProps> = ({
  visible,
  onClose,
  onSelectProcess,
  serviceType = 'industrial',
}) => {
  // Obtener procesos del catálogo
  const { data: processCatalog, isLoading } = useCatalogValuesByType('process_status', true, { forceFresh: true });

  // Mapear procesos del catálogo al formato del modal
  const processes = useMemo(() => {
    const catalogData = processCatalog?.data || [];
    
    return catalogData
      .filter(item => item.is_active !== false)
      .map(item => {
        const code = item.code;
        const defaultConfig = DEFAULT_PROCESS_CONFIG[code];
        
        return {
          label: item.label,
          value: code,
          // Para códigos conocidos, mantener descripción/icono/color "clásicos"
          description: defaultConfig?.description || item.description || 'Proceso de lavandería',
          icon: defaultConfig?.icon || item.icon || DEFAULT_ICON,
          color: defaultConfig?.color || item.color || DEFAULT_COLOR,
          display_order: item.display_order ?? 999,
        };
      })
      .sort((a, b) => a.display_order - b.display_order);
  }, [processCatalog]);

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
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <View>
              <Text className="text-2xl font-bold text-gray-900">Seleccionar Proceso</Text>
              <Text className="text-sm text-gray-600 mt-1">Elige el tipo de proceso a realizar</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Icon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Process Types Grid */}
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-gray-500">Cargando procesos...</Text>
              </View>
            ) : processes.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-gray-500">No hay procesos disponibles</Text>
              </View>
            ) : (
            <View className="flex-row flex-wrap -mx-2">
                {processes.map((process) => (
                <TouchableOpacity
                  key={process.value}
                  onPress={() => onSelectProcess(process.value)}
                  className="w-1/2 px-2 mb-4"
                >
                  <View 
                    className="p-4 rounded-2xl border-2 border-gray-100 active:border-gray-200"
                    style={{ backgroundColor: `${process.color}10` }}
                  >
                    <View className="items-center mb-3">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center mb-2"
                        style={{ backgroundColor: process.color }}
                      >
                        <Icon name={process.icon} size={24} color="white" />
                      </View>
                      <Text className="text-lg font-bold text-gray-900 text-center">
                        {process.label}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600 text-center leading-5">
                      {process.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
