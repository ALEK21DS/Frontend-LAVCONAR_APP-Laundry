import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Input, Button, Card } from '@/components/common';
import { CreateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import { validateClientData } from '@/helpers/validators.helper';
import { useAuthStore } from '@/auth/store/auth.store';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';

interface ClientFormProps {
  initialValues?: Partial<CreateClientDto>;
  submitting?: boolean;
  onSubmit: (data: CreateClientDto) => Promise<void> | void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  initialValues,
  submitting,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();
  
  const branchOfficeId = user?.branch_office_id || user?.sucursalId;
  
  // Buscar el nombre de la sucursal en la lista de sucursales
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';
  
  const [formData, setFormData] = useState<CreateClientDto>({
    name: initialValues?.name ?? '',
    email: initialValues?.email ?? '',
    identification_number: initialValues?.identification_number ?? '',
    phone: initialValues?.phone ?? '',
    address: initialValues?.address ?? '',
    acronym: initialValues?.acronym ?? '',
    branch_office_id: initialValues?.branch_office_id || branchOfficeId,
  });
  
  const initialActive = typeof (initialValues as any)?.status === 'string'
    ? ((initialValues as any).status === 'ACTIVE')
    : (initialValues as any)?.is_active ?? true;
  const [isActive, setIsActive] = useState<boolean>(initialActive);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'El nombre es requerido';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'El email no es válido';
        } else {
          delete newErrors.email;
        }
        break;
      case 'identification_number':
        if (!value.trim()) {
          newErrors.identification_number = 'La cédula/RUC es requerida';
        } else if (!/^\d+$/.test(value)) {
          newErrors.identification_number = 'Solo números';
        } else {
          delete newErrors.identification_number;
        }
        break;
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'El teléfono es requerido';
        } else if (!/^\d+$/.test(value)) {
          newErrors.phone = 'Solo números';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'address':
        if (!value.trim()) {
          newErrors.address = 'La dirección es requerida';
        } else {
          delete newErrors.address;
        }
        break;
      case 'acronym':
        if (!value.trim()) {
          newErrors.acronym = 'El acrónimo es requerido';
        } else {
          delete newErrors.acronym;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    // Crear un objeto de errores temporal para validar todos los campos
    const tempErrors: Record<string, string> = {};
    
    // Validar cada campo
    if (!formData.name.trim()) {
      tempErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      tempErrors.email = 'El email no es válido';
    }

    if (!formData.identification_number.trim()) {
      tempErrors.identification_number = 'La cédula/RUC es requerida';
    } else if (!/^\d+$/.test(formData.identification_number)) {
      tempErrors.identification_number = 'Solo números';
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d+$/.test(formData.phone)) {
      tempErrors.phone = 'Solo números';
    }

    if (!formData.address.trim()) {
      tempErrors.address = 'La dirección es requerida';
    }

    if (!formData.acronym.trim()) {
      tempErrors.acronym = 'El acrónimo es requerido';
    }

    // Actualizar los errores
    setErrors(tempErrors);

    // Si hay errores, no enviar
    if (Object.keys(tempErrors).length > 0) {
      return;
    }

    // Asegurar sucursal obligatoria
    if (!formData.branch_office_id) {
      Alert.alert('Sucursal requerida', 'No se encontró la sucursal del usuario. Vuelve a iniciar sesión.');
      return;
    }

    // Normalización básica
    const cleanDigits = (v: string) => v.replace(/\D/g, '');
    const dataToSubmit = {
      ...formData,
      phone: cleanDigits(formData.phone),
      identification_number: cleanDigits(formData.identification_number),
      status: (isActive ? 'ACTIVE' : 'INACTIVE') as any,
    };
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
              onChangeText={text => {
                setFormData({ ...formData, name: text });
                validateField('name', text);
              }}
              error={errors.name}
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
              onChangeText={text => {
                setFormData({ ...formData, email: text });
                validateField('email', text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Cédula/RUC *"
              placeholder="Número de identificación"
              value={formData.identification_number}
              onChangeText={text => {
                const onlyDigits = text.replace(/[^0-9]/g, '');
                setFormData({ ...formData, identification_number: onlyDigits });
                validateField('identification_number', text);
              }}
              keyboardType="numeric"
              error={errors.identification_number}
            />

            <Input
              label="Teléfono *"
              placeholder="Número de teléfono"
              value={formData.phone}
              onChangeText={text => {
                const onlyDigits = text.replace(/[^0-9]/g, '');
                setFormData({ ...formData, phone: onlyDigits });
                validateField('phone', text);
              }}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Input
              label="Dirección *"
              placeholder="Dirección del cliente"
              value={formData.address}
              onChangeText={text => {
                setFormData({ ...formData, address: text });
                validateField('address', text);
              }}
              error={errors.address}
            />

            <Input
              label="Acrónimo *"
              placeholder="Ej: LAVCONAR"
              value={formData.acronym}
              onChangeText={text => {
                setFormData({ ...formData, acronym: text });
                validateField('acronym', text);
              }}
              autoCapitalize="characters"
              error={errors.acronym}
            />

            {/* Campo de Estado - Visible en crear y editar (por defecto ACTIVO) */}
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
          <Button 
            title="Guardar" 
            onPress={handleSubmit} 
            isLoading={!!submitting} 
            fullWidth 
            size="md" 
            disabled={!!submitting || Object.keys(errors).length > 0}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};


