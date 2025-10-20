import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginPage } from '@/auth/pages/login/LoginPage';
import { ForgotPasswordPage } from '@/auth/pages/forgot-password/ForgotPasswordPage';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
    </Stack.Navigator>
  );
};
