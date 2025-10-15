import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SelectOption } from '@/interfaces/pagination.response';

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  icon?: string;
  variant?: 'default' | 'dark';
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Seleccionar...',
  options,
  value,
  onValueChange,
  error,
  disabled = false,
  searchable = false,
  icon,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleSelect = (option: SelectOption) => {
    onValueChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View className="mb-4">
      {label && (
        <Text
          className={`text-sm font-medium mb-2 ${
            variant === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          flex-row items-center justify-between
          border rounded-lg px-4 py-3
          ${
            error
              ? 'border-danger-DEFAULT bg-danger-DEFAULT/5'
              : variant === 'dark'
              ? 'border-gray-600 bg-[#1b1f25]'
              : 'border-gray-300 bg-white'
          }
          ${disabled ? 'opacity-50' : ''}
        `.trim()}>
        <View className="flex-row items-center flex-1">
          {icon && (
            <Icon
              name={icon}
              size={20}
              color={variant === 'dark' ? '#9CA3AF' : '#6B7280'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className={
              selectedOption
                ? variant === 'dark'
                  ? 'text-gray-100'
                  : 'text-gray-900'
                : 'text-gray-400'
            }>
            {selectedOption?.label || placeholder}
          </Text>
        </View>
        <Icon
          name="chevron-down-outline"
          size={20}
          color={variant === 'dark' ? '#9CA3AF' : '#6B7280'}
        />
      </TouchableOpacity>

      {error && <Text className="text-sm text-danger-DEFAULT mt-1">{error}</Text>}

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-xl w-11/12 max-h-96 overflow-hidden">
                <View className="p-4 border-b border-gray-200">
                  <Text className="text-lg font-semibold text-gray-900">
                    {label || 'Seleccionar'}
                  </Text>
                </View>

                <FlatList
                  data={filteredOptions}
                  keyExtractor={item => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelect(item)}
                      className={`
                        px-4 py-3 border-b border-gray-100
                        ${item.value === value ? 'bg-primary-DEFAULT/10' : ''}
                      `.trim()}>
                      <Text
                        className={`
                          text-base
                          ${
                            item.value === value
                              ? 'text-primary-DEFAULT font-semibold'
                              : 'text-gray-700'
                          }
                        `.trim()}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View className="p-4">
                      <Text className="text-gray-500 text-center">No hay opciones disponibles</Text>
                    </View>
                  }
                />

                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  className="p-4 border-t border-gray-200">
                  <Text className="text-center text-primary-DEFAULT font-semibold">Cerrar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
