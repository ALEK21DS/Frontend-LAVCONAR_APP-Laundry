import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { WashingProcess } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { useCatalogLabelMap } from '@/laundry/hooks';

interface ProcessDetailsModalProps {
  visible: boolean;
  process: WashingProcess | null;
  onClose: () => void;
}

const formatDate = (date?: string | Date) => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

export const ProcessDetailsModal: React.FC<ProcessDetailsModalProps> = ({ visible, process, onClose }) => {
  const { getLabel: getSpecialTreatmentLabel } = useCatalogLabelMap('special_treatment');
  const { getLabel: getProcessStatusLabel } = useCatalogLabelMap('process_status');

  const specialTreatmentLabel = useMemo(() => {
    if (!process?.special_treatment) return 'Ninguno';
    return getSpecialTreatmentLabel(
      process.special_treatment,
      (process as any).special_treatment_label || process.special_treatment || 'Ninguno'
    );
  }, [process, getSpecialTreatmentLabel]);

  const statusLabel = useMemo(() => {
    if (!process?.status) return '—';
    return getProcessStatusLabel(
      process.status,
      (process as any).status_label || process.status
    );
  }, [process, getProcessStatusLabel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40">
        <View className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-3xl" style={{ elevation: 10 }}>
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <View>
              <Text className="text-2xl font-bold text-gray-900">Detalles del Proceso</Text>
              <Text className="text-sm text-gray-600 mt-1">Consulta la información registrada de este proceso</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
              <IonIcon name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {process ? (
              <>
                <View className="bg-white border border-gray-200 rounded-3xl p-5 mb-4 shadow-sm">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-gray-400 text-xs uppercase tracking-widest">Guía</Text>
                      <Text className="text-2xl font-extrabold text-gray-900 mt-1">{process.guide?.guide_number || 'Sin número'}</Text>
                      {process.guide?.client?.name && (
                        <Text className="text-sm text-gray-500 mt-2">{process.guide.client.name}</Text>
                      )}
                    </View>
                    <View className="items-end">
                      <View className="flex-row items-center bg-purple-100 rounded-full px-3 py-1 mb-2">
                        <IonIcon name="flash-outline" size={14} color="#7C3AED" />
                        <Text className="text-xs font-semibold text-purple-700 ml-2">{statusLabel}</Text>
                      </View>
                      <View className="bg-gray-100 rounded-2xl px-3 py-2">
                        <Text className="text-[10px] text-gray-400 uppercase tracking-widest">Sucursal</Text>
                        <Text className="text-sm text-gray-700 mt-1 text-right">{process.branch_office_name || '—'}</Text>
                      </View>
                    </View>
                  </View>
                  {process.machine_code && (
                    <View className="mt-5 flex-row items-center">
                      <View className="w-10 h-10 rounded-2xl bg-purple-100 items-center justify-center mr-3">
                        <IonIcon name="hardware-chip-outline" size={20} color="#7C3AED" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-400 uppercase tracking-widest">Máquina empleada</Text>
                        <Text className="text-base font-semibold text-gray-900 mt-1">{process.machine_code}</Text>
                        {process.machine?.type && (
                          <Text className="text-xs text-gray-500 mt-1">{process.machine.type}</Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                <View className="bg-white border border-gray-200 rounded-3xl p-5 mb-4 shadow-sm">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-2xl bg-blue-100 items-center justify-center mr-3">
                      <IonIcon name="time-outline" size={20} color="#2563EB" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-400 uppercase tracking-widest">Detalles del Proceso</Text>
                      <Text className="text-lg font-semibold text-gray-900">Cronograma y métricas</Text>
                    </View>
                  </View>
                  <View className="bg-blue-50 rounded-2xl p-4 mb-3">
                    <View className="flex-row mb-3">
                      <View className="flex-1 mr-3">
                        <Text className="text-[10px] text-blue-500 uppercase tracking-widest">Inicio</Text>
                        <Text className="text-sm text-blue-900 mt-1 font-semibold">{formatDate(process.start_time)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] text-blue-500 uppercase tracking-widest">Fin</Text>
                        <Text className="text-sm text-blue-900 mt-1 font-semibold">{formatDate(process.end_time)}</Text>
                      </View>
                    </View>
                    <View className="flex-row">
                      <View className="flex-1 mr-3">
                        <Text className="text-[10px] text-blue-500 uppercase tracking-widest">Peso</Text>
                        <Text className="text-sm text-blue-900 mt-1 font-semibold">{process.load_weight !== undefined ? `${process.load_weight} kg` : '—'}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] text-blue-500 uppercase tracking-widest">Prendas</Text>
                        <Text className="text-sm text-blue-900 mt-1 font-semibold">{process.garment_quantity !== undefined ? `${process.garment_quantity} prendas` : '—'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="bg-white border border-gray-200 rounded-3xl p-5 mb-4 shadow-sm">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-2xl bg-amber-100 items-center justify-center mr-3">
                      <IonIcon name="flame-outline" size={20} color="#F59E0B" />
                    </View>
                    <View>
                      <Text className="text-xs text-amber-500 uppercase tracking-widest">Configuración</Text>
                      <Text className="text-lg font-semibold text-gray-900">Lavado y químicos</Text>
                    </View>
                  </View>
                  <View className="mb-4">
                    <Text className="text-xs text-gray-400 uppercase tracking-widest">Tratamiento especial</Text>
                    <Text className="text-sm font-semibold text-gray-900 mt-1">{specialTreatmentLabel}</Text>
                  </View>
                  <View className="flex-row">
                    <View className="flex-row items-center mr-6">
                      <IonIcon
                        name={process.softener_used ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={process.softener_used ? '#16A34A' : '#DC2626'}
                      />
                      <Text className="text-sm text-gray-800 ml-2">Suavizante</Text>
                    </View>
                    <View className="flex-row items-center">
                      <IonIcon
                        name={process.bleach_used ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={process.bleach_used ? '#16A34A' : '#DC2626'}
                      />
                      <Text className="text-sm text-gray-800 ml-2">Blanqueador</Text>
                    </View>
                  </View>
                </View>

                <View className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center mr-3">
                      <IonIcon name="document-text-outline" size={20} color="#374151" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-400 uppercase tracking-widest">Auditoría</Text>
                      <Text className="text-lg font-semibold text-gray-900">Historial de cambios</Text>
                    </View>
                  </View>
                  <View className="flex-row">
                    <View className="flex-1 mr-3">
                      <Text className="text-[10px] text-gray-400 uppercase tracking-widest">Creación</Text>
                      <Text className="text-sm text-gray-800 mt-1 font-semibold">{formatDate(process.created_at)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-gray-400 uppercase tracking-widest">Última actualización</Text>
                      <Text className="text-sm text-gray-800 mt-1 font-semibold">{formatDate(process.updated_at)}</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-gray-500">No hay información disponible</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
