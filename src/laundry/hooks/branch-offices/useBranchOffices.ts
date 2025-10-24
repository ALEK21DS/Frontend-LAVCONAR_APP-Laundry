import { useQuery } from '@tanstack/react-query';
import { branchOfficesApi } from '@/laundry/api/branch-offices/branch-offices.api';
import { BranchOffice } from '@/laundry/interfaces/branch-offices/branch-offices.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener todas las sucursales
 * Incluye conversión automática a formato para Dropdown/Select
 */
export const useBranchOffices = () => {
  const { 
    data, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['branch-offices'],
    queryFn: async (): Promise<BranchOffice[]> => {
      const response = await branchOfficesApi.get<ApiResponse<BranchOffice[]>>('/');
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const sucursales = data || [];

  // Convertir a formato para Dropdown (solo sucursales activas)
  const sucursalesOptions = sucursales
    .filter((branch: BranchOffice) => branch.is_active)
    .map((branch: BranchOffice) => ({
      label: branch.name,
      value: branch.id,
    }));

  return {
    sucursales,
    sucursalesOptions,
    isLoading,
    error: error?.message,
    refetch,
  };
};

