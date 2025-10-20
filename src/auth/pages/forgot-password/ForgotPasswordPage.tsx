import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { AuthLayout } from '@/auth/layouts/AuthLayout';
import { Input, Button } from '@/components/common';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export const ForgotPasswordPage: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
    // Solo UI por ahora (sin backend). Mantener coherente con solicitud del usuario.
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      Alert.alert('Enviado', 'Te enviaremos un enlace para restablecer tu contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View className="mx-4">
        {/* Icono y títulos */}
        <View className="items-center mb-8">
          <View className="bg-blue-500/20 w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Icon name="email-outline" size={32} color="#0B5ED7" />
          </View>
          <Text className="text-3xl font-extrabold text-blue-700 text-center">Restablecer</Text>
          <Text className="text-3xl font-extrabold text-blue-700 text-center">Contraseña</Text>
          <Text className="text-sm text-gray-400 mt-2">Ingresa tu correo electrónico</Text>
        </View>

        {/* Campo correo */}
        <View className="mb-4">
          <Input
            label="Correo Electrónico"
            placeholder="usuario@lavconar.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            variant="dark"
          />
        </View>

        <Text className="text-xs text-gray-400 mb-4">Te enviaremos un enlace para restablecer tu contraseña</Text>

        {/* Botón enviar */}
        <Button
          title="Enviar Enlace"
          onPress={handleSubmit}
          isLoading={isLoading}
          fullWidth
          size="lg"
          variant="primary"
        />

        {/* Volver al login */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className="mt-4 w-full">
          <View className="flex-row items-center justify-center bg-white/5 border border-white/10 rounded-lg py-3">
            <Icon name="arrow-left" size={18} color="#9CA3AF" />
            <Text className="ml-2 text-gray-300">Volver al Login</Text>
          </View>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};


