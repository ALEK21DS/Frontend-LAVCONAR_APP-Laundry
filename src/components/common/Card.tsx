import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  padding = 'md',
  className = '',
  onPress,
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'elevated':
        return 'bg-white shadow-lg';
      case 'outlined':
        return 'bg-white border border-gray-200';
      case 'default':
      default:
        return 'bg-white shadow-md';
    }
  };

  const getPaddingStyles = (): string => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'md':
        return 'p-4';
      case 'lg':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const cardClasses = `
    ${getVariantStyles()}
    ${getPaddingStyles()}
    rounded-xl
    ${className}
  `.trim();

  const Component: React.ComponentType<any> = onPress ? TouchableOpacity : View;

  return (
    <Component
      className={cardClasses}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
      {...props}>
      {(title || subtitle) && (
        <View className="mb-3">
          {title && <Text className="text-lg font-bold text-gray-900">{title}</Text>}
          {subtitle && <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>}
        </View>
      )}
      {children}
    </Component>
  );
};
