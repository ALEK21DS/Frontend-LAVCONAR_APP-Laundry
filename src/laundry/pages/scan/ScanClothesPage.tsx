import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, Alert, NativeModules } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Button, Card } from '@/components/common';
import { EmptyState } from '@/components/ui/empty-state';
import { useGuideStore } from '@/laundry/store/guide.store';
import { useTagStore } from '@/laundry/store/tag.store';
import { rfidModule } from '@/lib/rfid/rfid.module';
import Icon from 'react-native-vector-icons/Ionicons';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';

type ScanClothesPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ScanClothesPage: React.FC<ScanClothesPageProps> = ({ navigation }) => {
  const {} = useGuideStore();
  const { scannedTags, addScannedTag, clearScannedTags, isScanning, setIsScanning } = useTagStore();

  // Ya no se requiere proceso ni descripción para este flujo

  const stopScanning = useCallback(async () => {
    try {
      setIsScanning(false);
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
      } catch {}
    } catch (error) {
      console.error('Error al detener escaneo:', error);
    }
  }, [setIsScanning]);

  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      // eslint-disable-next-line no-console
      console.log('Starting RFID scan...');
      const subscription = rfidModule.addTagListener((tag: ScannedTag) => {
        // eslint-disable-next-line no-console
        console.log('Tag received:', tag);
        addScannedTag(tag);
      });
      (global as any).rfidSubscription = subscription;
      const errSub = rfidModule.addErrorListener((msg: string) => {
        // eslint-disable-next-line no-console
        console.warn('RFID error:', msg);
      });
      (global as any).rfidErrSubscription = errSub;
      await rfidModule.startScan();
      // eslint-disable-next-line no-console
      console.log('RFID scan started');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el escaneo RFID');
      setIsScanning(false);
    }
  }, [addScannedTag, setIsScanning]);

  useEffect(() => {
    clearScannedTags();
    // Debug: listar métodos expuestos por el módulo nativo
    // eslint-disable-next-line no-console
    console.log('RFIDModule methods:', Object.keys((NativeModules as any).RFIDModule || {}));

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinueToGuides = () => {
    stopScanning();
    if (scannedTags.length === 0) {
      Alert.alert('Sin lecturas', 'Escanea al menos una prenda para continuar.');
      return;
    }
    navigation.navigate('Guides' as never);
  };

  const renderScannedTag = ({ item, index }: { item: ScannedTag; index: number }) => (
    <Card variant="outlined" className="mb-2">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center">
            <View className="bg-primary-DEFAULT w-8 h-8 rounded-full items-center justify-center mr-3">
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
        <Icon name="checkmark-circle" size={24} color="#10B981" />
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
        <Text className="text-2xl font-bold text-gray-900 ml-2">Escanear Prendas</Text>
      </View>

      <View className="mb-6">
        {!isScanning ? (
          <Button
            title="Iniciar Escaneo"
            onPress={startScanning}
            icon={<Icon name="play-outline" size={20} color="white" />}
            fullWidth
            size="lg"
            style={{ backgroundColor: '#1f4eed' }}
          />
        ) : (
          <Button
            title="Detener Escaneo"
            onPress={stopScanning}
            variant="danger"
            icon={<Icon name="stop-outline" size={20} color="white" />}
            fullWidth
            size="lg"
          />
        )}

        {isScanning && (
          <View className="mt-4 bg-primary-DEFAULT/10 border border-primary-DEFAULT/20 rounded-lg p-4">
            <View className="flex-row items-center justify-center">
              <Icon name="radio-outline" size={20} color="#3B82F6" />
              <Text className="text-primary-DEFAULT font-semibold ml-2">Escaneando...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Sección de proceso/descrición eliminada para flujo simplificado */}

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
            title={`Continuar (${scannedTags.length})`}
            onPress={handleContinueToGuides}
            fullWidth
            size="lg"
            icon={<Icon name="arrow-forward-circle-outline" size={20} color="white" />}
          />

          <Button title="Limpiar Lista" onPress={clearScannedTags} variant="outline" fullWidth />
        </View>
      )}
    </Container>
  );
};
