import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerClassName?: string;
  variant?: 'default' | 'dark';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  containerClassName = '',
  className = '',
  secureTextEntry,
  variant = 'default',
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry;
  const shouldShowPassword = isPassword && !isPasswordVisible;

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>}

      <View
        className={`
          flex-row items-center
          border rounded-lg px-4
          ${
            isFocused
              ? 'border-primary-DEFAULT'
              : error
              ? 'border-danger-DEFAULT'
              : variant === 'dark'
              ? 'border-gray-600'
              : 'border-gray-300'
          }
          ${error ? 'bg-danger-DEFAULT/5' : variant === 'dark' ? 'bg-[#1b1f25]' : 'bg-white'}
        `.trim()}>
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={isFocused ? '#3B82F6' : error ? '#EF4444' : '#6B7280'}
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          className={`flex-1 py-3 ${
            variant === 'dark' ? 'text-gray-100' : 'text-gray-900'
          } text-base ${className}`.trim()}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={shouldShowPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="p-1">
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} className="p-1">
            <Icon name={rightIcon} size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text className="text-sm text-danger-DEFAULT mt-1">{error}</Text>}
    </View>
  );
};
