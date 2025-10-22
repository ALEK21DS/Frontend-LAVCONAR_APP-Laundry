import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardPage } from '@/laundry/pages/dashboard/DashboardPage';
import { ClientsPage } from '@/laundry/pages/clients/ClientsPage';
import { GuidesPage } from '@/laundry/pages/guides/GuidesPage';
import { ProcessesPage } from '@/laundry/pages/processes/ProcessesPage';
import { GarmentsPage } from '@/laundry/pages/garments/GarmentsPage';
import { ScanClothesPage, ScanProcessesPage } from '@/laundry/pages/scan';
import { GarmentValidationPage } from '@/laundry/pages/processes/GarmentValidationPage';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}>
      <Stack.Screen name="Dashboard" component={DashboardPage} />
      <Stack.Screen name="Clients" component={ClientsPage} />
      <Stack.Screen name="Guides" component={GuidesPage} />
      <Stack.Screen name="Garments" component={GarmentsPage} />
      <Stack.Screen name="Processes" component={ProcessesPage} />
      <Stack.Screen name="ScanClothes" component={ScanClothesPage} />
      <Stack.Screen name="ScanProcesses" component={ScanProcessesPage} />
      <Stack.Screen name="GarmentValidation" component={GarmentValidationPage} />
    </Stack.Navigator>
  );
};
