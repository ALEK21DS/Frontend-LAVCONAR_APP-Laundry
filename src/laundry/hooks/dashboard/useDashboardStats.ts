import { useClients } from '../clients';
import { useGuides, useGarments } from '../guides';
import { useWashingProcesses } from '../washing-processes';

/**
 * Hook para obtener las estadísticas del dashboard
 * Combina datos de múltiples módulos para mostrar contadores
 */
export const useDashboardStats = () => {
  // Obtener estadísticas básicas (solo primera página para obtener el total)
  const { total: totalClients, isLoading: loadingClients } = useClients({ page: 1, limit: 1 });
  const { total: totalGuides, isLoading: loadingGuides } = useGuides({ page: 1, limit: 1 });
  const { total: totalGarments, isLoading: loadingGarments } = useGarments({ page: 1, limit: 1 });
  const { total: totalProcesses, isLoading: loadingProcesses } = useWashingProcesses({ page: 1, limit: 1 });

  const isLoading = loadingClients || loadingGuides || loadingGarments || loadingProcesses;

  return {
    stats: {
      clients: totalClients,
      guides: totalGuides,
      garments: totalGarments,
      processes: totalProcesses,
    },
    isLoading,
  };
};

