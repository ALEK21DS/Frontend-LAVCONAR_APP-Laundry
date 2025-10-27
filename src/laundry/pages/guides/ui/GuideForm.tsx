import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Card, Dropdown, Input } from '@/components/common';
import { GuideItem } from '@/laundry/interfaces/guides/guides.interface';
import { useAuthStore } from '@/auth/store/auth.store';
import { SUCURSALES } from '@/constants';
import { GUIDE_STATUS, GUIDE_STATUS_LABELS, SERVICE_PRIORITIES, WASHING_TYPES } from '@/constants/processes';
import { ClientForm } from '@/laundry/pages/clients/ui/ClientForm';
import { useCreateClient } from '@/laundry/hooks/clients';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useCreateGuide } from '@/laundry/hooks/guides';
import { GuideDetailForm } from './GuideDetailForm';

type Option = { label: string; value: string };

interface GuideFormProps {
  clientOptions: Option[];
  selectedClientId?: string;
  onChangeClient: (id: string) => void;
  guideItems: GuideItem[];
  onRemoveItem: (epc: string) => void;
  onScan: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  showScanButton?: boolean;
  isScanning?: boolean;
  onNavigate?: (route: string, params?: any) => void;
  // Valores iniciales opcionales
  initialServiceType?: string;
  initialTotalWeight?: number;
}

