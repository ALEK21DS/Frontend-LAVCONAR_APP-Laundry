import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Input, Button, Card, Dropdown } from '@/components/common';
import { CreateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import { validateClientData } from '@/helpers/validators.helper';
import { useAuthStore } from '@/auth/store/auth.store';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { isSuperAdminUser } from '@/helpers/user.helper';

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
  const isSuperAdmin = isSuperAdminUser(user);
  
  const userBranchOfficeId = user?.branch_office_id || user?.sucursalId;
  
  // Estado para sucursal seleccionada (para superadmin puede seleccionar, para admin usa la del usuario)
  const [selectedBranchOfficeId, setSelectedBranchOfficeId] = useState<string>(
    initialValues?.branch_office_id || userBranchOfficeId || ''
  );
  
  // La sucursal final: para superadmin es la seleccionada, para admin es la del usuario
  const branchOfficeId = isSuperAdmin ? selectedBranchOfficeId : userBranchOfficeId;
  
  // Buscar el nombre de la sucursal en la lista de sucursales
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';
  
  // Opciones de sucursales para el dropdown (solo para superadmin)
  const branchOfficeOptions = useMemo(() => {
    return sucursales.map(branch => ({
      label: branch.name,
      value: branch.id,
    }));
  }, [sucursales]);
  
  // Obtener catálogo de tipos de servicio
  const { data: serviceTypeCatalog } = useCatalogValuesByType('service_type', true, { forceFresh: true });
  
  const SERVICE_TYPE_OPTIONS = useMemo(() => {
    return (serviceTypeCatalog?.data || [])
      .filter(v => v.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(v => ({ label: v.label, value: v.code }));
  }, [serviceTypeCatalog]);
  
  const [formData, setFormData] = useState<CreateClientDto>({
    name: initialValues?.name ?? '',
    email: initialValues?.email ?? '',
    identification_number: initialValues?.identification_number ?? '',
    phone: initialValues?.phone ?? '',
    address: initialValues?.address ?? '',
    acronym: initialValues?.acronym ?? '',
    service_type: initialValues?.service_type ?? '',
    branch_office_id: initialValues?.branch_office_id || selectedBranchOfficeId || branchOfficeId,
  });
  
  // Sincronizar formData.branch_office_id con selectedBranchOfficeId cuando cambia
  useEffect(() => {
    setFormData(prev => ({ ...prev, branch_office_id: selectedBranchOfficeId || branchOfficeId }));
  }, [selectedBranchOfficeId, branchOfficeId]);
  
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
      case 'service_type':
        if (!value.trim()) {
          newErrors.service_type = 'El tipo de servicio es requerido';
        } else {
          delete newErrors.service_type;
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

    if (!formData.service_type.trim()) {
      tempErrors.service_type = 'El tipo de servicio es requerido';
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

            {/* Campo de Sucursal - Seleccionable para superadmin, solo lectura para admin */}
            {isSuperAdmin ? (
              <View className="mb-4">
                <Dropdown
                  label="Sucursal *"
                  placeholder="Selecciona una sucursal"
                  options={branchOfficeOptions}
                  value={selectedBranchOfficeId || ''}
                  onValueChange={(value) => {
                    setSelectedBranchOfficeId(value);
                  }}
                  icon="business-outline"
                />
              </View>
            ) : (
              <View className="mb-4">
                <Text className="text-base font-semibold text-gray-700 mb-2">Sucursal</Text>
                <Card padding="md" variant="outlined">
                  <View className="flex-row items-center">
                    <Icon name="business-outline" size={20} color="#6B7280" />
                    <Text className="text-base text-gray-900 ml-2">{branchOfficeName}</Text>
                  </View>
                </Card>
              </View>
            )}

            <Dropdown
              label="Tipo de Servicio *"
              placeholder="Selecciona un tipo de servicio"
              options={SERVICE_TYPE_OPTIONS}
              value={formData.service_type}
              onValueChange={value => {
                setFormData({ ...formData, service_type: value });
                validateField('service_type', value);
              }}
              error={errors.service_type}
            />

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


