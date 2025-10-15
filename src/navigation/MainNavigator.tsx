import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardPage } from '@/laundry/pages/dashboard/DashboardPage';
import { RegisterClientPage } from '@/laundry/pages/clients/RegisterClientPage';
import { CreateGuidePage } from '@/laundry/pages/guides/CreateGuidePage';
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
      <Stack.Screen name="RegisterClient" component={RegisterClientPage} />
      <Stack.Screen name="CreateGuide" component={CreateGuidePage} />
      <Stack.Screen name="ScanClothes" component={ScanClothesPage} />
      <Stack.Screen name="ScanProcesses" component={ScanProcessesPage} />
    </Stack.Navigator>
  );
};
