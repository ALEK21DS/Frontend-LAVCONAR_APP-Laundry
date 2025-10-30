import React, { useMemo, useState, useEffect } from 'react';
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
import { useCreateGuide, useCreateGuideGarment } from '@/laundry/hooks/guides';
import { useGuideGarmentsByGuide } from '@/laundry/hooks/guides/guide-garments';
import { useGetRfidScanByGuide } from '@/laundry/hooks/guides/rfid-scan';
import { GuideDetailForm } from './GuideDetailForm';
import { isValidDate, sanitizeNumericInput, sanitizeDecimalInput, isNonNegative, safeParseInt, safeParseFloat } from '@/helpers/validators.helper';
import { translateEnum } from '@/helpers';
import { useVehicles } from '@/laundry/hooks/vehicles';
import { VehicleSelectionModal } from '@/laundry/components';

type Option = { label: string; value: string };

interface GuideFormProps {
  clientOptions: Option[];
  selectedClientId?: string;
  onChangeClient: (id: string) => void;
  guideItems: GuideItem[];
  onRemoveItem: (epc: string) => void;
  onScan: () => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitting?: boolean;
  showScanButton?: boolean;
  isScanning?: boolean;
  onNavigate?: (route: string, params?: any) => void;
  // Valores iniciales opcionales
  initialServiceType?: string;
  initialTotalWeight?: number;
  unregisteredCount?: number;
  // Datos de la guía para modo edición
  guideToEdit?: any;
}

