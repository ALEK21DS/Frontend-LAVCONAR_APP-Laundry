import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input, Card } from '@/components/common';

interface GarmentFormProps {
  rfidCode: string;
  onSubmit: (data: { rfidCode: string; description: string; color: string; observations: string }) => void;
  onCancel?: () => void;
  // Opcionales para escaneo integrado desde la página padre
  onScan?: () => void;
  isScanning?: boolean;
}

export const GarmentForm: React.FC<GarmentFormProps> = ({ rfidCode, onSubmit, onCancel, onScan, isScanning = false }) => {
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implementar llamada al API para crear prenda
      console.log('Creating garment:', { rfidCode, description, color, observations });
      
      // Simular creación exitosa
      setTimeout(() => {
        Alert.alert('Éxito', 'Prenda registrada correctamente', [
          { text: 'OK', onPress: () => onSubmit({ rfidCode, description, color, observations }) }
        ]);
        setIsSubmitting(false);
      }, 500);
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
          label="Observaciones"
          placeholder="Información adicional sobre la prenda..."
          value={observations}
          onChangeText={setObservations}
          multiline
          icon="chatbox-ellipses-outline"
        />

        <View className="h-4" />

        <Button
          title="Crear Prenda"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          fullWidth
          style={{ backgroundColor: '#1f4eed' }}
        />

        {onCancel && (
          <>
            <View className="h-3" />
            <Button
              title="Cancelar"
              onPress={onCancel}
              variant="outline"
              fullWidth
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

