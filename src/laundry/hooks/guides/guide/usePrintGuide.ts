import { useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore } from '@/config/store/config.store';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface UsePrintGuideReturn {
  downloadGuidePDF: (id: string) => Promise<void>;
  isPrinting: boolean;
}

/**
 * Hook para descargar/imprimir guía en PDF
 * En React Native, descarga el PDF y lo abre con el lector del dispositivo
 */
export const usePrintGuide = (): UsePrintGuideReturn => {
  const [isPrinting, setIsPrinting] = useState(false);

  const downloadGuidePDF = async (id: string) => {
    setIsPrinting(true);
    try {
      // Obtener el token de autenticación (la clave correcta es 'auth-token')
      const token = await AsyncStorage.getItem('auth-token');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token de autenticación. Inicie sesión nuevamente.');
        return;
      }

      // Obtener la URL base de la API desde el store
      const { apiBaseUrl } = useConfigStore.getState();

      // Construir la URL completa
      const url = `${apiBaseUrl}/import-export/print-guide/${id}`;

      // Configurar el directorio de descarga público
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `Guia_${timestamp}.pdf`;

      // Descargar el PDF con autenticación en la carpeta pública de Descargas
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: ReactNativeBlobUtil.fs.dirs.DownloadDir + '/' + fileName,
          title: fileName,
          description: 'Guía de Servicio',
          mime: 'application/pdf',
          mediaScannable: true,
        },
      }).fetch('GET', url, {
        'Authorization': `Bearer ${token}`,
      });

      // El PDF se descarga y aparece en las notificaciones de Android

    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      Alert.alert('Error', error.message || 'No se pudo descargar el PDF de la guía');
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    downloadGuidePDF,
    isPrinting,
  };
};

