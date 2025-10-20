import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

interface ConfigStore {
  apiBaseUrl: string;
  
  setApiBaseUrl: (url: string) => void;
  updateConfig: (config: Partial<ConfigStore>) => void;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      apiBaseUrl: API_BASE_URL, // URL desde variables de entorno (.env)
      
      setApiBaseUrl: (url: string) => set({ apiBaseUrl: url }),
      updateConfig: (config) => set(config),
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
