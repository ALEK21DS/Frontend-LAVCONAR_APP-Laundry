import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { ScannedTag } from '@/laundry/interfaces/tags/tags.interface';

// Nota: interfaz eliminada si no se usa para evitar errores de linter

const { RFIDModule } = NativeModules;
let currentPowerLevel = 0;

// Evita warnings cuando el módulo nativo no implementa addListener/removeListeners
const rfidEventEmitter = new NativeEventEmitter(
  RFIDModule &&
  typeof (RFIDModule as any).addListener === 'function' &&
  typeof (RFIDModule as any).removeListeners === 'function'
    ? (RFIDModule as any)
    : undefined
);

interface RFIDScanEvent {
  epc: string;
  rssi: number;
  timestamp: number;
}

export const rfidModule = {
  startScan: async (): Promise<void> => {
    if (!RFIDModule) {
      throw new Error('Módulo RFID no disponible');
    }
    try {
      await RFIDModule.startScan();
    } catch (error) {
      console.error('Error al iniciar escaneo RFID:', error);
      throw error;
    }
  },

  stopScan: async (): Promise<void> => {
    if (!RFIDModule) {
      throw new Error('Módulo RFID no disponible');
    }
    try {
      await RFIDModule.stopScan();
    } catch (error) {
      console.error('Error al detener escaneo RFID:', error);
      throw error;
    }
  },

  isScanning: async (): Promise<boolean> => {
    if (!RFIDModule) {
      return false;
    }
    try {
      return await RFIDModule.isScanning();
    } catch (error) {
      console.error('Error al verificar estado del escaneo:', error);
      return false;
    }
  },

  getPower: async (): Promise<number> => {
    if (!RFIDModule) {
      return 0;
    }
    try {
      return await RFIDModule.getPower();
    } catch (error) {
      console.error('Error al obtener potencia:', error);
      return 0;
    }
  },

  setPower: async (power: number): Promise<void> => {
    if (!RFIDModule) {
      throw new Error('Módulo RFID no disponible');
    }
    try {
      currentPowerLevel = power;
      console.log('[RFID Module] Potencia recibida:', power, 'dBm');
      await RFIDModule.setPower(power);
    } catch (error) {
      console.error('Error al establecer potencia:', error);
      throw error;
    }
  },

  addTagListener: (callback: (tag: ScannedTag) => void): EmitterSubscription => {
    return rfidEventEmitter.addListener('onTagScanned', (event: RFIDScanEvent) => {
      const tag: ScannedTag = {
        epc: event.epc,
        rssi: event.rssi,
        timestamp: event.timestamp || Date.now(),
      };
      console.log('[RFID Module] Tag detectado', {
        epc: tag.epc,
        rssi: tag.rssi,
        power: currentPowerLevel,
      });
      callback(tag);
    });
  },

  addErrorListener: (callback: (error: string) => void): EmitterSubscription => {
    return rfidEventEmitter.addListener('onScanError', (event: { message: string }) => {
      callback(event.message);
    });
  },

  simulateScan: (callback: (tag: ScannedTag) => void): ReturnType<typeof setInterval> => {
    return setInterval(() => {
      const mockTag: ScannedTag = {
        epc: `E280${String(Math.floor(Math.random() * 10000)).padStart(20, '0')}`,
        rssi: -40 - Math.floor(Math.random() * 30),
        timestamp: Date.now(),
      };
      callback(mockTag);
    }, 2000);
  },
};
