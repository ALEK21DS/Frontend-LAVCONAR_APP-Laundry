import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-DEFAULT/10 border-primary-DEFAULT/20';
      case 'secondary':
        return 'bg-secondary-DEFAULT/10 border-secondary-DEFAULT/20';
      case 'success':
        return 'bg-success-DEFAULT/10 border-success-DEFAULT/20';
      case 'warning':
        return 'bg-warning-DEFAULT/10 border-warning-DEFAULT/20';
      case 'danger':
        return 'bg-danger-DEFAULT/10 border-danger-DEFAULT/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return 'bg-primary-DEFAULT/10 border-primary-DEFAULT/20';
    }
  };

  const getTextStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'text-primary-DEFAULT';
      case 'secondary':
        return 'text-secondary-DEFAULT';
      case 'success':
        return 'text-success-DEFAULT';
      case 'warning':
        return 'text-warning-DEFAULT';
      case 'danger':
        return 'text-danger-DEFAULT';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-primary-DEFAULT';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 rounded';
      case 'md':
        return 'px-3 py-1 rounded-md';
      case 'lg':
        return 'px-4 py-1.5 rounded-lg';
      default:
        return 'px-3 py-1 rounded-md';
    }
  };

  const getTextSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const badgeClasses = `
    ${getVariantStyles()}
    ${getSizeStyles()}
    border
    self-start
    ${className}
  `.trim();

  const textClasses = `${getTextStyles()} ${getTextSizeStyles()} font-semibold`.trim();

  return (
    <View className={badgeClasses} {...props}>
      <Text className={textClasses}>{label}</Text>
    </View>
  );
};
