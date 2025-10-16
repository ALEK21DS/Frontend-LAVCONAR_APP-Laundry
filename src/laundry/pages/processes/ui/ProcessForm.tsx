import React from 'react';
import { View, Text } from 'react-native';
import { Button, Dropdown, Card } from '@/components/common';

type Option = { label: string; value: string };

interface ProcessFormProps {
  guideOptions: Option[];
  selectedGuideId?: string;
  onChangeGuide: (id: string) => void;
  onScanRFID?: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export const ProcessForm: React.FC<ProcessFormProps> = ({
  guideOptions,
  selectedGuideId,
  onChangeGuide,
  onScanRFID,
  onSubmit,
  submitting,
}) => {
  return (
    <>
      <View className="mb-6">
        <Dropdown
          label="Guía *"
          placeholder="Selecciona una guía"
          options={guideOptions}
          value={selectedGuideId || ''}
          onValueChange={onChangeGuide}
          icon="document-text-outline"
          searchable
        />
      </View>

      {onScanRFID && (
        <View className="mb-6">
          <Button title="Escanear RFID" onPress={onScanRFID} fullWidth />
        </View>
      )}

      <Card padding="md" className="mb-6">
        <Text className="text-gray-700">Detalle del proceso (pendiente de definición)</Text>
      </Card>

      <Button title="Guardar Proceso" onPress={onSubmit} isLoading={!!submitting} fullWidth />
    </>
  );
};


