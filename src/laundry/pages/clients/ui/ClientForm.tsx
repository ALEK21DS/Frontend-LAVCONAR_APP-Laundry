import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Input, Button } from '@/components/common';
import { CreateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import { validateClientData } from '@/helpers/validators.helper';

interface ClientFormProps {
  initialValues?: Partial<CreateClientDto>;
  submitting?: boolean;
  onSubmit: (data: CreateClientDto) => Promise<void> | void;
  onCancel?: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  initialValues,
  submitting,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateClientDto>({
    name: initialValues?.name ?? '',
    email: initialValues?.email ?? '',
    identification_number: initialValues?.identification_number ?? '',
    phone: initialValues?.phone ?? '',
    address: initialValues?.address ?? '',
    acronym: initialValues?.acronym ?? '',
    branch_office_id: initialValues?.branch_office_id,
  });

  const handleSubmit = async () => {
    const validation = validateClientData(formData);
    if (!validation.isValid) {
      Alert.alert('Error de validación', validation.error);
      return;
    }
    await Promise.resolve(onSubmit(formData));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <View className="flex-1">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="mb-6">
            <Text className="text-base text-gray-600 mb-6">Completa la información del cliente</Text>

            <Input
              label="Nombre Completo *"
              placeholder="Nombre completo del cliente"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />

            <Input
              label="Email *"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChangeText={text => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Cédula/RUC *"
              placeholder="Número de identificación"
              value={formData.identification_number}
              onChangeText={text => setFormData({ ...formData, identification_number: text })}
              keyboardType="numeric"
            />

            <Input
              label="Teléfono (Opcional)"
              placeholder="Número de teléfono"
              value={formData.phone}
              onChangeText={text => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <Input
              label="Dirección (Opcional)"
              placeholder="Dirección del cliente"
              value={formData.address}
              onChangeText={text => setFormData({ ...formData, address: text })}
            />

            <Input
              label="Acrónimo (Opcional)"
              placeholder="Ej: LAVCONAR"
              value={formData.acronym}
              onChangeText={text => setFormData({ ...formData, acronym: text })}
              autoCapitalize="characters"
            />
          </View>

          <View className="h-3" />
          <Button title="Guardar" onPress={handleSubmit} isLoading={!!submitting} fullWidth size="md" />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};


