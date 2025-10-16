import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardPage } from '@/laundry/pages/dashboard/DashboardPage';
import { ClientsPage } from '@/laundry/pages/clients/ClientsPage';
import { GuidesPage } from '@/laundry/pages/guides/GuidesPage';
import { ProcessesPage } from '@/laundry/pages/processes/ProcessesPage';
import { ScanClothesPage, ScanProcessesPage } from '@/laundry/pages/scan';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Dashboard" component={DashboardPage} />
      <Stack.Screen name="Clients" component={ClientsPage} />
      <Stack.Screen name="Guides" component={GuidesPage} />
      <Stack.Screen name="Processes" component={ProcessesPage} />
      <Stack.Screen name="ScanClothes" component={ScanClothesPage} />
      <Stack.Screen name="ScanProcesses" component={ScanProcessesPage} />
    </Stack.Navigator>
  );
};
