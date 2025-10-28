import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '@/laundry/api/vehicles/vehicles.api';
import { Vehicle, VehicleFilters } from '@/laundry/interfaces/vehicles/vehicle.interface';
import { ApiResponse } from '@/interfaces/base.response';

interface UseVehiclesParams extends VehicleFilters {
  enabled?: boolean;
}

/**
 * Hook para obtener la lista paginada de vehículos
 */
export const useVehicles = ({
  page = 1,
  limit = 10,
  search,
  status,
  vehicle_type,
  branch_office_id,
  enabled = true,
}: UseVehiclesParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vehicles', { page, limit, search, status, vehicle_type, branch_office_id }],
    queryFn: async () => {
      const { data } = await vehiclesApi.get<ApiResponse<Vehicle[]>>('/', {
        params: {
          page,
          limit,
          search,
          status,
          vehicle_type,
          branch_office_id,
        }
      });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled,
  });

  return {
    vehicles: data?.data || [],
    isLoading,
    hasError: !!error,
    refetch,
    total: data?.totalData || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || page,
  };
};

