import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { Button, Card, Input } from '@/components/common';
import { useCreateBundle, useValidateBundleGarments } from '@/laundry/hooks/bundles';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';

interface CreateBundleModalProps {
  visible: boolean;
  onClose: () => void;
  guide: any;
  onSuccess: () => void;
}

export const CreateBundleModal: React.FC<CreateBundleModalProps> = ({
  visible,
  onClose,
  guide,
  onSuccess,
}) => {
  const [scannedTags, setScannedTags] = useState<ScannedTag[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLocation, setScanLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Hooks
  const { createBundleAsync, isCreating } = useCreateBundle();
  const { validateGarmentsAsync, isValidating } = useValidateBundleGarments();

  // Refs para control de escaneo RFID
  const isScanningRef = useRef<boolean>(false);
  const seenSetRef = useRef<Set<string>>(new Set());
  const MIN_RSSI = -65;

  // Limpiar al cerrar
  useEffect(() => {
    if (!visible) {
      stopScanning();
      setScannedTags([]);
      setScanLocation('');
      setNotes('');
      seenSetRef.current.clear();
    }
  }, [visible]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = useCallback(async () => {
    try {
      setIsScanning(false);
      isScanningRef.current = false;
      if ((global as any).rfidSubscription) {
        (global as any).rfidSubscription.remove();
        (global as any).rfidSubscription = null;
      }
      if ((global as any).rfidErrSubscription) {
        (global as any).rfidErrSubscription.remove();
        (global as any).rfidErrSubscription = null;
      }
      try {
        await rfidModule.stopScan();
      } catch (error) {
        // Ignorar errores
      }
    } catch (error) {
      // Ignorar errores
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      isScanningRef.current = true;

      const subscription = rfidModule.addTagListener((tag: ScannedTag) => {
        if (!isScanningRef.current) return;
        if (typeof tag.rssi === 'number' && tag.rssi < MIN_RSSI) return;
        if (seenSetRef.current.has(tag.epc)) return;

        seenSetRef.current.add(tag.epc);
        setScannedTags((prev) => [...prev, tag]);
      });

      (global as any).rfidSubscription = subscription;

      const errSub = rfidModule.addErrorListener((msg: string) => {
        console.warn('RFID error:', msg);
      });
      (global as any).rfidErrSubscription = errSub;

      await rfidModule.startScan();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el escaneo RFID');
      setIsScanning(false);
      isScanningRef.current = false;
    }
  }, []);

  const removeTag = (epc: string) => {
    setScannedTags((prev) => prev.filter((t) => t.epc !== epc));
    seenSetRef.current.delete(epc);
  };

  const handleSubmit = async () => {
    // Validar que haya al menos una prenda
    if (scannedTags.length === 0) {
      Alert.alert('Error', 'Debe escanear al menos una prenda para crear el bulto');
      return;
    }

    try {
      // 1. Primero validar que las prendas pertenezcan a la guía
      const validation = await validateGarmentsAsync({
        guide_id: guide.id,
        rfid_codes: scannedTags.map((t) => t.epc),
      });

      // Verificar prendas inválidas
      if (validation.invalid.length > 0) {
        Alert.alert(
          'Prendas Inválidas',
          `Las siguientes prendas NO pertenecen a esta guía:\n\n${validation.invalid.join('\n')}\n\n¿Desea continuar sin ellas?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
              onPress: () => proceedWithValidPrendas(validation.valid),
            },
          ],
        );
        return;
      }

      // Verificar prendas duplicadas
      if (validation.duplicated.length > 0) {
        Alert.alert(
          'Prendas Duplicadas',
          `Las siguientes prendas ya están en otros bultos:\n\n${validation.duplicated.join('\n')}`,
        );
        return;
      }

      // 2. Si todo es válido, crear el bulto
      await proceedWithValidPrendas(validation.valid);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear bulto';
      Alert.alert('Error', errorMessage);
    }
  };

  const proceedWithValidPrendas = async (validRfids: string[]) => {
    try {
      await createBundleAsync({
        guide_id: guide.id,
        scanned_rfid_codes: validRfids,
        scan_location: scanLocation || undefined,
        notes: notes || undefined,
      });

      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear bulto';
      Alert.alert('Error', errorMessage);
    }
  };

  if (!guide) return null;

  const isProcessing = isCreating || isValidating;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Crear Nuevo Bulto</Text>
            <Text className="text-sm text-gray-600 mt-1">Guía: {guide.guide_number}</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center">
            <IonIcon name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Información de la guía */}
          <Card padding="md" variant="outlined" className="mb-4 bg-gray-50">
            <View className="flex-row items-start">
              <IonIcon name="information-circle-outline" size={20} color="#3B82F6" />
              <View className="ml-2 flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  Cliente: {guide.client_name}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">
                  Total prendas en guía: {guide.total_garments || 0}
                </Text>
              </View>
            </View>
          </Card>

          {/* Botón de Escaneo */}
          <View className="mb-4">
            <Button
              title={isScanning ? 'Detener Escaneo' : 'Iniciar Escaneo RFID'}
              variant={isScanning ? 'danger' : 'primary'}
              icon={<IonIcon name={isScanning ? 'stop-circle-outline' : 'scan-outline'} size={20} color="white" />}
              onPress={() => {
                if (isScanning) {
                  stopScanning();
                } else {
                  startScanning();
                }
              }}
              className="w-full"
            />
          </View>

          {/* Contador de prendas escaneadas */}
          <Card padding="md" variant="outlined" className="mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <IonIcon name="checkbox-outline" size={20} color="#10B981" />
                <Text className="text-sm font-semibold text-gray-900 ml-2">
                  Prendas Escaneadas
                </Text>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-base font-bold text-blue-800">
                  {scannedTags.length}
                </Text>
              </View>
            </View>
          </Card>

          {/* Lista de prendas escaneadas */}
          {scannedTags.length > 0 && (
            <Card padding="none" variant="outlined" className="mb-4">
              <View className="p-3 border-b border-gray-200 bg-gray-50">
                <Text className="text-sm font-semibold text-gray-900">
                  Códigos RFID Escaneados
                </Text>
              </View>
              <ScrollView className="max-h-48">
                {scannedTags.map((tag, index) => (
                  <View
                    key={tag.epc}
                    className="flex-row items-center justify-between px-3 py-2 border-b border-gray-100"
                  >
                    <View className="flex-1">
                      <Text className="text-xs font-mono text-gray-700">
                        {index + 1}. {tag.epc.substring(0, 20)}...
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeTag(tag.epc)} className="ml-2">
                      <IonIcon name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </Card>
          )}

          {/* Campos opcionales */}
          <View className="mb-4">
            <Input
              label="Ubicación (Opcional)"
              placeholder="Ej: Área de clasificación"
              value={scanLocation}
              onChangeText={setScanLocation}
              icon="location-outline"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Notas (Opcional)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900 min-h-[80px]"
              placeholder="Observaciones adicionales sobre el bulto..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Actions */}
        <View className="p-4 border-t border-gray-200 bg-white">
          <View className="flex-row">
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onClose}
              className="flex-1 mr-2"
              disabled={isProcessing}
            />
            <Button
              title="Crear Bulto"
              variant="primary"
              icon={<IonIcon name="save-outline" size={18} color="white" />}
              onPress={handleSubmit}
              className="flex-1 ml-2"
              isLoading={isProcessing}
              disabled={scannedTags.length === 0}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

