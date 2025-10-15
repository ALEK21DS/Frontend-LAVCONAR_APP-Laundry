import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import WavesIcon from 'react-native-vector-icons/MaterialCommunityIcons';

type MenuItem = {
  label: string;
  icon: string;
  route: string;
};

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onLogout?: () => void;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'home-outline', route: 'Dashboard' },
  { label: 'Clientes', icon: 'people-outline', route: 'RegisterClient' },
  { label: 'Guías', icon: 'document-text-outline', route: 'CreateGuide' },
  { label: 'Procesos', icon: 'sync-outline', route: 'ScanProcesses' },
];

export const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, onNavigate, onLogout }) => {
  const translateX = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -Dimensions.get('window').width,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  if (!visible) {
    // Keep hidden view mounted for animation; overlay handled below
  }

  return (
    <>
      {visible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0 bg-black/40"
          style={{ zIndex: 48, elevation: 48 }}
        />
      )}
      <Animated.View
        className="absolute top-0 bottom-0 left-0 w-64 bg-white"
        style={{ transform: [{ translateX }], zIndex: 49 }}>
        <View className="px-4 py-5 border-b border-gray-200" style={{ backgroundColor: '#1f4eed' }}>
          <View className="flex-row items-center">
            <View className="bg-white/20 rounded-lg p-2 mr-3">
              <WavesIcon name="waves" size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-white text-lg font-bold">LAVCONAR</Text>
              <Text className="text-gray-200 text-xs mt-1">Sistema de Lavandería</Text>
            </View>
          </View>
        </View>

        <View className="py-2 flex-1">
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.route}
              className="flex-row items-center px-4 py-3 active:bg-black/5"
              onPress={() => {
                onNavigate(item.route);
                onClose();
              }}>
              <IonIcon name={item.icon} size={20} color="#374151" />
              <Text className="text-gray-800 text-base ml-3">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="border-t border-gray-200 p-4">
          <TouchableOpacity
            className="w-full bg-red-50 active:bg-red-100 py-3 rounded-lg flex-row items-center justify-center"
            onPress={onLogout}>
            <IonIcon name="log-out-outline" size={18} color="#DC2626" />
            <Text className="text-red-600 font-semibold ml-2">Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};
