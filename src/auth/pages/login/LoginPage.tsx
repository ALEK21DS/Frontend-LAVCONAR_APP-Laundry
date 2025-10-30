import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Dropdown } from '@/components/common';
import { useAuth } from '@/auth/hooks/useAuth';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { validateLoginData } from '@/helpers/validators.helper';
import { LoginCredentials } from '@/auth/interfaces/auth.response';
import { AuthLayout } from '@/auth/layouts/AuthLayout';
import { Image } from 'react-native';
import { Toast } from '@/components/ui/toast';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const { sucursalesOptions, isLoading: isLoadingSucursales } = useBranchOffices();
  const navigation = useNavigation<any>();

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

  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // Prevenir múltiples llamadas
    if (isSubmitting || isLoading) {
      console.log('🚫 Login ya en progreso, ignorando llamada duplicada');
      return;
    }

    setIsSubmitting(true);
    clearError();
    setErrors({});

    const validation = validateLoginData(formData);
    if (!validation.isValid) {
      setToastMsg(validation.error || 'Datos incompletos.');
      setShowErrorToast(true);
      setIsSubmitting(false);
      return;
    }

    try {
      await login(formData);
    } catch (err: any) {
      setToastMsg(err?.message || 'No se pudo iniciar sesión. Verifica tus credenciales.');
      setShowErrorToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast a nivel de página */}
      <Toast
        visible={!!error || showErrorToast}
        message={toastMsg || error || 'No se pudo iniciar sesión. Verifica tus credenciales.'}
        variant="error"
        onHide={() => {
          setShowErrorToast(false);
          setToastMsg(null);
          clearError();
        }}
      />
      
      <AuthLayout>
        {/* Contenido dentro del modal del AuthLayout (sin cuadro interno) */}
        <View className="mx-4">
          {/* Logo y Título */}
          <View className="items-center mb-8">
            <Image
              source={require('@/assets/logo-laundry-lav.png')}
              resizeMode="contain"
              style={{ width: 80, height: 80, marginBottom: 8 }}
            />
            <Image
              source={require('@/assets/logo-laundry-name.png')}
              resizeMode="contain"
              style={{ width: 200, height: 60 }}
            />
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
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={text => setFormData({ ...formData, password: text })}
              error={errors.password}
              secureTextEntry
            />

            {isLoadingSucursales ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-center text-gray-400 mt-2">Cargando sucursales...</Text>
              </View>
            ) : (
              <Dropdown
                label="Sucursal"
                placeholder="Selecciona una sucursal"
                options={sucursalesOptions}
                value={formData.sucursalId}
                onValueChange={value => setFormData({ ...formData, sucursalId: value })}
                error={errors.sucursalId}
              />
            )}
          </View>

          {/* Botón de login */}
          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            isLoading={isLoading || isSubmitting}
            fullWidth
            size="lg"
            style={{ backgroundColor: '#143b64' }}
          />
        </View>
      </AuthLayout>
    </>
  );
};
