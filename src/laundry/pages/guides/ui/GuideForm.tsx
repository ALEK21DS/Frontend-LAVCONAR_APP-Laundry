import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Card, Dropdown, Input } from '@/components/common';
import { GuideItem } from '@/laundry/interfaces/guides/guides.interface';
import { useAuthStore } from '@/auth/store/auth.store';
import { SUCURSALES } from '@/constants';
import { GUIDE_STATUS, GUIDE_STATUS_LABELS } from '@/constants/processes';
import { ClientForm } from '@/laundry/pages/clients/ui/ClientForm';
import { useClients } from '@/laundry/hooks/useClients';

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
}) => {
  const { user } = useAuthStore();
  const branchOfficeName = user?.branch_office_name || 'Sucursal';

  // Estado local para campos del servicio y fechas
  const [serviceType, setServiceType] = useState<string>('');
  const [chargeType, setChargeType] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [branchOfficeId] = useState<string>(user?.branch_office_id || '');
  const [sealNumber, setSealNumber] = useState<string>('');
  const [collectionDate, setCollectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [totalWeight, setTotalWeight] = useState<string>('');
  const totalGarments = guideItems.length;
  const [status, setStatus] = useState<string>(GUIDE_STATUS.COLLECTED);
  const [notes, setNotes] = useState<string>('');
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const { createClient } = useClients();
  const renderItem = ({ item }: { item: GuideItem }) => (
    <Card variant="outlined" className="mb-3">
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-sm font-mono text-gray-700">{item.tagEPC}</Text>
          {item.proceso && (
            <Text className="text-xs text-gray-500 mt-1">Proceso: {item.proceso}</Text>
          )}
          {item.descripcion && (
            <Text className="text-xs text-gray-500 mt-1">{item.descripcion}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => onRemoveItem(item.tagEPC)} className="p-2">
          <Icon name="close-circle-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
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
        <View className="flex-row -mx-1">
          <View className="flex-1 px-1">
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
          </View>
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
        <Dropdown
          label="Estado"
          placeholder="Selecciona un estado"
          options={Object.keys(GUIDE_STATUS_LABELS).map(k => ({ label: GUIDE_STATUS_LABELS[k as keyof typeof GUIDE_STATUS_LABELS], value: k }))}
          value={status}
          onValueChange={setStatus}
          icon="radio-button-on-outline"
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

      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-3">Prendas ({guideItems.length})</Text>
        {guideItems.length === 0 ? (
          <Card padding="md" className="items-center">
            <Text className="text-gray-500">No hay prendas agregadas</Text>
          </Card>
        ) : (
          <FlatList
            data={guideItems}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.tagEPC}-${index}`}
            scrollEnabled={false}
          />
        )}
      </View>

      <Input
        label="Notas"
        placeholder="Información adicional sobre la guía..."
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
          // Simular creación exitosa
          Alert.alert('Éxito', 'Guía creada correctamente', [
            {
              text: 'OK',
              onPress: () => {
                onSubmit();
              }
            }
          ]);
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


