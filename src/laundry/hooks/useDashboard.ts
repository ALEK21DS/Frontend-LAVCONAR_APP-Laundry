import { useQuery } from '@tanstack/react-query';
import { useClients } from './useClients';
import { useGuides } from './useGuides';
import { useGarments } from './useGarments';
import { useWashingProcesses } from './useWashingProcesses';

/**
 * Hook para obtener las estadísticas del dashboard
 */
export const useDashboardStats = () => {
  // Obtener estadísticas básicas (solo primera página para contar)
  const { total: totalClients } = useClients(1, 1);
  const { total: totalGuides } = useGuides(1, 1);
  const { total: totalGarments } = useGarments(1, 1);
  const { total: totalProcesses } = useWashingProcesses({ page: 1, limit: 1 });

  return {
    clients: totalClients,
    guides: totalGuides,
    garments: totalGarments,
    processes: totalProcesses,
  };
};

/**
 * Hook para obtener la actividad reciente del admin
 * Por ahora retorna datos mock, pero se puede conectar con un endpoint de auditoría
 */
export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // TODO: Conectar con endpoint de auditoría cuando esté disponible
      // Por ahora retornamos datos mock basados en la actividad del admin
      return [
        {
          id: 'a1',
          title: 'Nuevo cliente registrado',
          subtitle: 'Hotel Imperial Plaza',
          icon: 'person-add-outline',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        },
        {
          id: 'a2',
          title: 'Guía creada',
          subtitle: 'G-00045 · María García',
          icon: 'document-text-outline',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        },
        {
          id: 'a3',
          title: 'Proceso iniciado',
          subtitle: 'Lavado · G-00044',
          icon: 'construct-outline',
          timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
        },
        {
          id: 'a4',
          title: 'Prenda escaneada',
          subtitle: 'EPC 300833B2DDD9014000000000',
          icon: 'pricetag-outline',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        },
        {
          id: 'a5',
          title: 'Guía completada',
          subtitle: 'G-00041 · Comercial Andes',
          icon: 'checkmark-done-outline',
          timestamp: new Date(Date.now() - 1000 * 60 * 150), // 2.5 hours ago
        },
      ];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
