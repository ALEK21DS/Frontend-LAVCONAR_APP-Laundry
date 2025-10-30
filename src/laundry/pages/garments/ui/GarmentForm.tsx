import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input, Card } from '@/components/common';

interface GarmentFormProps {
  rfidCode: string;
  onSubmit: (data: { rfidCode: string; description: string; color: string; observations: string; weight?: number }) => void;
  submitting?: boolean;
  initialValues?: {
    rfidCode?: string;
    description?: string;
    color?: string;
    weight?: string;
    observations?: string;
  };
  // Opcionales para escaneo integrado desde la página padre
  onScan?: () => void;
  isScanning?: boolean;
}

export const GarmentForm: React.FC<GarmentFormProps> = ({ 
  rfidCode, 
  onSubmit, 
  submitting = false, 
  initialValues,
  onScan, 
  isScanning = false 
}) => {
  const [description, setDescription] = useState(initialValues?.description || '');
  const [color, setColor] = useState(initialValues?.color || '');
  const [weight, setWeight] = useState(initialValues?.weight || '');
  const [observations, setObservations] = useState(initialValues?.observations || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar campos si cambian los valores iniciales
  useEffect(() => {
    if (initialValues) {
      setDescription(initialValues.description || '');
      setColor(initialValues.color || '');
      setWeight(initialValues.weight || '');
      setObservations(initialValues.observations || '');
    }
  }, [initialValues]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    const weightValue = weight ? parseFloat(weight) : undefined;
    if (weight && isNaN(weightValue!)) {
      Alert.alert('Error', 'El peso debe ser un número válido');
      return;
    }
    if (typeof weightValue === 'number' && weightValue < 0) {
      Alert.alert('Error', 'El peso debe ser mayor o igual a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit({ 
        rfidCode, 
        description, 
        color, 
        observations,
        weight: weightValue
      });
      setIsSubmitting(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la prenda');
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-700 mb-2">Código RFID</Text>
          <Card padding="md" variant="outlined">
            <Text className="text-lg font-mono text-gray-900">{rfidCode || '—'}</Text>
          </Card>
          {onScan && (
            <View className="mt-3">
              <Button
                title={isScanning ? 'Detener Escaneo' : 'Escanear RFID'}
                onPress={onScan}
                size="sm"
                fullWidth
                style={isScanning ? { backgroundColor: '#dc2626' } : { backgroundColor: '#1f4eed' }}
              />
            </View>
          )}
        </View>

        <Input
          label="Descripción *"
          placeholder="Ej: Camisa de vestir"
          value={description}
          onChangeText={setDescription}
          icon="document-text-outline"
        />

        <Input
          label="Color"
          placeholder="Ej: Blanco, Azul, etc."
          value={color}
          onChangeText={setColor}
          icon="color-palette-outline"
        />

        <Input
          label="Peso (kg)"
          placeholder="Ej: 0.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          icon="scale-outline"
        />

        <Input
          label="Observaciones"
          placeholder="Información adicional sobre la prenda..."
          value={observations}
          onChangeText={setObservations}
          multiline
          icon="chatbox-ellipses-outline"
        />

        <View className="h-4" />

        <Button
          title={initialValues ? "Actualizar Prenda" : "Crear Prenda"}
          onPress={handleSubmit}
          isLoading={isSubmitting || submitting}
          fullWidth
          style={{ backgroundColor: initialValues ? '#F59E0B' : '#1f4eed' }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

