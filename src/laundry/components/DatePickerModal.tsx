import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  // hour y minute son opcionales para permitir usar el mismo modal solo con fecha
  onConfirm: (day: number, month: number, year: number, hour?: number, minute?: number) => void;
  initialDate?: string; // Formato: dd/mm/yyyy
  // Cuando es true, se muestran también columnas de Hora y Minuto (para guías)
  showTime?: boolean;
  // Formato: HH:mm (24h)
  initialTime?: string;
  // Fecha mínima permitida (solo se compara por día/mes/año)
  minDate?: Date;
  minDateErrorMessage?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
  showTime = false,
  initialTime,
  minDate,
  minDateErrorMessage = 'La fecha no puede ser anterior a hoy',
}) => {
  const currentYear = new Date().getFullYear();
  const startYear = 1900;
  const endYear = currentYear;

  // Parsear fecha inicial
  const parseInitialDate = () => {
    if (initialDate && /^\d{2}\/\d{2}\/\d{4}$/.test(initialDate)) {
      const [day, month, year] = initialDate.split('/').map(Number);
      return { day, month, year };
    }
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    };
  };

  const initial = parseInitialDate();

  // Parsear hora inicial (HH:mm)
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

  const initialTimeParsed = parseInitialTime();

  const [selectedDay, setSelectedDay] = useState(initial.day);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedHour, setSelectedHour] = useState(initialTimeParsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialTimeParsed.minute);
  const [isUpdatingHour, setIsUpdatingHour] = useState(false);
  const [isUpdatingMinute, setIsUpdatingMinute] = useState(false);

  // Actualizar cuando cambia initialDate / initialTime
  useEffect(() => {
    if (visible) {
      if (initialDate) {
        const parsed = parseInitialDate();
        setSelectedDay(parsed.day);
        setSelectedMonth(parsed.month);
        setSelectedYear(parsed.year);
      }
      if (showTime) {
        const parsedTime = parseInitialTime();
        setSelectedHour(parsedTime.hour);
        setSelectedMinute(parsedTime.minute);
      }
    }
  }, [visible, initialDate, initialTime, showTime]);

  // Generar arrays de días, meses, años, horas y minutos
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Validar fecha seleccionada
  const isValidDate = (day: number, month: number, year: number): boolean => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  };

  const handleConfirm = () => {
    if (isValidDate(selectedDay, selectedMonth, selectedYear)) {
      // Validar contra fecha mínima si se proporciona
      if (minDate) {
        const selected = new Date(selectedYear, selectedMonth - 1, selectedDay);
        const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
        if (selected < min) {
          Alert.alert('Fecha no válida', minDateErrorMessage);
          return;
        }
      }
      if (showTime) {
        onConfirm(selectedDay, selectedMonth, selectedYear, selectedHour, selectedMinute);
      } else {
        onConfirm(selectedDay, selectedMonth, selectedYear);
      }
      onClose();
    }
  };

  // Ajustar día si es inválido para el mes/año seleccionado
  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const dayScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Scroll inicial cuando se abre el modal (solo una vez al abrir)
  useEffect(() => {
    if (visible) {
      const itemHeight = 40;

      const scrollToIndex = (
        ref: React.RefObject<ScrollView>,
        index: number,
      ) => {
        if (index >= 0 && ref.current) {
          setTimeout(() => {
            ref.current?.scrollTo({
              y: index * itemHeight,
              animated: false,
            });
          }, 100);
        }
      };

      scrollToIndex(dayScrollRef, days.indexOf(selectedDay));
      scrollToIndex(monthScrollRef, months.indexOf(selectedMonth));
      scrollToIndex(yearScrollRef, years.indexOf(selectedYear));

      if (showTime) {
        scrollToIndex(hourScrollRef, hours.indexOf(selectedHour));
        scrollToIndex(minuteScrollRef, minutes.indexOf(selectedMinute));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const renderPicker = (
    items: number[],
    selected: number,
    onSelect: (value: number) => void,
    label: string,
    formatValue: (value: number) => string,
    scrollRef: React.RefObject<ScrollView>
  ) => {
    const itemHeight = 40;
    const visibleItems = 5;

    return (
      <View className="flex-1 items-center">
        <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
        <View className="relative" style={{ height: itemHeight * visibleItems, width: 80 }}>
          {/* Indicador de selección */}
          <View
            className="absolute left-0 right-0 border-t border-b border-gray-300"
            style={{
              top: (visibleItems - 1) * itemHeight / 2,
              height: itemHeight,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }}
          />
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: (visibleItems - 1) * itemHeight / 2,
            }}
            onMomentumScrollEnd={(event) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              const index = Math.round(offsetY / itemHeight);
              if (index >= 0 && index < items.length) {
                onSelect(items[index]);
              }
            }}
            scrollEventThrottle={16}
            snapToInterval={itemHeight}
            decelerationRate="fast"
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  onSelect(item);
                  const index = items.indexOf(item);
                  scrollRef.current?.scrollTo({
                    y: index * itemHeight,
                    animated: true,
                  });
                }}
                className="items-center justify-center"
                style={{ height: itemHeight }}
              >
                <Text
                  className={`text-base ${
                    item === selected ? 'font-bold text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {formatValue(item)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ elevation: 8 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Seleccionar Fecha</Text>
            <TouchableOpacity onPress={onClose}>
              <IonIcon name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mb-4" style={{ height: 200 }}>
            {renderPicker(
              days,
              selectedDay,
              setSelectedDay,
              'Día',
              (d) => String(d).padStart(2, '0'),
              dayScrollRef
            )}
            {renderPicker(
              months,
              selectedMonth,
              setSelectedMonth,
              'Mes',
              (m) => String(m).padStart(2, '0'),
              monthScrollRef
            )}
            {renderPicker(
              years,
              selectedYear,
              setSelectedYear,
              'Año',
              (y) => String(y),
              yearScrollRef
            )}
          </View>

          {showTime && (
            <>
              {/* Línea separadora horizontal entre fecha y hora */}
              <View className="border-t border-gray-200 my-2" />

              <View className="flex-row justify-between mb-3">
                {/* Selector de Hora con input y flechas */}
                <View className="flex-1 items-center mr-2">
                  <Text className="text-xs font-semibold text-gray-700 mb-1">Hora</Text>
                  <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => {
                      if (isUpdatingHour) return;
                      setIsUpdatingHour(true);
                      setSelectedHour(prev => (prev <= 0 ? 23 : prev - 1));
                      setTimeout(() => setIsUpdatingHour(false), 120);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-1"
                    activeOpacity={0.8}
                  >
                    <Text className="text-base text-gray-700">-</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={String(selectedHour).padStart(2, '0')}
                    onChangeText={text => {
                      const onlyNums = text.replace(/\D/g, '');
                      if (onlyNums === '') {
                        setSelectedHour(0);
                        return;
                      }
                      const n = parseInt(onlyNums, 10);
                      if (!isNaN(n)) {
                        const clamped = Math.min(23, Math.max(0, n));
                        setSelectedHour(clamped);
                      }
                    }}
                    keyboardType="numeric"
                    className="text-center text-base font-semibold text-gray-900"
                    style={{
                      minWidth: 44,
                      paddingVertical: 4,
                      paddingHorizontal: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (isUpdatingHour) return;
                      setIsUpdatingHour(true);
                      setSelectedHour(prev => (prev >= 23 ? 0 : prev + 1));
                      setTimeout(() => setIsUpdatingHour(false), 120);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center ml-1"
                    activeOpacity={0.8}
                  >
                    <Text className="text-base text-gray-700">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Selector de Minuto con input y flechas */}
              <View className="flex-1 items-center ml-2">
                <Text className="text-xs font-semibold text-gray-700 mb-1">Minuto</Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => {
                      if (isUpdatingMinute) return;
                      setIsUpdatingMinute(true);
                      setSelectedMinute(prev => (prev <= 0 ? 59 : prev - 1));
                      setTimeout(() => setIsUpdatingMinute(false), 120);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-1"
                    activeOpacity={0.8}
                  >
                    <Text className="text-base text-gray-700">-</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={String(selectedMinute).padStart(2, '0')}
                    onChangeText={text => {
                      const onlyNums = text.replace(/\D/g, '');
                      if (onlyNums === '') {
                        setSelectedMinute(0);
                        return;
                      }
                      const n = parseInt(onlyNums, 10);
                      if (!isNaN(n)) {
                        const clamped = Math.min(59, Math.max(0, n));
                        setSelectedMinute(clamped);
                      }
                    }}
                    keyboardType="numeric"
                    className="text-center text-base font-semibold text-gray-900"
                    style={{
                      minWidth: 44,
                      paddingVertical: 4,
                      paddingHorizontal: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (isUpdatingMinute) return;
                      setIsUpdatingMinute(true);
                      setSelectedMinute(prev => (prev >= 59 ? 0 : prev + 1));
                      setTimeout(() => setIsUpdatingMinute(false), 120);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center ml-1"
                    activeOpacity={0.8}
                  >
                    <Text className="text-base text-gray-700">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
          )}

          {/* Fecha (y hora) seleccionada */}
          <View className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Text className="text-sm text-gray-600 text-center">
              {String(selectedDay).padStart(2, '0')}/{String(selectedMonth).padStart(2, '0')}/{selectedYear}
              {showTime && (
                <> {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}</>
              )}
            </Text>
          </View>

          {/* Botones */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
            >
              <Text className="text-gray-700 font-medium">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 rounded-lg items-center"
              style={{ backgroundColor: '#0b1f36' }}
            >
              <Text className="text-white font-medium">Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

