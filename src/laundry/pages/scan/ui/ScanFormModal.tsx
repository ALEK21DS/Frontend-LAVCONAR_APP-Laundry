import React from 'react';
import { View, Modal } from 'react-native';
import { ScanForm } from './ScanForm';
import { useGetRfidScanByGuide } from '@/laundry/hooks/guides/rfid-scan';

interface ScanFormModalProps {
  visible: boolean;
  guideId: string;
  rfidScanId: string;
  guideToEdit?: any;
  scannedTags: string[];
  processType?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ScanFormModal: React.FC<ScanFormModalProps> = ({
  visible,
  guideId,
  rfidScanId,
  guideToEdit,
  scannedTags,
  processType,
  onSuccess,
  onCancel,
}) => {
  // Obtener el RFID scan completo para pasarlo al ScanForm
  const { rfidScan: fullRfidScan } = useGetRfidScanByGuide(guideId, visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        <ScanForm
          guideData={{ id: guideId }}
          scannedTags={scannedTags}
          onSubmit={onSuccess}
          onCancel={onCancel}
          editContext={{
            guideId: guideId,
            rfidScanId: rfidScanId,
          }}
          initialRfidScan={{
            // Ahora scan_type es el mismo que el proceso (1:1 con el catálogo)
            scan_type: processType || 'COLLECTED',
          }}
          initialRfidScanFull={fullRfidScan}
          initialGuide={guideToEdit}
        />
      </View>
    </Modal>
  );
};

