import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { Container, Button, Card } from '@/components/common';
import { GuideStatusConfirmationModal } from '@/laundry/components/GuideStatusConfirmationModal';

type GarmentValidationPageProps = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      guideId: string;
      processType: string;
      scannedTags: string[];
      serviceType?: 'industrial' | 'personal';
    };
  };
};

export const GarmentValidationPage: React.FC<GarmentValidationPageProps> = ({
  navigation,
  route,
}) => {
  const { guideId, processType, scannedTags = [], serviceType = 'industrial' } = route.params;

  // Datos demo de la guía (esto vendrá del backend)
  const [guideData, setGuideData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationResult, setValidationResult] = useState<{
    total: number;
    scanned: number;
    missing: string[];
    extra: string[];
    matched: string[];
  } | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    // Simular carga de datos de la guía desde el backend
    setTimeout(() => {
      // Determinar el estado correcto según el tipo de servicio
      const getCorrectStatus = () => {
        if (serviceType === 'personal') {
          // Para servicio personal: EMPAQUE viene de DOBLADO
          if (processType === 'PACKAGING') return 'FOLDING';
          if (processType === 'LOADING') return 'PACKAGING';
          if (processType === 'DELIVERY') return 'LOADING';
        } else {
          // Para servicio industrial: EMPAQUE viene de SECADO
          if (processType === 'PACKAGING') return 'DRYING';
          if (processType === 'LOADING') return 'PACKAGING';
          if (processType === 'DELIVERY') return 'LOADING';
        }
        return 'DRYING'; // fallback
      };

      // Datos demo
      const mockGuideData = {
        id: guideId,
        guide_number: 'G-0001',
        status: getCorrectStatus(),
        client_name: 'Cliente A',
        total_garments: 10,
        // Tags RFID de las prendas que deberían estar en la guía (tags reales escaneados)
        expected_tags: [
          'E2806915000050248026E48A',
          '686F6C61204D756E646F',
          'E28069150000502480215CD7',
          '686F6C61',
          'E280689400005000000005',
          'E280689400005000000006',
          'E280689400005000000007',
          'E280689400005000000008',
          'E280689400005000000009',
          'E280689400005000000010',
        ],
      };

      setGuideData(mockGuideData);

      // Validar las prendas escaneadas vs las esperadas
      const expectedSet = new Set(mockGuideData.expected_tags);
      const scannedSet = new Set(scannedTags);

      const matched = scannedTags.filter(tag => expectedSet.has(tag));
      const missing = mockGuideData.expected_tags.filter((tag: string) => !scannedSet.has(tag));
      const extra = scannedTags.filter(tag => !expectedSet.has(tag));

      setValidationResult({
        total: mockGuideData.expected_tags.length,
        scanned: scannedTags.length,
        missing,
        extra,
        matched,
      });

      setIsValidating(false);
    }, 1500);
  }, [guideId, scannedTags]);

  const handleContinue = () => {
    setShowConfirmationModal(true);
  };

  const handleConfirmStatusChange = () => {
    // TODO: Actualizar estado en el backend
    setShowConfirmationModal(false);
    navigation.navigate('Dashboard');
  };

  const getNewStatusFromProcess = (processType: string): string => {
    const statusMapping: Record<string, string> = {
      'PACKAGING': 'PACKAGING',
      'LOADING': 'LOADING',
      'DELIVERY': 'DELIVERY',
    };
    return statusMapping[processType] || 'PACKAGING';
  };

  const getProcessLabel = (type: string) => {
    const labels: Record<string, string> = {
      'PACKAGING': 'EMPAQUE',
      'LOADING': 'CARGA',
      'DELIVERY': 'ENTREGA',
    };
    return labels[type] || type;
  };

  const isValidationPerfect = validationResult?.missing.length === 0 && validationResult?.extra.length === 0;

  if (isValidating || !guideData || !validationResult) {
    return (
      <Container safe>
        <View className="flex-1 items-center justify-center">
          <Icon name="scan-outline" size={48} color="#3B82F6" />
          <Text className="text-lg font-semibold text-gray-900 mt-4">Validando prendas...</Text>
          <Text className="text-sm text-gray-600 mt-2">Por favor espera</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safe>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Button
            icon={<Icon name="arrow-back-outline" size={24} color="#3B82F6" />}
            variant="ghost"
            size="icon"
            onPress={() => navigation.goBack()}
          />
          <Text className="text-2xl font-bold text-gray-900 ml-2">Validación de Prendas</Text>
        </View>

        {/* Información de la Guía */}
        <Card variant="outlined" padding="md" className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Icon name="document-text-outline" size={20} color="#3B82F6" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                {guideData.guide_number}
              </Text>
            </View>
            <View className="bg-blue-100 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-blue-800">
                {guideData.status}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-gray-600">Cliente: {guideData.client_name}</Text>
        </Card>

        {/* Resultado de Validación */}
        <View className="mb-6">
          <View className={`p-4 rounded-xl border-2 ${
            isValidationPerfect
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <View className="flex-row items-center mb-3">
              <Icon
                name={isValidationPerfect ? 'checkmark-circle' : 'alert-circle'}
                size={32}
                color={isValidationPerfect ? '#10B981' : '#F59E0B'}
              />
              <Text className={`text-lg font-bold ml-3 ${
                isValidationPerfect ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {isValidationPerfect
                  ? '¡Validación Completa!'
                  : 'Validación con Discrepancias'}
              </Text>
            </View>

            {/* Estadísticas */}
            <View className="flex-row justify-between mt-2">
              <View className="flex-1">
                <Text className="text-xs text-gray-600 mb-1">Esperadas</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {validationResult.total}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-600 mb-1">Escaneadas</Text>
                <Text className="text-2xl font-bold text-blue-700">
                  {validationResult.scanned}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-600 mb-1">Coinciden</Text>
                <Text className="text-2xl font-bold text-green-700">
                  {validationResult.matched.length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Prendas Coincidentes */}
        {validationResult.matched.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Prendas Coincidentes ({validationResult.matched.length})
              </Text>
            </View>
            <Card variant="outlined" padding="sm">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row flex-wrap">
                  {validationResult.matched.map((tag, index) => (
                    <View key={index} className="bg-green-100 px-3 py-2 rounded-lg mr-2 mb-2">
                      <Text className="text-xs text-green-800 font-mono">
                        {tag.substring(0, 12)}...
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Card>
          </View>
        )}

        {/* Prendas Faltantes */}
        {validationResult.missing.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="close-circle-outline" size={20} color="#EF4444" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Prendas Faltantes ({validationResult.missing.length})
              </Text>
            </View>
            <Card variant="outlined" padding="sm">
              <View className="bg-red-50 p-3 rounded-lg">
                <Text className="text-sm text-red-800 mb-2">
                  Las siguientes prendas no fueron escaneadas:
                </Text>
                {validationResult.missing.map((tag, index) => (
                  <View key={index} className="bg-red-100 px-3 py-2 rounded-lg mb-2">
                    <Text className="text-xs text-red-800 font-mono">{tag}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Prendas Extra */}
        {validationResult.extra.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="warning-outline" size={20} color="#F59E0B" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Prendas Extra ({validationResult.extra.length})
              </Text>
            </View>
            <Card variant="outlined" padding="sm">
              <View className="bg-yellow-50 p-3 rounded-lg">
                <Text className="text-sm text-yellow-800 mb-2">
                  Estas prendas no pertenecen a esta guía:
                </Text>
                {validationResult.extra.map((tag, index) => (
                  <View key={index} className="bg-yellow-100 px-3 py-2 rounded-lg mb-2">
                    <Text className="text-xs text-yellow-800 font-mono">{tag}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Botón Continuar */}
        <View className="mb-6">
          <Button
            title={isValidationPerfect 
              ? `Continuar con ${getProcessLabel(processType)}` 
              : 'Continuar de Todas Formas'
            }
            onPress={handleContinue}
            fullWidth
            size="lg"
            icon={<Icon name="arrow-forward-outline" size={18} color="white" />}
          />
          {!isValidationPerfect && (
            <Text className="text-xs text-yellow-700 text-center mt-2">
              ⚠️ Hay discrepancias. Verifica antes de continuar.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Modal de Confirmación */}
      <GuideStatusConfirmationModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmStatusChange}
        guideNumber={guideData.guide_number}
        currentStatus={guideData.status}
        newStatus={getNewStatusFromProcess(processType)}
        processType={processType}
        isLoading={false}
      />
    </Container>
  );
};

