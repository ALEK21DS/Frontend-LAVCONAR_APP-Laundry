import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthorizationRequest } from '@/laundry/interfaces/authorizations/authorization.interface';

interface NotificationsStore {
  // IDs de autorizaciones que ya fueron procesadas (completadas o descartadas)
  processedIds: string[];
  
  // Actions
  markAsProcessed: (id: string) => void;
  markAllAsProcessed: (ids: string[]) => void;
  clearProcessed: () => void;
  isProcessed: (id: string) => boolean;
  
  // Filtrar notificaciones activas basándose en las autorizaciones aprobadas
  getActiveNotifications: (approvedAuthorizations: AuthorizationRequest[]) => AuthorizationRequest[];
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      processedIds: [],

      markAsProcessed: (id: string) => {
        set(state => ({
          processedIds: [...state.processedIds, id],
        }));
      },

      markAllAsProcessed: (ids: string[]) => {
        set(state => ({
          processedIds: [...state.processedIds, ...ids],
        }));
      },

      clearProcessed: () => {
        set({ processedIds: [] });
      },

      isProcessed: (id: string) => {
        return get().processedIds.includes(id);
      },

      getActiveNotifications: (approvedAuthorizations: AuthorizationRequest[]) => {
        const processedIds = get().processedIds;
        // Filtrar solo las que no han sido procesadas
        return approvedAuthorizations.filter(n => !processedIds.includes(n.id));
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        processedIds: state.processedIds,
      }),
    }
  )
);

