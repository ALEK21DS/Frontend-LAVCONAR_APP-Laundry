import React from 'react';
import { View, Modal, TouchableOpacity, Text } from 'react-native';
import { ScanForm } from './ScanForm';
import { useGetRfidScanByGuide } from '@/laundry/hooks/guides/rfid-scan';
import Icon from 'react-native-vector-icons/Ionicons';

interface ScanFormModalProps {
  visible: boolean;
  guideId?: string;
  rfidScanId?: string;
  guideToEdit?: any;
  guideData?: any;
  scannedTags: string[];
  initialScanType?: string;
  deferRfidScanUpdate?: boolean;
  unregisteredCodes?: string[];
  serviceType?: 'industrial' | 'personal';
  origin?: 'guide' | 'process';
  onSuccess: (rfidScanUpdateData?: any) => void;
  onCancel: () => void;
}

export const ScanFormModal: React.FC<ScanFormModalProps> = ({
  visible,
  guideId,
  rfidScanId,
  guideToEdit,
  guideData,
  scannedTags,
  initialScanType,
  deferRfidScanUpdate = false,
  unregisteredCodes,
  serviceType,
  origin,
  onSuccess,
  onCancel,
}) => {
  // Obtener el RFID scan completo para pasarlo al ScanForm
  const { rfidScan: fullRfidScan } = useGetRfidScanByGuide(guideId || '', visible && !!guideId);
  const editContext = React.useMemo(() => {
    if (guideId && rfidScanId) {
      return { guideId, rfidScanId };
    }
    if (guideId) {
      return { guideId };
    }
    return undefined;
  }, [guideId, rfidScanId]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 top-14 bg-white rounded-t-2xl" style={{ elevation: 8 }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">Escaneo RFID</Text>
          <TouchableOpacity onPress={onCancel}>
            <Icon name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
        <View className="flex-1">
          <ScanForm
            guideData={guideData || guideToEdit || { id: guideId }}
            scannedTags={scannedTags}
            onSubmit={onSuccess}
            onCancel={onCancel}
            editContext={editContext}
            initialRfidScan={{
              scan_type: initialScanType || 'COLLECTED',
            }}
            initialRfidScanFull={fullRfidScan}
            initialGuide={guideToEdit}
            deferRfidScanUpdate={deferRfidScanUpdate}
            unregisteredCodes={unregisteredCodes}
            serviceType={serviceType}
            disableScanType={true}
          />
        </View>
      </View>
    </Modal>
  );
};

