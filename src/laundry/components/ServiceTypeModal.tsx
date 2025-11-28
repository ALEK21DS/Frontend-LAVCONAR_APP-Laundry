import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';

interface ServiceTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectService: (serviceType: 'industrial' | 'personal') => void;
  title?: string;
}

export const ServiceTypeModal: React.FC<ServiceTypeModalProps> = ({
  visible,
  onClose,
  onSelectService,
  title = 'Seleccionar Tipo de Servicio'
}) => {
  // Traer tipos de servicio desde catálogo (fresco)
  const { data: serviceTypeCatalog, isLoading: isLoadingServiceType } = useCatalogValuesByType('service_type', true, { forceFresh: true });

  // Mapear catálogo a opciones visuales con fallback
  const serviceOptions = useMemo(() => {
    const defaults: Record<string, { icon: string; color: string; bg: string; title: string; subtitle: string; appValue?: 'industrial'|'personal' }> = {
      INDUSTRIAL: { icon: 'construct-outline', color: '#2563EB', bg: 'bg-blue-50 border-blue-200', title: 'Servicio Industrial', subtitle: 'Procesamiento masivo de prendas industriales', appValue: 'industrial' },
      PERSONAL: { icon: 'person-outline', color: '#059669', bg: 'bg-green-50 border-green-200', title: 'Servicio Personal', subtitle: 'Atención personalizada y entrega directa', appValue: 'personal' },
    };

    const values = (serviceTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    if (values.length === 0) {
      // Fallback a dos opciones conocidas si el catálogo está vacío
      return [
        { code: 'INDUSTRIAL', ...defaults.INDUSTRIAL },
        { code: 'PERSONAL', ...defaults.PERSONAL },
      ];
    }

    return values.map(v => {
      const d = defaults[v.code] || { icon: 'briefcase-outline', color: '#6B7280', bg: 'bg-gray-50 border-gray-200', title: v.label, subtitle: 'Servicio disponible', appValue: undefined };
      return { code: v.code, ...d, title: d.title || v.label };
    });
  }, [serviceTypeCatalog]);

  const handleSelectCode = (code: string) => {
    const lower = code.toUpperCase() === 'PERSONAL' ? 'personal' : 'industrial';
    onSelectService(lower as 'industrial' | 'personal');
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-1/5 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <View className="flex-row items-center flex-1">
            <IonIcon name="business-outline" size={24} color="#3B82F6" />
            <Text className="text-xl font-bold text-gray-900 ml-2">{title}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <IonIcon name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 p-4">
          {/* Service Options desde catálogo */}
          <View className="space-y-3">
            {isLoadingServiceType ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-500 text-sm mt-3">Cargando opciones...</Text>
              </View>
            ) : (
              serviceOptions.map(opt => (
              <TouchableOpacity key={opt.code} activeOpacity={0.7} onPress={() => handleSelectCode(opt.code)}>
                <Card padding="md" className={`${opt.bg}`}>
                  <View className="flex-row items-center">
                    <View className="rounded-lg p-3 mr-4" style={{ backgroundColor: `${opt.color}20` }}>
                      <IonIcon name={opt.icon as any} size={24} color={opt.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900 mb-1">{opt.title}</Text>
                      <Text className="text-sm text-gray-700">{opt.subtitle}</Text>
                    </View>
                    <IonIcon name="chevron-forward" size={20} color={opt.color} />
                  </View>
                </Card>
              </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
