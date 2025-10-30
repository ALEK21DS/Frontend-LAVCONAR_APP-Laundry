import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
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
      className={`flex-row items-center justify-between rounded-none px-2 py-2 ${className}`}
      style={{ backgroundColor: bgColor }}>
      <View className="flex-row items-center">
        <Image
          source={require('@/assets/logo-laundry.png')}
          resizeMode="contain"
          style={{ width: 200, height: 70, marginLeft: 0 }}
        />
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
