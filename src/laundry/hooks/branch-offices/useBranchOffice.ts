import { useQuery } from '@tanstack/react-query';
import { branchOfficesApi } from '@/laundry/api/branch-offices/branch-offices.api';
import { BranchOffice } from '@/laundry/interfaces/branch-offices/branch-offices.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener una sucursal por ID
 */
export const useBranchOffice = (id: string | null | undefined) => {
  const {
    data: branchOffice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['branch-office', id],
    queryFn: async (): Promise<BranchOffice | undefined> => {
      if (!id) return undefined;
      const { data } = await branchOfficesApi.get<ApiResponse<BranchOffice>>(`/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    branchOffice,
    isLoading,
    error: error?.message,
    refetch,
  };
};

