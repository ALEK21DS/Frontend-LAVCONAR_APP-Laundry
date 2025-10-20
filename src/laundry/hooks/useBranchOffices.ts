import { useQuery } from '@tanstack/react-query';
import { branchOfficesApi, BranchOffice } from '../api/branch-offices/branch-offices.api';

export const useBranchOffices = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['branch-offices'],
    queryFn: branchOfficesApi.getAll,
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

