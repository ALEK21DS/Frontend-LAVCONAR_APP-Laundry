import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button } from '@/components/common';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View className="flex-1 justify-center items-center px-6 py-12">
      <Icon name={icon} size={64} color="#D1D5DB" />
      <Text className="text-xl font-bold text-gray-900 mt-4 text-center">{title}</Text>
      {message && <Text className="text-base text-gray-500 mt-2 text-center">{message}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" className="mt-6" />
      )}
    </View>
  );
};
