import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#3B82F6',
  message,
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size={size} color={color} />
        {message && <Text className="mt-4 text-gray-600 text-base">{message}</Text>}
      </View>
    );
  }

  return (
    <View className="py-8 items-center">
      <ActivityIndicator size={size} color={color} />
      {message && <Text className="mt-4 text-gray-600 text-base">{message}</Text>}
    </View>
  );
};