export const GuideForm: React.FC<GuideFormProps> = ({
  clientOptions,
  selectedClientId,
  onChangeClient,
  guideItems,
  onRemoveItem,
  onScan,
  onSubmit,
  onCancel,
  submitting,
  showScanButton = true,
  isScanning = false,
  onNavigate,
  initialServiceType = '',
  initialTotalWeight = 0,
  unregisteredCount = 0,
  guideToEdit,
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
  const [totalWeight, setTotalWeight] = useState<string>(initialTotalWeight > 0 ? initialTotalWeight.toFixed(2) : '');
  // Estado inicial según tipo de servicio
  const getInitialStatus = () => {
    return initialServiceType === 'PERSONAL' ? GUIDE_STATUS.SENT : GUIDE_STATUS.COLLECTED;
  };
  const [status, setStatus] = useState<string>(getInitialStatus());
  const [notes, setNotes] = useState<string>('');
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [savedGuideData, setSavedGuideData] = useState<any>(null);

  // Nuevos campos basados en las imágenes y schema
  const [servicePriority, setServicePriority] = useState<string>('NORMAL');
  const [washingType, setWashingType] = useState<string>('');
  
  // Personal involucrado
  const [deliveredBy, setDeliveredBy] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  
  // Gestión de paquetes
  const [totalBundlesExpected, setTotalBundlesExpected] = useState<string>('');
  const [totalBundlesReceived, setTotalBundlesReceived] = useState<string>('');
  const [bundlesDiscrepancy, setBundlesDiscrepancy] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const { createClientAsync, isCreating } = useCreateClient();
  const { createGuideAsync, isCreating: isCreatingGuide } = useCreateGuide();
  const { createGuideGarmentAsync, isCreating: isCreatingGuideGarment } = useCreateGuideGarment();
  
  // Obtener lista de vehículos (solo para servicio industrial)
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles({ 
    limit: 50,
    enabled: serviceType === 'INDUSTRIAL'
  });

  // Obtener detalles de las prendas de la guía en modo edición (para mostrar info)
  const { data: guideGarmentsData, isLoading: isLoadingGarments } = useGuideGarmentsByGuide(
    guideToEdit?.id || '',
    !!guideToEdit?.id
  );
  
  // Obtener los RFIDs escaneados de la guía en modo edición
  const { rfidScan } = useGetRfidScanByGuide(
    guideToEdit?.id || '',
    !!guideToEdit?.id
  );
  
  // El backend puede devolver un objeto único o un array de garments, normalizarlo a array
  const existingGarments = useMemo(() => {
    if (!guideGarmentsData?.data) return [];
    return Array.isArray(guideGarmentsData.data) 
      ? guideGarmentsData.data 
      : [guideGarmentsData.data];
  }, [guideGarmentsData]);
  
  // Extraer los RFIDs escaneados del rfid_scan
  const existingRfids = useMemo(() => {
    if (!rfidScan) return [];
    return rfidScan.scanned_rfid_codes || [];
  }, [rfidScan]);
  
  // En modo edición, usar el número de RFIDs existentes; en creación, usar guideItems
  const totalGarments = useMemo(() => {
    return guideToEdit ? existingRfids.length : guideItems.length;
  }, [guideToEdit, existingRfids.length, guideItems.length]);

  // Cargar datos de la guía en modo edición
  useEffect(() => {
    if (guideToEdit) {
      
      // Convertir fecha ISO a formato dd/mm/yyyy
      const formatISOToDisplay = (isoDate: string): string => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      setServiceType(guideToEdit.service_type || '');
      setChargeType(guideToEdit.charge_type || 'BY_WEIGHT');
      setCondition(guideToEdit.general_condition || 'REGULAR');
      setCollectionDate(formatISOToDisplay(guideToEdit.collection_date));
      setDeliveryDate(formatISOToDisplay(guideToEdit.delivery_date));
      setTotalWeight(guideToEdit.total_weight ? parseFloat(guideToEdit.total_weight).toFixed(2) : '');
      setStatus(guideToEdit.status || '');
      setNotes(guideToEdit.notes || '');
      setSealNumber(guideToEdit.precinct_number || '');
      setServicePriority(guideToEdit.service_priority || 'NORMAL');
      setWashingType(guideToEdit.washing_type || '');
      setDeliveredBy(guideToEdit.delivered_by || '');
      setDriverName(guideToEdit.driver_name || '');
      setVehiclePlate(guideToEdit.vehicle_plate || '');
      setTotalBundlesExpected(guideToEdit.total_bundles_expected?.toString() || '');
      setTotalBundlesReceived(guideToEdit.total_bundles_received?.toString() || '');
      setBundlesDiscrepancy(guideToEdit.bundles_discrepancy?.toString() || '');
      setDepartureTime(guideToEdit.departure_time || '');
      setArrivalTime(guideToEdit.arrival_time || '');
    }
  }, [guideToEdit]);

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

  // Función para formatear peso con máximo 2 decimales
  const formatWeightInput = (text: string): string => {
    // Permitir solo números y un punto decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Si hay más de un punto, quedarse solo con el primero
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join('')}`;
    }
    
    // Limitar a 2 decimales
    if (parts.length === 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    
    return cleaned;
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
      {/* Advertencia para servicio industrial con prendas no registradas */}
      {unregisteredCount > 0 && (
        <View className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <View className="flex-row items-start">
            <Icon name="warning-outline" size={20} color="#F97316" />
            <View className="flex-1 ml-2">
              <Text className="text-sm font-semibold text-orange-900">
                {unregisteredCount} {unregisteredCount === 1 ? 'código no registrado' : 'códigos no registrados'}
              </Text>
              <Text className="text-xs text-orange-700 mt-1">
                Registre las prendas o coloque el peso manualmente
              </Text>
            </View>
          </View>
        </View>
      )}

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
          disabled={!!initialServiceType || !!guideToEdit}
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
              onChangeText={(text) => setTotalWeight(formatWeightInput(text))}
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
            title={guideToEdit ? 'Editar Prendas' : (isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo')}
            onPress={() => {
              // Si estamos en modo edición, SIEMPRE navegar a la página de escaneo
              if (guideToEdit && onNavigate) {
                onNavigate('ScanClothes', {
                  mode: 'guide',
                  serviceType: serviceType === 'PERSONAL' ? 'personal' : 'industrial',
                  guideId: guideToEdit.id,
                  initialRfids: existingRfids, // Usar los RFIDs del rfid_scan
                  guideToEdit, // pasar toda la guía para prefills de edición
                  isEditMode: true,
                });
              } else {
                // Comportamiento normal de escaneo para creación de guía
                onScan();
              }
            }}
            icon={<Icon name={guideToEdit ? 'create-outline' : (isScanning ? 'stop-circle-outline' : 'scan-outline')} size={18} color="white" />}
            fullWidth
            size="sm"
            disabled={!selectedClientId}
            style={{ backgroundColor: '#1f4eed' }}
          />
          {!selectedClientId && !guideToEdit && (
            <Text className="text-sm text-gray-500 mt-2 text-center">Selecciona un cliente para continuar</Text>
          )}
        </View>
      )}

      {/* Prendas Registradas en la Guía (Modo Edición) */}
      {guideToEdit && (
        <View className="mb-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
          <View className="flex-row items-center mb-3">
            <Icon name="shirt-outline" size={20} color="#F59E0B" />
            <Text className="text-base text-amber-800 font-semibold ml-2">
              Códigos RFID Escaneados ({existingRfids.length})
            </Text>
          </View>
          
          {existingRfids.length === 0 ? (
            <View className="items-center py-3">
              <Icon name="information-circle-outline" size={40} color="#F59E0B" />
              <Text className="text-amber-800 font-medium mt-2 text-center text-sm">
                No hay códigos RFID
              </Text>
              <Text className="text-amber-700 text-xs mt-1 text-center px-2">
                Presiona "Editar Prendas" para escanear
              </Text>
            </View>
          ) : (
          
          <ScrollView className="max-h-40">
            {existingRfids.map((rfid: string, index: number) => (
              <View 
                key={rfid} 
                className="bg-white rounded-lg p-3 mb-2 flex-row items-center justify-between border border-amber-300"
              >
                <View className="flex-1">
                  <Text className="text-sm font-mono text-gray-900">
                    {rfid}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Código RFID #{index + 1}
                  </Text>
                </View>
                <View className="bg-green-500 w-8 h-8 rounded-full items-center justify-center">
                  <Icon name="checkmark" size={20} color="#FFFFFF" />
                </View>
              </View>
            ))}
          </ScrollView>
          )}
          
          <Text className="text-xs text-amber-700 mt-3">
            💡 Puedes escanear más prendas para agregarlas a esta guía
          </Text>
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
                onChangeText={(text) => setTotalBundlesExpected(sanitizeNumericInput(text))}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 px-1">
              <Input
                label="Paquetes Recibidos"
                placeholder="0"
                value={totalBundlesReceived}
                onChangeText={(text) => setTotalBundlesReceived(sanitizeNumericInput(text))}
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
                onChangeText={(text) => setBundlesDiscrepancy(sanitizeNumericInput(text))}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 px-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Placa del Vehículo</Text>
              <TouchableOpacity
                onPress={() => setVehicleModalOpen(true)}
                className="bg-purple-500 p-4 rounded-lg flex-row items-center justify-between"
              >
                {vehiclePlate ? (
                  <>
                    <View className="flex-row items-center flex-1">
                      <Icon name="car-outline" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2 text-base">
                        {vehiclePlate}
                      </Text>
                    </View>
                    <Icon name="create-outline" size={20} color="white" />
                  </>
                ) : (
                  <>
                    <View className="flex-row items-center flex-1">
                      <Icon name="car-outline" size={20} color="white" />
                      <Text className="text-white font-medium ml-2">
                        Seleccionar Vehículo
                      </Text>
                    </View>
                    <Icon name="qr-code-outline" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
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
        title={guideToEdit ? 'Editar Guía' : 'Crear Guía'}
        onPress={async () => {
          // Validar campos obligatorios según el esquema de Prisma
          if (!guideToEdit) {
            if (!selectedClientId) {
              Alert.alert('Error', 'Debe seleccionar un cliente');
              return;
            }
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
          
          // Validar que la fecha de recolección sea válida
          if (!isValidDate(collectionDate)) {
            Alert.alert('Error', 'La fecha de recolección no es válida. Use formato dd/mm/aaaa');
            return;
          }
          
          // Validar fecha de entrega si existe
          if (deliveryDate) {
            if (!isValidDate(deliveryDate)) {
              Alert.alert('Error', 'La fecha de entrega no es válida. Use formato dd/mm/aaaa');
              return;
            }
            
            const deliveryDateObj = parseDateFromDisplay(deliveryDate);
            const collectionDateObj = parseDateFromDisplay(collectionDate);
            
            if (deliveryDateObj && collectionDateObj && deliveryDateObj < collectionDateObj) {
              Alert.alert('Error', 'La fecha de entrega no puede ser anterior a la fecha de recolección');
              return;
            }
          }
          
          if (!guideToEdit) {
            if (guideItems.length === 0) {
              Alert.alert('Error', 'Debe escanear al menos una prenda');
              return;
            }
          }
          
          // Normalizar campos numéricos antes de validar
          const totalBundlesExpectedClean = sanitizeNumericInput(totalBundlesExpected);
          const totalBundlesReceivedClean = sanitizeNumericInput(totalBundlesReceived);
          const bundlesDiscrepancyClean = sanitizeNumericInput(bundlesDiscrepancy);
          if (totalBundlesExpected !== totalBundlesExpectedClean) setTotalBundlesExpected(totalBundlesExpectedClean);
          if (totalBundlesReceived !== totalBundlesReceivedClean) setTotalBundlesReceived(totalBundlesReceivedClean);
          if (bundlesDiscrepancy !== bundlesDiscrepancyClean) setBundlesDiscrepancy(bundlesDiscrepancyClean);

          // Validar peso si existe
          if (totalWeight && !isNonNegative(totalWeight)) {
            Alert.alert('Error', 'El peso total debe ser un número válido mayor o igual a 0');
            return;
          }
          
          // Validar campos numéricos opcionales
          if (totalBundlesExpectedClean && !isNonNegative(totalBundlesExpectedClean)) {
            Alert.alert('Error', 'Los bultos esperados deben ser un número válido mayor o igual a 0');
            return;
          }
          if (totalBundlesReceivedClean && !isNonNegative(totalBundlesReceivedClean)) {
            Alert.alert('Error', 'Los bultos recibidos deben ser un número válido mayor o igual a 0');
            return;
          }
          if (bundlesDiscrepancyClean && !isNonNegative(bundlesDiscrepancyClean)) {
            Alert.alert('Error', 'La discrepancia debe ser un número válido mayor o igual a 0');
            return;
          }
          
            // Guardar datos de la guía en memoria (no crear en BD aún)
            const guideData = {
              client_id: selectedClientId,
              branch_office_id: branchOfficeId,
              service_type: serviceType as any,
              charge_type: chargeType as any,
              collection_date: formatDateToISO(collectionDate, true), // Con hora actual
              delivery_date: deliveryDate ? formatDateToISO(deliveryDate, false) : undefined, // Sin hora (00:00)
              general_condition: condition as any,
              status: status as any, // Estado según tipo de servicio (SENT para personal, COLLECTED para industrial)
              total_weight: safeParseFloat(totalWeight),
              total_garments: totalGarments,
              notes: notes || undefined,
              // Campos opcionales numéricos
              total_bundles_expected: safeParseInt(totalBundlesExpectedClean),
              total_bundles_received: safeParseInt(totalBundlesReceivedClean),
              bundles_discrepancy: safeParseInt(bundlesDiscrepancyClean),
            };

            // Guardar en estado y continuar al formulario de detalles
            setSavedGuideData(guideData);
          setShowDetailForm(true);
        }}
        isLoading={isCreatingGuide || !!submitting}
        fullWidth
        size="md"
        disabled={
          guideToEdit
            ? (!collectionDate || !serviceType || !chargeType || !branchOfficeId)
            : (!selectedClientId || !collectionDate || guideItems.length === 0 || !serviceType || !chargeType || !branchOfficeId)
        }
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
              // No hacer nada aquí, solo cerrar y pasar datos al ScanForm
            }}
            onCancel={() => setShowDetailForm(false)}
            submitting={false}
            guideData={savedGuideData}
            initialValues={{ 
              // Pasar datos de la guía principal
              total_weight: totalWeight,
              total_garments: totalGarments,
              // Pasar la sucursal del usuario logueado
              branch_office_id: branchOfficeId,
              branch_office_name: branchOfficeName,
              // Prefill desde el primer detalle existente en modo edición
              ...(guideToEdit && existingGarments.length > 0 ? {
                garment_type: existingGarments[0].garment_type,
                predominant_color: existingGarments[0].predominant_color,
                requested_services: existingGarments[0].requested_services,
                initial_state_description: existingGarments[0].initial_state_desc,
                additional_cost: existingGarments[0].additional_cost ? String(existingGarments[0].additional_cost) : '0',
                observations: existingGarments[0].observations || '',
                label_printed: !!existingGarments[0].label_printed,
                incidents: Array.isArray(existingGarments[0].novelties) ? existingGarments[0].novelties.join(', ') : '',
              } : {})
            }}
            scannedTags={guideToEdit ? existingRfids : guideItems.map(item => item.tagEPC)}
            initialRfidScan={guideToEdit && rfidScan ? {
              scan_type: rfidScan.scan_type,
              location: rfidScan.location,
              differences_detected: rfidScan.differences_detected,
            } : undefined}
            editContext={guideToEdit ? {
              guideId: guideToEdit.id,
              guideGarmentId: existingGarments[0]?.id,
              rfidScanId: rfidScan?.id,
            } : undefined}
            initialGuide={guideToEdit || undefined}
            initialGuideGarment={existingGarments[0] || undefined}
            initialRfidScanFull={rfidScan || undefined}
            onNavigate={onNavigate}
          />
        </View>
      </Modal>

      {/* Modal de Selección de Vehículos */}
      <VehicleSelectionModal
        visible={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        onSelectVehicle={(vehicle) => {
          setSelectedVehicle(vehicle);
          setVehiclePlate(vehicle.plate_number);
          setVehicleModalOpen(false);
        }}
        vehicles={vehicles.map(v => ({
          id: v.id,
          plate_number: v.plate_number,
          brand: v.brand,
          model: v.model,
          year: v.year,
          status: v.status,
          capacity: v.capacity,
        }))}
      />

      </ScrollView>
    </KeyboardAvoidingView>
  );
};


