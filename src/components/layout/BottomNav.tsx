import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

type TabItem = {
  key: 'Dashboard' | 'Clients' | 'ScanClothes' | 'Guides' | 'Processes';
  label: string;
  icon: string;
};

interface BottomNavProps {
  active: TabItem['key'];
  onNavigate: (route: TabItem['key']) => void;
}

const TABS: TabItem[] = [
  { key: 'Dashboard', label: 'Inicio', icon: 'home-outline' },
  { key: 'Clients', label: 'Clientes', icon: 'people-outline' },
  { key: 'ScanClothes', label: 'Escanear', icon: 'scan-outline' },
  { key: 'Guides', label: 'Guías', icon: 'document-text-outline' },
  { key: 'Processes', label: 'Procesos', icon: 'sync-outline' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  return (
    <View className="flex-row items-center justify-between px-2 pt-2 pb-6 bg-white border-t border-gray-200">
      {TABS.map((tab, idx) => {
        const isCenter = tab.key === 'ScanClothes';
        const isActive = active === tab.key;
        if (isCenter) {
          return (
            <TouchableOpacity
              key={tab.key}
              className="-mt-8 w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: '#1f4eed', elevation: 10 }}
              onPress={() => onNavigate(tab.key)}
              activeOpacity={0.85}
            >
              <IonIcon name={tab.icon} size={24} color="#ffffff" />
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            key={tab.key}
            className="flex-1 items-center"
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.8}
          >
            <IonIcon name={tab.icon} size={22} color={isActive ? '#1f4eed' : '#6B7280'} />
            <Text className={`text-xs mt-1 ${isActive ? 'text-[#1f4eed]' : 'text-gray-500'}`}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};


