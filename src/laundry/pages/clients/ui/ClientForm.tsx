import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Input, Button, Card } from '@/components/common';
import { CreateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import { validateClientData } from '@/helpers/validators.helper';
import { useAuthStore } from '@/auth/store/auth.store';

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
  const { user } = useAuthStore();
  const branchOfficeId = user?.sucursalId;
  const branchOfficeName = branchOfficeId || 'Sucursal no asignada';
  
  const [formData, setFormData] = useState<CreateClientDto>({
    name: initialValues?.name ?? '',
    email: initialValues?.email ?? '',
    identification_number: initialValues?.identification_number ?? '',
    phone: initialValues?.phone ?? '',
    address: initialValues?.address ?? '',
    acronym: initialValues?.acronym ?? '',
    branch_office_id: initialValues?.branch_office_id || branchOfficeId,
  });
  
  const [isActive, setIsActive] = useState<boolean>((initialValues as any)?.is_active ?? true);

  const handleSubmit = async () => {
    const validation = validateClientData(formData);
    if (!validation.isValid) {
      Alert.alert('Error de validación', validation.error);
      return;
    }
    // Incluir el estado en los datos enviados
    const dataToSubmit = { ...formData, is_active: isActive };
    await Promise.resolve(onSubmit(dataToSubmit as CreateClientDto));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <View className="flex-1">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="mb-6">
            <Text className="text-base text-gray-600 mb-6">Completa la información del cliente</Text>

            <Input
              label="Nombre *"
              placeholder="Nombre completo del cliente"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />

            {/* Campo de Sucursal - Solo lectura */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-700 mb-2">Sucursal</Text>
              <Card padding="md" variant="outlined">
                <View className="flex-row items-center">
                  <Icon name="business-outline" size={20} color="#6B7280" />
                  <Text className="text-base text-gray-900 ml-2">{branchOfficeName}</Text>
                </View>
              </Card>
            </View>

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

            {/* Campo de Estado - Interactivo */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-700 mb-2">Estado</Text>
              <TouchableOpacity
                onPress={() => setIsActive(!isActive)}
                activeOpacity={0.7}
              >
                <Card 
                  padding="md" 
                  variant="outlined"
                  className={isActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: isActive ? '#10b981' : '#6B7280' }}
                      >
                        <Icon 
                          name={isActive ? 'checkmark-circle' : 'close-circle'} 
                          size={24} 
                          color="white" 
                        />
                      </View>
                      <View className="ml-3">
                        <Text className={`text-base font-semibold ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {isActive ? 'El cliente puede realizar operaciones' : 'El cliente no puede realizar operaciones'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </View>

          <View className="h-3" />
          <Button title="Guardar" onPress={handleSubmit} isLoading={!!submitting} fullWidth size="md" />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};