export const GuideForm: React.FC<GuideFormProps> = ({
  clientOptions,
  selectedClientId,
  onChangeClient,
  guideItems,
  onRemoveItem,
  onScan,
  onSubmit,
  submitting,
  showScanButton = true,
  isScanning = false,
  onNavigate,
  initialServiceType = '',
  initialTotalWeight = 0,
}) => {
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();
  
  // Obtener la sucursal del usuario logueado
  const branchOfficeId = user?.branch_office_id || user?.sucursalId || '';
  
  // Buscar el nombre de la sucursal en la lista de sucursales
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';

  // Estado local para campos del servicio y fechas
  const [serviceType, setServiceType] = useState<string>(initialServiceType);
  const [chargeType, setChargeType] = useState<string>('BY_WEIGHT'); // Valor por defecto según Prisma
  const [condition, setCondition] = useState<string>('REGULAR'); // Valor por defecto según Prisma
  const [personalEmployee, setPersonalEmployee] = useState<string>('');
  const [transportEmployee, setTransportEmployee] = useState<string>('');
  const [packageManager, setPackageManager] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [sealNumber, setSealNumber] = useState<string>('');
  // Formatear fecha actual a dd/mm/yyyy
  const formatDateToDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [collectionDate, setCollectionDate] = useState<string>(formatDateToDisplay(new Date()));
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [totalWeight, setTotalWeight] = useState<string>(initialTotalWeight > 0 ? initialTotalWeight.toString() : '');
  const totalGarments = guideItems.length;
  const [status, setStatus] = useState<string>(GUIDE_STATUS.RECEIVED);
  const [notes, setNotes] = useState<string>('');
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [showDetailForm, setShowDetailForm] = useState(false);

  // Nuevos campos basados en las imágenes y schema
  const [servicePriority, setServicePriority] = useState<string>('NORMAL');
  const [washingType, setWashingType] = useState<string>('');
  
  // Personal involucrado
  const [deliveredBy, setDeliveredBy] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  
  // Gestión de paquetes
  const [totalBundlesExpected, setTotalBundlesExpected] = useState<string>('0');
  const [totalBundlesReceived, setTotalBundlesReceived] = useState<string>('0');
  const [bundlesDiscrepancy, setBundlesDiscrepancy] = useState<string>('0');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const { createClientAsync, isCreating } = useCreateClient();
  const { createGuideAsync, isCreating: isCreatingGuide } = useCreateGuide();

  // Función para formatear fecha mientras se escribe (dd/mm/yyyy)
  const formatDateInput = (text: string): string => {
    // Remover todo lo que no sea número
    const numbers = text.replace(/\D/g, '');
    
    // Limitar a 8 dígitos (ddmmyyyy)
    const limited = numbers.slice(0, 8);
    
    // Agregar slashes automáticamente
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  // Función para convertir dd/mm/yyyy a Date para validación
  const parseDateFromDisplay = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length < 10) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Función para convertir dd/mm/yyyy a ISO string para el backend
  // Usa la hora actual para la fecha de recolección
  const formatDateToISO = (dateStr: string, useCurrentTime: boolean = true): string => {
    const dateObj = parseDateFromDisplay(dateStr);
    if (!dateObj) return '';
    
    if (useCurrentTime) {
      // Usar la hora actual para la fecha
      const now = new Date();
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }
    
    return dateObj.toISOString();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Información Básica */}
      <View className="mb-6">
        <Text className="text-base text-gray-700 font-semibold mb-2">Información Básica</Text>
        <Input 
          label="Número de Precinto" 
          placeholder="Ej: SEAL-2024-001"
          value={sealNumber} 
          onChangeText={setSealNumber}
        />
        <Input label="Sucursal" value={branchOfficeName} editable={false} className="mt-3" />
        <View className="flex-row mt-3 -mx-1">
          <View className="flex-1 px-1">
            <Input 
              label="Fecha de Recolección *" 
              placeholder="dd/mm/aaaa" 
              value={collectionDate} 
              onChangeText={(text) => setCollectionDate(formatDateInput(text))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <View className="flex-1 px-1">
            <Input 
              label="Fecha de Entrega" 
              placeholder="dd/mm/aaaa" 
              value={deliveryDate} 
              onChangeText={(text) => setDeliveryDate(formatDateInput(text))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>
      </View>

      <View className="mb-6">
        <Dropdown
          label="Cliente *"
          placeholder="Selecciona un cliente"
          options={clientOptions}
          value={selectedClientId || ''}
          onValueChange={onChangeClient}
          icon="person-outline"
          searchable
        />
        <View className="mt-2">
          <Button
            title="Registrar Nuevo Cliente"
            variant="outline"
            size="sm"
            onPress={() => setClientModalOpen(true)}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-base text-gray-700 font-semibold mb-2">Información del Servicio</Text>
        
        {/* Dropdown para seleccionar tipo de servicio - Deshabilitado porque ya se seleccionó antes */}
        <Dropdown
          label="Tipo de Servicio *"
          placeholder="Selecciona un tipo"
          options={[
            { label: 'Industrial', value: 'INDUSTRIAL' },
            { label: 'Personal', value: 'PERSONAL' },
          ]}
          value={serviceType}
          onValueChange={setServiceType}
          icon="cog-outline"
          disabled={!!initialServiceType}
        />

        {/* Campos base que siempre aparecen */}
        <View className="flex-row -mx-1 mt-4">
          <View className="flex-1 px-1">
            <Dropdown
              label="Tipo de Carga *"
              placeholder="Selecciona un tipo"
              options={[
                { label: 'Por prenda', value: 'BY_UNIT' },
                { label: 'Por peso', value: 'BY_WEIGHT' },
              ]}
              value={chargeType}
              onValueChange={setChargeType}
              icon="cube-outline"
            />
          </View>
        </View>
        
        <Dropdown
          label="Condición General"
          placeholder="Selecciona la condición"
          options={[
            { label: 'Excelente', value: 'EXCELLENT' },
            { label: 'Buena', value: 'GOOD' },
            { label: 'Regular', value: 'REGULAR' },
            { label: 'Deficiente', value: 'POOR' },
            { label: 'Dañado', value: 'DAMAGED' },
          ]}
          value={condition}
          onValueChange={setCondition}
          icon="checkmark-circle-outline"
        />

        <View className="flex-row -mx-1 mt-2">
          <View className="flex-1 px-1">
            <Input label="Total Prendas" value={String(totalGarments)} editable={false} />
          </View>
          <View className="flex-1 px-1">
            <Input
              label="Peso Total (kg)"
              placeholder="0.00"
              value={totalWeight}
              onChangeText={setTotalWeight}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <Input
          label="Estado"
          value={GUIDE_STATUS_LABELS[status as keyof typeof GUIDE_STATUS_LABELS] || 'Recibida'}
          editable={false}
          className="bg-gray-50"
        />
      </View>

      {showScanButton && (
        <View className="mb-6">
          <Button
            title={isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo'}
            onPress={onScan}
            icon={<Icon name={isScanning ? 'stop-circle-outline' : 'scan-outline'} size={18} color="white" />}
            fullWidth
            size="sm"
            disabled={!selectedClientId}
            style={isScanning ? { backgroundColor: '#dc2626' } : { backgroundColor: '#1f4eed' }}
          />
          {!selectedClientId && (
            <Text className="text-sm text-gray-500 mt-2 text-center">Selecciona un cliente para continuar</Text>
          )}
        </View>
      )}

      {/* Detalles de Servicio */}
      <View className="mb-6 bg-blue-50 p-4 rounded-lg">
        <Text className="text-base text-blue-800 font-semibold mb-3">Detalles de Servicio</Text>
        <View className="flex-row -mx-1">
          <View className="flex-1 px-1">
            <Dropdown
              label="Prioridad"
              placeholder="Seleccionar prioridad"
              options={SERVICE_PRIORITIES}
              value={servicePriority}
              onValueChange={setServicePriority}
              icon="flag-outline"
            />
          </View>
          <View className="flex-1 px-1">
            <Dropdown
              label="Tipo de Lavado"
              placeholder="Seleccionar tipo de lavado"
              options={WASHING_TYPES}
              value={washingType}
              onValueChange={setWashingType}
              icon="water-outline"
            />
          </View>
        </View>
      </View>

      {/* Campos para Servicio Industrial - Personal de Transporte */}
      {serviceType === 'INDUSTRIAL' && (
        <View className="mb-6 bg-green-50 p-4 rounded-lg">
          <Text className="text-base text-green-800 font-semibold mb-3">Personal de Transporte (Servicio Industrial)</Text>
          <View className="flex-row -mx-1 mb-3">
            <View className="flex-1 px-1">
              <Input
                label="Entregado por"
                placeholder="Nombre del transportista"
                value={deliveredBy}
                onChangeText={setDeliveredBy}
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Recibido por"
                placeholder="Nombre de quien recibe"
                value={receivedBy}
                onChangeText={setReceivedBy}
              />
            </View>
          </View>
          <View className="flex-row -mx-1">
            <View className="flex-1 px-1">
              <Input
                label="Nombre del Conductor"
                placeholder="Nombre del conductor"
                value={driverName}
                onChangeText={setDriverName}
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="ID del Conductor"
                placeholder="Cédula o ID del conductor"
                value={driverId}
                onChangeText={setDriverId}
              />
            </View>
          </View>
        </View>
      )}

      {/* Campos para Servicio Industrial - Gestión de Paquetes */}
      {serviceType === 'INDUSTRIAL' && (
        <View className="mb-6 bg-purple-50 p-4 rounded-lg">
          <Text className="text-base text-purple-800 font-semibold mb-3">Gestión de Paquetes (Servicio Industrial)</Text>
          <View className="flex-row -mx-1 mb-3">
            <View className="flex-1 px-1">
              <Input
                label="Paquetes Esperados"
                placeholder="0"
                value={totalBundlesExpected}
                onChangeText={setTotalBundlesExpected}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Paquetes Recibidos"
                placeholder="0"
                value={totalBundlesReceived}
                onChangeText={setTotalBundlesReceived}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View className="flex-row -mx-1 mb-3">
            <View className="flex-1 px-1">
              <Input
                label="Discrepancia"
                placeholder="0"
                value={bundlesDiscrepancy}
                onChangeText={setBundlesDiscrepancy}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Placa del Vehículo"
                placeholder="ej: ABC-123"
                value={vehiclePlate}
                onChangeText={setVehiclePlate}
              />
            </View>
          </View>
        </View>
      )}

      {/* Campos para Servicio Industrial - Horarios */}
      {serviceType === 'INDUSTRIAL' && (
        <View className="mb-6 bg-yellow-50 p-4 rounded-lg">
          <Text className="text-base text-yellow-800 font-semibold mb-3">Tiempos de Transporte</Text>
          <View className="flex-row -mx-1">
            <View className="flex-1 px-1">
              <Input
                label="Hora de Salida"
                placeholder="dd/mm/aaaa --:--"
                value={departureTime}
                onChangeText={setDepartureTime}
                icon="calendar-outline"
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Hora de Llegada"
                placeholder="dd/mm/aaaa --:--"
                value={arrivalTime}
                onChangeText={setArrivalTime}
                icon="calendar-outline"
              />
            </View>
          </View>
        </View>
      )}

      {/* Campos para Servicio Personal - FUERA del contenedor de Detalles de Servicio */}
      {serviceType === 'PERSONAL' && (
        <View className="mb-6">
          <Card padding="md" className="bg-green-50 border-green-200">
            <Text className="text-base text-green-800 font-semibold mb-3">Personal de Atención (Servicio Personal)</Text>
            <Input
              label="Entregado por"
              placeholder="Empleado que entrega al cliente"
              value={personalEmployee}
              onChangeText={setPersonalEmployee}
              icon="person-outline"
            />
          </Card>
          
          <Card padding="md" className="bg-yellow-50 border-yellow-200 mt-4">
            <Text className="text-base text-yellow-800 font-semibold mb-3">Entrega en Local (Servicio Personal)</Text>
            <Input
              label="Entregado al Cliente en"
              placeholder="dd/mm/aaaa --:--"
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              icon="calendar-outline"
            />
          </Card>
        </View>
      )}

      

      {/* Secciones de servicio antiguo removidas para que los nuevos campos 
          dependientes del dropdown se muestren debajo de Detalles de Servicio */}

      <Input
        label="Notas"
        placeholder="Notas adicionales sobre la guía..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <View className="h-3" />
      <Button
        title="Crear Guía"
        onPress={async () => {
          // Validar campos obligatorios según el esquema de Prisma
          if (!selectedClientId) {
            Alert.alert('Error', 'Debe seleccionar un cliente');
            return;
          }
          if (!branchOfficeId) {
            Alert.alert('Error', 'No se ha asignado una sucursal al usuario');
            return;
          }
          if (!serviceType) {
            Alert.alert('Error', 'Debe seleccionar un tipo de servicio');
            return;
          }
          if (!chargeType) {
            Alert.alert('Error', 'Debe seleccionar un tipo de carga');
            return;
          }
          if (!collectionDate) {
            Alert.alert('Error', 'Debe ingresar la fecha de recolección');
            return;
          }
          if (guideItems.length === 0) {
            Alert.alert('Error', 'Debe escanear al menos una prenda');
            return;
          }
          
          // Validar que la fecha de entrega no sea anterior a la fecha de recolección
          if (deliveryDate && collectionDate) {
            const deliveryDateObj = parseDateFromDisplay(deliveryDate);
            const collectionDateObj = parseDateFromDisplay(collectionDate);
            
            if (deliveryDateObj && collectionDateObj && deliveryDateObj < collectionDateObj) {
              Alert.alert('Error', 'La fecha de entrega no puede ser anterior a la fecha de recolección');
              return;
            }
          }
          
          try {
            // Preparar datos de la guía para el backend
            const guideData = {
              client_id: selectedClientId,
              branch_office_id: branchOfficeId,
              service_type: serviceType as any,
              charge_type: chargeType as any,
              collection_date: formatDateToISO(collectionDate, true), // Con hora actual
              delivery_date: deliveryDate ? formatDateToISO(deliveryDate, false) : undefined, // Sin hora (00:00)
              general_condition: condition as any,
              total_weight: totalWeight ? parseFloat(totalWeight) : undefined,
              total_garments: totalGarments,
              notes: notes || undefined,
            };

            console.log('📤 Enviando guía al backend:', guideData);

            // Crear la guía en el backend
            const createdGuide = await createGuideAsync(guideData);
            
            console.log('✅ Guía creada exitosamente:', createdGuide);
            
            Alert.alert('Éxito', 'Guía creada exitosamente', [
              {
                text: 'OK',
                onPress: () => {
                  // Llamar a onSubmit para cerrar el modal o navegar
                  onSubmit();
                },
              },
            ]);
          } catch (error: any) {
            console.error('❌ Error al crear guía:', error);
            Alert.alert('Error', error.message || 'No se pudo crear la guía');
          }
        }}
        isLoading={isCreatingGuide || !!submitting}
        fullWidth
        size="md"
        disabled={!selectedClientId || !collectionDate || guideItems.length === 0 || !serviceType || !chargeType || !branchOfficeId}
        icon={<Icon name="checkmark-circle-outline" size={18} color="white" />}
      />

      <Modal transparent visible={clientModalOpen} animationType="slide" onRequestClose={() => setClientModalOpen(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl p-4" style={{ elevation: 8 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 flex-1">Nuevo Cliente</Text>
            <TouchableOpacity onPress={() => setClientModalOpen(false)}>
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <ClientForm
            submitting={isCreating}
            onSubmit={async data => {
              const newClient = await createClientAsync(data);
              if (newClient?.id) {
                onChangeClient(newClient.id);
              }
              setClientModalOpen(false);
            }}
            onCancel={() => setClientModalOpen(false)}
          />
        </View>
      </Modal>

      <Modal transparent visible={showDetailForm} animationType="slide" onRequestClose={() => setShowDetailForm(false)}>
        <View className="flex-1 bg-black/40" />
        <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Icon name="document-text-outline" size={20} color="#1f4eed" />
              <Text className="text-xl font-bold text-gray-900 ml-2">Detalle de Guía</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDetailForm(false)} className="ml-auto">
              <Icon name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <View className="px-4 py-2">
            <Text className="text-sm text-gray-600 mb-4">
              Completa los datos para crear un nuevo detalle de guía
            </Text>
          </View>
          <GuideDetailForm
            onSubmit={(data) => {
              console.log('Detalle de guía creado:', data);
              // No cerrar el modal aquí, el ScanForm se abrirá desde GuideDetailForm
            }}
            onCancel={() => setShowDetailForm(false)}
            submitting={false}
            initialValues={{ 
              guide_id: `GUIDE-${Date.now()}`,
              // Pasar datos de la guía principal
              total_weight: totalWeight,
              total_garments: totalGarments,
              // Pasar la sucursal del usuario logueado
              branch_office_id: branchOfficeId,
              branch_office_name: branchOfficeName,
            }}
            scannedTags={guideItems.map(item => item.tagEPC)}
            onNavigate={onNavigate}
          />
        </View>
      </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};


