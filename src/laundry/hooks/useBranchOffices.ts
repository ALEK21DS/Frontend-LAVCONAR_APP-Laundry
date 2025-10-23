import { useQuery } from '@tanstack/react-query';
import { branchOfficesApi } from '../api/branch-offices/branch-offices.api';
import { BranchOffice } from '../interfaces/branch-offices/branch-offices.interface';
import { ApiResponse } from '@/interfaces/base.response';

export const useBranchOffices = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['branch-offices'],
    queryFn: async (): Promise<BranchOffice[]> => {
      const response = await branchOfficesApi.get<ApiResponse<BranchOffice[]>>('/');
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Convertir a formato para Dropdown
  const sucursalesOptions = (data || [])
    .filter((branch: BranchOffice) => branch.is_active)
    .map((branch: BranchOffice) => ({
      label: branch.name,
      value: branch.id,
    }));

  return {
    sucursales: data || [],
    sucursalesOptions,
    isLoading,
    error,
  };
};

