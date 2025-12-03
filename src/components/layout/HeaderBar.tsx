import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

type HeaderBarProps = {
  onToggleTheme?: () => void;
  className?: string;
  bgColor?: string;
  showThemeToggle?: boolean;
  onUserPress?: () => void;
  onNotificationsPress?: () => void;
  notificationsCount?: number;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onToggleTheme,
  className = '',
  bgColor = '#0b1f36',
  showThemeToggle = false,
  onUserPress,
  onNotificationsPress,
  notificationsCount = 0,
}) => {
  return (
    <View
      className={`flex-row items-center justify-between rounded-none px-2 py-2 ${className}`}
      style={{ backgroundColor: bgColor }}>
      <View className="flex-row items-center">
        <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}>
          <Image
            source={require('@/assets/logo-laundry.png')}
            resizeMode="contain"
            style={{ width: 200, height: 70, marginLeft: 0 }}
          />
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
        {onNotificationsPress && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            className="w-12 h-12 rounded-lg bg-white/20 items-center justify-center mr-2">
            <IonIcon name="notifications-outline" size={24} color="#ffffff" />
            {notificationsCount > 0 && (
              <View
                className="absolute top-1 right-1 bg-red-500 rounded-full items-center justify-center"
                style={{ minWidth: 18, height: 18, paddingHorizontal: 4 }}>
                <Text className="text-white text-xs font-bold">
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {onUserPress && (
          <TouchableOpacity
            onPress={onUserPress}
            className="w-12 h-12 rounded-lg bg-white/20 items-center justify-center mr-2">
            <IonIcon name="person-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
