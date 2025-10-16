import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import WavesIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

type HeaderBarProps = {
  onToggleTheme?: () => void;
  className?: string;
  bgColor?: string;
  showThemeToggle?: boolean;
  onLogoutPress?: () => void;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onToggleTheme,
  className = '',
  bgColor = '#1f4eed',
  showThemeToggle = false,
  onLogoutPress,
}) => {
  return (
    <View
      className={`flex-row items-center justify-between rounded-none px-4 py-3 ${className}`}
      style={{ backgroundColor: bgColor }}>
      <View className="flex-row items-center">
        <View className="bg-primary-DEFAULT/20 rounded-lg p-2 mr-3">
          <WavesIcon name="waves" size={20} color="#ffffff" />
        </View>
        <View>
          <Text className="text-white font-bold text-lg">LAVCONAR</Text>
          <Text className="text-gray-200 text-xs">Sistema de Lavandería</Text>
        </View>
      </View>

      <View className="flex-row items-center">
        {showThemeToggle && (
          <TouchableOpacity
            onPress={onToggleTheme}
            className="w-9 h-9 rounded-lg bg-white/20 items-center justify-center mr-2">
            <IonIcon name="moon" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
        {onLogoutPress && (
          <TouchableOpacity
            onPress={onLogoutPress}
            className="w-9 h-9 rounded-lg bg-white/20 items-center justify-center">
            <IonIcon name="log-out-outline" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
