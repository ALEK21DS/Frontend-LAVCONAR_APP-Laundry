import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Card, Dropdown, Input } from '@/components/common';
import { GuideItem } from '@/laundry/interfaces/guides/guides.interface';
import { useAuthStore } from '@/auth/store/auth.store';
import { SUCURSALES } from '@/constants';
import { GUIDE_STATUS, GUIDE_STATUS_LABELS, SERVICE_PRIORITIES, WASHING_TYPES } from '@/constants/processes';
import { ClientForm } from '@/laundry/pages/clients/ui/ClientForm';
import { useClients } from '@/laundry/hooks/clients';
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
}) => {
  const { user } = useAuthStore();
  const branchOfficeName = user?.sucursalId || 'Sucursal';

  // Estado local para campos del servicio y fechas
  const [serviceType, setServiceType] = useState<string>('');
  const [chargeType, setChargeType] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [personalEmployee, setPersonalEmployee] = useState<string>('');
  const [transportEmployee, setTransportEmployee] = useState<string>('');
  const [packageManager, setPackageManager] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [branchOfficeId] = useState<string>(user?.sucursalId || '');
  const [sealNumber, setSealNumber] = useState<string>('');
  const [collectionDate, setCollectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [totalWeight, setTotalWeight] = useState<string>('');
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
  const { createClient } = useClients();

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
            <Input label="Fecha de Recolección *" placeholder="dd/mm/aaaa" value={collectionDate} onChangeText={setCollectionDate} />
          </View>
          <View className="flex-1 px-1">
            <Input 
              label="Fecha de Entrega" 
              placeholder="dd/mm/aaaa" 
              value={deliveryDate} 
              onChangeText={(text) => {
                if (text && collectionDate && new Date(text) < new Date(collectionDate)) {
                  Alert.alert('Error', 'La fecha de entrega no puede ser anterior a la fecha de recolección');
                  return;
                }
                setDeliveryDate(text);
              }}
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
        
        {/* Dropdown para seleccionar tipo de servicio */}
        <Dropdown
          label="Tipo de Servicio"
          placeholder="Selecciona un tipo"
          options={[
            { label: 'Industrial', value: 'INDUSTRIAL' },
            { label: 'Personal', value: 'PERSONAL' },
          ]}
          value={serviceType}
          onValueChange={setServiceType}
          icon="cog-outline"
        />

        {/* Campos base que siempre aparecen */}
        <View className="flex-row -mx-1 mt-4">
          <View className="flex-1 px-1">
            <Dropdown
              label="Tipo de Carga"
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
        onPress={() => {
          if (!selectedClientId || !collectionDate || guideItems.length === 0) {
            Alert.alert('Error', 'Por favor completa todos los campos requeridos');
            return;
          }
          // Generar ID único interno para la guía
          const guideId = `GUIDE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          // eslint-disable-next-line no-console
          console.log('Guía creada con ID:', guideId);
          // Pasar directamente al formulario de detalles
          setShowDetailForm(true);
        }}
        isLoading={!!submitting}
        fullWidth
        size="md"
        disabled={!selectedClientId || !collectionDate || guideItems.length === 0}
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
            submitting={createClient.isPending}
            onSubmit={async data => {
              const newClient = await createClient.mutateAsync(data);
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


