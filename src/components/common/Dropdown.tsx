import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, findNodeHandle, Dimensions, ScrollView } from 'react-native';
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
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number }>(
    { x: 0, y: 0, width: 0, height: 0 }
  );
  
  // Cleanup: cerrar el dropdown cuando el componente se desmonte
  useEffect(() => {
    return () => {
      setIsOpen(false);
    };
  }, []);

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
    <View className="mb-4 relative">
      {label && (
        <Text
          className={`text-sm font-medium mb-2 ${
            variant === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        ref={anchorRef as any}
        onPress={() => {
          if (disabled) return;
          requestAnimationFrame(() => {
            const node = findNodeHandle(anchorRef.current);
            if (anchorRef.current && node) {
              // @ts-ignore
              anchorRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
                const screenW = Dimensions.get('window').width;
                const safeW = Number.isFinite(width) && width > 0 ? width : Math.min(360, screenW - 32);
                const safeX = Number.isFinite(x) ? Math.max(8, x) : 8;
                const safeY = Number.isFinite(y) ? y : 100;
                const safeH = Number.isFinite(height) ? height : 0;
                setAnchor({ x: safeX, y: safeY, width: safeW, height: safeH });
                setIsOpen(true);
              });
            } else {
              setIsOpen(true);
            }
          });
        }}
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

      {isOpen && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setIsOpen(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          {(() => {
            const screenH = Dimensions.get('window').height;
            const estimatedItemH = 48;
            const maxMenuH = 260;
            const calcH = Math.min(maxMenuH, Math.max(estimatedItemH, filteredOptions.length * estimatedItemH));
            const spaceBelow = screenH - (anchor.y + anchor.height);
            const openUp = spaceBelow < calcH + 12; // si no hay espacio debajo, abrir hacia arriba
            const top = openUp ? Math.max(8, anchor.y - calcH - 6) : anchor.y + anchor.height + 6;
            const width = anchor.width;
            return (
              <View style={{ position: 'absolute', top, left: anchor.x, width }}>
                <View
                  className={`rounded-xl overflow-hidden ${
                    variant === 'dark' ? 'bg-[#111216] border border-gray-700' : 'bg-white border border-gray-200'
                  }`}
                  style={{ elevation: 20, maxHeight: maxMenuH }}>
                  <ScrollView>
              {filteredOptions.length === 0 ? (
                <View className="p-4">
                  <Text
                    className={`text-center ${variant === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No hay opciones disponibles
                  </Text>
                </View>
              ) : (
                filteredOptions.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => handleSelect(item)}
                    className={`px-4 py-3 border-b ${
                      variant === 'dark' ? 'border-gray-800' : 'border-gray-100'
                    } ${
                      item.value === value
                        ? variant === 'dark'
                          ? 'bg-white/5'
                          : 'bg-primary-DEFAULT/10'
                        : ''
                    }`.trim()}>
                    <Text
                      className={`text-base ${
                        item.value === value
                          ? variant === 'dark'
                            ? 'text-gray-100 font-semibold'
                            : 'text-primary-DEFAULT font-semibold'
                          : variant === 'dark'
                          ? 'text-gray-300'
                          : 'text-gray-700'
                      }`.trim()}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
                  </ScrollView>
                </View>
              </View>
            );
          })()}
          
        </Modal>
      )}
    </View>
  );
};
