import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Button, Card, Dropdown } from '@/components/common';
import { EmptyState } from '@/components/ui/empty-state';
import { useTagStore } from '@/laundry/store/tag.store';
import { useUpdateTag } from '@/laundry/hooks/tags';
import { rfidModule } from '@/lib/rfid/rfid.module';
import { PROCESSES } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';
import { SCAN_RANGE_PRESETS, ScanRangeKey } from '@/constants/scanRange';
import { ScanRangeModal } from '@/laundry/components/ScanRangeModal';

type ScanProcessesPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ScanProcessesPage: React.FC<ScanProcessesPageProps> = ({ navigation }) => {
  const { updateTagAsync, isUpdating } = useUpdateTag();
  const {
    scannedTags,
    addScannedTag,
    clearScannedTags,
    isScanning,
    setIsScanning,
    scanRangeKey,
    setScanRangeKey,
  } = useTagStore();

  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const currentRangeConfig = SCAN_RANGE_PRESETS[scanRangeKey];

  const stopScanning = useCallback(async () => {
    try {
      setIsScanning(false);

      if ((global as any).scanInterval) {
        clearInterval((global as any).scanInterval);
        (global as any).scanInterval = null;
      }
    } catch (error) {
      console.error('Error al detener escaneo:', error);
    }
  }, [setIsScanning]);

  const applyReaderPower = useCallback(async () => {
    try {
      console.log('[RFID][Front][Procesos] Aplicando potencia seleccionada:', currentRangeConfig.power);
      await rfidModule.setPower(currentRangeConfig.power);
    } catch (error) {
      console.warn('No se pudo aplicar potencia para procesos:', error);
    }
  }, [currentRangeConfig.power]);

  const startScanning = useCallback(async () => {
    try {
      console.log('[RFID][Front][Procesos] Iniciando escaneo', {
        range: scanRangeKey,
        power: currentRangeConfig.power,
      });
      setIsScanning(true);

      const interval = rfidModule.simulateScan((tag: ScannedTag) => {
        console.log('[RFID][Front][Procesos] Tag simulado', {
          epc: tag.epc,
          rssi: tag.rssi,
          power: currentRangeConfig.power,
          range: currentRangeConfig.label,
        });
        addScannedTag(tag);
      });

      (global as any).scanInterval = interval;
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el escaneo RFID');
      setIsScanning(false);
    }
  }, [addScannedTag, setIsScanning, currentRangeConfig.label, currentRangeConfig.power, scanRangeKey]);

  useEffect(() => {
    clearScannedTags();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyReaderPower();
  }, [applyReaderPower]);

  const handleSelectRange = (key: ScanRangeKey) => {
    const preset = SCAN_RANGE_PRESETS[key];
    console.log('[RFID][Front][Procesos] Rango seleccionado en UI:', {
      key,
      label: preset.label,
      power: preset.power,
    });
    setScanRangeKey(key);
    setIsRangeModalOpen(false);
  };

  const handleAssignProcess = async () => {
    if (!selectedProcess) {
      Alert.alert('Error', 'Debes seleccionar un proceso');
      return;
    }

    if (scannedTags.length === 0) {
      Alert.alert('Error', 'No hay prendas escaneadas');
      return;
    }

    try {
      await Promise.all(
        scannedTags.map(tag =>
          updateTagAsync({
            epc: tag.epc,
            data: { proceso: selectedProcess },
          })
        )
      );

      Alert.alert('Éxito', `Proceso asignado a ${scannedTags.length} prenda(s)`, [
        {
          text: 'Continuar',
          onPress: () => {
            clearScannedTags();
          },
        },
        {
          text: 'Finalizar',
          onPress: () => {
            clearScannedTags();
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo asignar el proceso');
    }
  };

  const renderScannedTag = ({ item, index }: { item: ScannedTag; index: number }) => (
    <Card variant="outlined" className="mb-2">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center">
            <View className="bg-secondary-DEFAULT w-8 h-8 rounded-full items-center justify-center mr-3">
              <Text className="text-white font-bold">{index + 1}</Text>
            </View>
            <View>
              <Text className="text-sm font-mono text-gray-900">{item.epc}</Text>
              {item.rssi && (
                <Text className="text-xs text-gray-500 mt-1">Señal: {item.rssi} dBm</Text>
              )}
            </View>
          </View>
        </View>
        <Icon name="construct-outline" size={24} color="#64748B" />
      </View>
    </Card>
  );

  return (
    <Container safe>
      <View className="flex-row items-center mb-6">
        <Button
          icon={<Icon name="arrow-back-outline" size={24} color="#3B82F6" />}
          variant="ghost"
          size="icon"
          onPress={() => {
            stopScanning();
            navigation.goBack();
          }}
        />
        <Text className="text-lg font-bold text-gray-900 ml-2">ASIGNAR PROCESOS</Text>
      </View>

      <View className="mb-6">
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Button
              title="Escanear"
              onPress={startScanning}
              icon={<Icon name="play-outline" size={20} color="white" />}
              size="md"
              disabled={isScanning}
            />
          </View>
          <View className="flex-1">
            <Button
              title={`Alcance: ${currentRangeConfig.label}`}
              onPress={() => setIsRangeModalOpen(true)}
              variant="outline"
              size="md"
              icon={<Icon name="options-outline" size={18} color="#0b1f36" />}
            />
          </View>
        </View>

        {isScanning && (
          <View className="mt-4 space-y-3">
            <Button
              title="Detener Escaneo"
              onPress={stopScanning}
              variant="danger"
              icon={<Icon name="stop-outline" size={20} color="white" />}
              fullWidth
              size="md"
            />

            <View className="bg-primary-DEFAULT/10 border border-primary-DEFAULT/20 rounded-lg p-4">
              <View className="flex-row items-center justify-center">
                <Icon name="radio-outline" size={20} color="#3B82F6" />
                <Text className="text-primary-DEFAULT font-semibold ml-2">
                  Escaneando con potencia {currentRangeConfig.power} dBm
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className="mb-6">
        <Dropdown
          label="Proceso a Asignar *"
          placeholder="Selecciona un proceso"
          options={PROCESSES}
          value={selectedProcess}
          onValueChange={setSelectedProcess}
          icon="construct-outline"
        />
      </View>

      <View className="flex-1 mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Prendas Escaneadas ({scannedTags.length})
        </Text>

        {scannedTags.length === 0 ? (
          <EmptyState
            icon="scan-outline"
            title="No hay prendas escaneadas"
            message="Inicia el escaneo para detectar tags RFID"
          />
        ) : (
          <FlatList
            data={scannedTags}
            renderItem={renderScannedTag}
            keyExtractor={item => item.epc}
          />
        )}
      </View>

      {scannedTags.length > 0 && (
        <View className="space-y-3">
          <Button
            title={`Asignar Proceso (${scannedTags.length})`}
            onPress={handleAssignProcess}
            isLoading={isUpdating}
            fullWidth
            size="lg"
            icon={<Icon name="checkmark-circle-outline" size={20} color="white" />}
            disabled={!selectedProcess}
          />

          <Button
            title="Limpiar Lista"
            onPress={clearScannedTags}
            variant="outline"
            fullWidth
            disabled={isUpdating}
          />
        </View>
      )}

      <ScanRangeModal
        visible={isRangeModalOpen}
        selectedKey={scanRangeKey}
        onClose={() => setIsRangeModalOpen(false)}
        onSelect={handleSelectRange}
      />
    </Container>
  );
};
