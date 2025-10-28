import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/Ionicons';

interface QrScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (qrData: string) => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ visible, onClose, onScan }) => {
  const [isScanning, setIsScanning] = useState(true);

  const handleBarCodeRead = ({ data }: { data: string }) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    onScan(data);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <RNCamera
        style={StyleSheet.absoluteFill}
        type={RNCamera.Constants.Type.back}
        onBarCodeRead={handleBarCodeRead}
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: 'Permiso para usar la cámara',
          message: 'Necesitamos tu permiso para escanear códigos QR',
          buttonPositive: 'Aceptar',
          buttonNegative: 'Cancelar',
        }}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Icon name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Scanning Area */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Icon name="scan-outline" size={48} color="white" />
          <Text style={styles.instructionsText}>
            Apunta la cámara al código QR
          </Text>
          <Text style={styles.instructionsSubtext}>
            El escaneo se realizará automáticamente
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    color: '#D1D5DB',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  closeButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  instructions: {
    alignItems: 'center',
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  instructionsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  instructionsSubtext: {
    color: '#D1D5DB',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

