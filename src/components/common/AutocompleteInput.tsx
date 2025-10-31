import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

interface AutocompleteInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: string[];
  icon?: string;
  onSelect?: (suggestion: string) => void;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  suggestions,
  icon,
  onSelect,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionContainerRef = useRef<View>(null);

  useEffect(() => {
    if (value.trim().length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().startsWith(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  const handleSelect = (suggestion: string) => {
    // Cancelar cualquier timeout pendiente
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    onChangeText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
  };

  const handleInputBlur = () => {
    // Delay para permitir que el onPress de las sugerencias funcione
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
  };

  const handleInputFocus = () => {
    // Cancelar cualquier timeout pendiente
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    if (value.trim().length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().startsWith(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View className="mb-4 relative">
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
      )}
      <View className="relative">
        <View className="flex-row items-center bg-white rounded-lg border border-gray-300 px-4 py-2">
          {icon && (
            <IonIcon name={icon} size={18} color="#6B7280" style={{ marginRight: 8 }} />
          )}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-gray-900 text-sm"
            style={{ fontSize: 14, paddingVertical: 4 }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </View>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <View 
            ref={suggestionContainerRef}
            className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg border border-gray-300 shadow-lg"
            style={{ 
              maxHeight: 192,
              elevation: 5,
              zIndex: 1000,
            }}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView 
              nestedScrollEnabled
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              style={{ maxHeight: 192 }}
              showsVerticalScrollIndicator={false}
            >
              {filteredSuggestions.map((item, index) => (
                <Pressable
                  key={`${item}-${index}`}
                  onPress={() => handleSelect(item)}
                  className="px-4 py-2 border-b border-gray-200"
                  style={({ pressed }) => [
                    { 
                      borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0, 
                      borderBottomColor: '#E5E7EB',
                      backgroundColor: pressed ? '#F3F4F6' : 'transparent'
                    }
                  ]}
                  onPressIn={() => {
                    // Cancelar el blur timeout cuando se presiona una sugerencia
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current);
                      blurTimeoutRef.current = null;
                    }
                  }}
                >
                  <Text className="text-gray-900">{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

