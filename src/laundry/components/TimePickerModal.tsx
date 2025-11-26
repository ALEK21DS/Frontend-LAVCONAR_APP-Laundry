import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialTime?: string; // HH:mm
  onConfirm: (time: string) => void;
  title?: string;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  initialTime,
  onConfirm,
  title = 'Seleccionar Hora',
}) => {
  const parseInitialTime = () => {
    if (initialTime && /^\d{2}:\d{2}$/.test(initialTime)) {
      const [h, m] = initialTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return { hour: h, minute: m };
      }
    }
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  };

  const initial = parseInitialTime();

  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    if (visible) {
      const parsed = parseInitialTime();
      setHour(parsed.hour);
      setMinute(parsed.minute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialTime]);

  const clampHour = (value: number) => {
    if (value < 0) return 0;
    if (value > 23) return 23;
    return value;
  };

  const clampMinute = (value: number) => {
    if (value < 0) return 0;
    if (value > 59) return 59;
    return value;
  };

  const handleConfirm = () => {
    const time = `${String(clampHour(hour)).padStart(2, '0')}:${String(
      clampMinute(minute),
    ).padStart(2, '0')}`;
    onConfirm(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        <View className="bg-white rounded-2xl p-5 w-full max-w-xs" style={{ elevation: 8 }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <IonIcon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center mb-4">
            {/* Hora */}
            <View className="items-center mx-2">
              <Text className="text-xs text-gray-500 mb-1">Hora</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setHour(prev => clampHour(prev - 1))}
                  className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-1"
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-gray-700">-</Text>
                </TouchableOpacity>
                <TextInput
                  value={String(hour).padStart(2, '0')}
                  onChangeText={text => {
                    const onlyNums = text.replace(/\D/g, '');
                    if (onlyNums === '') {
                      setHour(0);
                      return;
                    }
                    const n = parseInt(onlyNums, 10);
                    if (!isNaN(n)) {
                      setHour(clampHour(n));
                    }
                  }}
                  keyboardType="numeric"
                  className="text-center text-lg font-semibold text-gray-900"
                  style={{
                    minWidth: 40,
                    paddingVertical: 4,
                    paddingHorizontal: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                  }}
                />
                <TouchableOpacity
                  onPress={() => setHour(prev => clampHour(prev + 1))}
                  className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center ml-1"
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-gray-700">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Separador : */}
            <Text className="text-xl font-bold text-gray-700 mx-1">:</Text>

            {/* Minuto */}
            <View className="items-center mx-2">
              <Text className="text-xs text-gray-500 mb-1">Minuto</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setMinute(prev => clampMinute(prev - 1))}
                  className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-1"
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-gray-700">-</Text>
                </TouchableOpacity>
                <TextInput
                  value={String(minute).padStart(2, '0')}
                  onChangeText={text => {
                    const onlyNums = text.replace(/\D/g, '');
                    if (onlyNums === '') {
                      setMinute(0);
                      return;
                    }
                    const n = parseInt(onlyNums, 10);
                    if (!isNaN(n)) {
                      setMinute(clampMinute(n));
                    }
                  }}
                  keyboardType="numeric"
                  className="text-center text-lg font-semibold text-gray-900"
                  style={{
                    minWidth: 40,
                    paddingVertical: 4,
                    paddingHorizontal: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                  }}
                />
                <TouchableOpacity
                  onPress={() => setMinute(prev => clampMinute(prev + 1))}
                  className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center ml-1"
                  activeOpacity={0.8}
                >
                  <Text className="text-base text-gray-700">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 items-center"
            >
              <Text className="text-gray-700 font-medium text-sm">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: '#0b1f36' }}
            >
              <Text className="text-white font-medium text-sm">Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


