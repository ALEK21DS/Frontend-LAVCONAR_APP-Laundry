import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/auth/store/auth.store';
import { dashboardApi } from '@/laundry/api/dashboard/dashboard.api';
import { DashboardMetrics } from '@/laundry/interfaces/dashboard/dashboard-metrics.interface';
import { getPreferredBranchOfficeId } from '@/helpers/user.helper';

/**
 * Hook para obtener las estadísticas del dashboard
 * Obtiene los porcentajes y totales usados en las tarjetas principales
 */
export const useDashboardStats = () => {
  const { user } = useAuthStore();
  const branchOfficeId = getPreferredBranchOfficeId(user);

  const query = useQuery({
    queryKey: ['dashboard-metrics', branchOfficeId || 'all'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data } = await dashboardApi.get<DashboardMetrics>('/metrics', {
        params: branchOfficeId ? { branch_office_id: branchOfficeId } : undefined,
      });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    metrics: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
