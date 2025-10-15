import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-DEFAULT active:bg-primary-dark';
      case 'secondary':
        return 'bg-secondary-DEFAULT active:bg-secondary-dark';
      case 'outline':
        return 'bg-transparent border-2 border-primary-DEFAULT active:bg-primary-DEFAULT/10';
      case 'danger':
        return 'bg-danger-DEFAULT active:bg-danger-dark';
      case 'ghost':
        return 'bg-transparent active:bg-gray-100';
      case 'white':
        return 'bg-white active:bg-gray-100 border border-gray-300';
      default:
        return 'bg-primary-DEFAULT active:bg-primary-dark';
    }
  };

  const getTextStyles = (): string => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return 'text-white';
      case 'outline':
      case 'ghost':
        return 'text-primary-DEFAULT';
      case 'white':
        return 'text-gray-900';
      default:
        return 'text-white';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 rounded-md';
      case 'md':
        return 'px-4 py-3 rounded-lg';
      case 'lg':
        return 'px-6 py-4 rounded-xl';
      case 'icon':
        return 'p-2 rounded-lg';
      default:
        return 'px-4 py-3 rounded-lg';
    }
  };

  const getTextSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      case 'icon':
        return 'text-base';
      default:
        return 'text-base';
    }
  };

  const buttonClasses = `
    ${getVariantStyles()}
    ${getSizeStyles()}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50' : ''}
    flex-row items-center justify-center
    ${className}
  `.trim();

  const textClasses = `
    ${getTextStyles()}
    ${getTextSizeStyles()}
    font-semibold
  `.trim();

  return (
    <TouchableOpacity
      className={buttonClasses}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...props}>
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#3B82F6' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          {title && (
            <Text className={textClasses} style={{ marginLeft: icon ? 8 : 0 }}>
              {title}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
