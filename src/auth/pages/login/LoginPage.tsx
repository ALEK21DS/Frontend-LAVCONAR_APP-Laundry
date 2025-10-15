import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Input, Button, Dropdown } from '@/components/common';
import { useAuth } from '@/auth/hooks/useAuth';
import { SUCURSALES } from '@/constants';
import { validateLoginData } from '@/helpers/validators.helper';
import { LoginCredentials } from '@/auth/interfaces/auth.response';
import { AuthLayout } from '@/auth/layouts/AuthLayout';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const LoginPage: React.FC = () => {
  const { loginDemo, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<LoginCredentials>({
    username: '',
    password: '',
    sucursalId: '',
  });

  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    sucursalId?: string;
  }>({});

  const handleLogin = async () => {
    clearError();
    setErrors({});

    const validation = validateLoginData(formData);
    if (!validation.isValid) {
      Alert.alert('Error de validación', validation.error);
      return;
    }

    try {
      await loginDemo(formData);
    } catch (err: any) {
      Alert.alert(
        'Error de autenticación',
        err.message || 'No se pudo iniciar sesión. Verifica tus credenciales.'
      );
    }
  };

  return (
    <AuthLayout>
      {/* Contenido dentro del modal del AuthLayout (sin cuadro interno) */}
      <View className="mx-4">
        {/* Logo y Título */}
        <View className="items-center mb-8">
          {/* Icono de Olas */}
          <View className="bg-gray-800 w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Icon name="waves" size={32} color="#FFFFFF" />
          </View>
          <Text className="text-3xl font-bold text-blue-600">LAVCONAR</Text>
          <Text className="text-sm text-gray-400 mt-1">Lavandería LAVCONAR</Text>
        </View>

        {/* Formulario */}
        <View className="mb-4">
          <Input
            label="Usuario o Correo"
            placeholder="usuario@lavconar.com"
            value={formData.username}
            onChangeText={text => setFormData({ ...formData, username: text })}
            error={errors.username}
            autoCapitalize="none"
            keyboardType="email-address"
            variant="dark"
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={formData.password}
            onChangeText={text => setFormData({ ...formData, password: text })}
            error={errors.password}
            secureTextEntry
            variant="dark"
          />

          <Dropdown
            label="Sucursal"
            placeholder="Selecciona una sucursal"
            options={SUCURSALES}
            value={formData.sucursalId}
            onValueChange={value => setFormData({ ...formData, sucursalId: value })}
            error={errors.sucursalId}
            variant="dark"
          />
        </View>

        {/* Mensaje de error */}
        {error && (
          <View className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <Text className="text-sm text-red-400 text-center">{error}</Text>
          </View>
        )}

        {/* Botón de login */}
        <Button
          title="Iniciar Sesión"
          onPress={handleLogin}
          isLoading={isLoading}
          fullWidth
          size="lg"
          variant="white"
        />
      </View>
    </AuthLayout>
  );
};
