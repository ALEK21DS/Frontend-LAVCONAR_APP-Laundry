import React from 'react';
import { SafeAreaView, View, ViewProps } from 'react-native';

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  safe?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Container: React.FC<ContainerProps> = ({
  children,
  safe = true,
  padding = 'md',
  className = '',
  ...props
}) => {
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

  const containerClasses = `flex-1 bg-background-DEFAULT ${getPaddingStyles()} ${className}`.trim();

  if (safe) {
    return (
      <SafeAreaView className={`flex-1 ${className}`}>
        <View className={containerClasses} {...props}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className={containerClasses} {...props}>
      {children}
    </View>
  );
};
