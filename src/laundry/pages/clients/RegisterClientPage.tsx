import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Input, Button } from '@/components/common';
import { useClients } from '@/laundry/hooks/useClients';
import { validateClientData } from '@/helpers/validators.helper';
import { CreateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import Icon from 'react-native-vector-icons/Ionicons';

type RegisterClientPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const RegisterClientPage: React.FC<RegisterClientPageProps> = ({ navigation }) => {
  const { createClient } = useClients();

  const [formData, setFormData] = useState<CreateClientDto>({
    name: '',
    email: '',
    identification_number: '',
    phone: '',
    address: '',
    acronym: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    identification_number?: string;
    phone?: string;
  }>({});

  const handleSubmit = async () => {
    setErrors({});

    const validation = validateClientData(formData);
    if (!validation.isValid) {
      Alert.alert('Error de validación', validation.error);
      return;
    }

    try {
      await createClient.mutateAsync(formData);
      Alert.alert('Éxito', 'Cliente registrado correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar el cliente. Intenta nuevamente.');
    }
  };

  return (
    <Container safe>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <View className="flex-row items-center mb-6">
          <Button
            icon={<Icon name="arrow-back-outline" size={24} color="#3B82F6" />}
            variant="ghost"
            size="icon"
            onPress={() => navigation.goBack()}
          />
          <Text className="text-2xl font-bold text-gray-900 ml-2">Registrar Cliente</Text>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="mb-6">
            <Text className="text-base text-gray-600 mb-6">
              Completa la información del nuevo cliente
            </Text>

            <Input
              label="Nombre Completo *"
              placeholder="Nombre completo del cliente"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
              error={errors.name}
              icon="person-outline"
            />

            <Input
              label="Email *"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChangeText={text => setFormData({ ...formData, email: text })}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
            />

            <Input
              label="Cédula/RUC *"
              placeholder="Número de identificación"
              value={formData.identification_number}
              onChangeText={text => setFormData({ ...formData, identification_number: text })}
              error={errors.identification_number}
              keyboardType="numeric"
              icon="card-outline"
            />

            <Input
              label="Teléfono (Opcional)"
              placeholder="Número de teléfono"
              value={formData.phone}
              onChangeText={text => setFormData({ ...formData, phone: text })}
              error={errors.phone}
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <Input
              label="Dirección (Opcional)"
              placeholder="Dirección del cliente"
              value={formData.address}
              onChangeText={text => setFormData({ ...formData, address: text })}
              icon="location-outline"
            />

            <Input
              label="Acrónimo (Opcional)"
              placeholder="Ej: JPG, HMS"
              value={formData.acronym}
              onChangeText={text => setFormData({ ...formData, acronym: text.toUpperCase() })}
              maxLength={5}
              autoCapitalize="characters"
              icon="pricetag-outline"
            />

            <Text className="text-sm text-gray-500 mb-6">* Campos requeridos</Text>

            <View className="space-y-3">
              <Button
                title="Registrar Cliente"
                onPress={handleSubmit}
                isLoading={createClient.isPending}
                fullWidth
                size="lg"
                icon={<Icon name="checkmark-circle-outline" size={20} color="white" />}
              />

              <Button
                title="Cancelar"
                onPress={() => navigation.goBack()}
                variant="outline"
                fullWidth
                disabled={createClient.isPending}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};
