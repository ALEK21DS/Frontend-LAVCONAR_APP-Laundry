import { useQuery } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { ApiResponse } from '@/interfaces/base.response';

export interface Machine {
  id: string;
  code: string;
  type: string;
  weight_capacity: number;
  branch_office_id: string;
  description?: string;
  is_active: boolean;
  status_machine: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
  branch_office_name?: string;
}

interface MachinesResponse {
  status: number;
  message: string;
  data: Machine[];
  totalData: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Hook para obtener máquinas filtradas por sucursal
 */
export const useMachines = (branchOfficeId?: string, machineType?: string) => {
  return useQuery({
    queryKey: ['machines', branchOfficeId, machineType],
    queryFn: async (): Promise<Machine[]> => {
      const params: any = {
        page: 1,
        limit: 100,
      };

      if (branchOfficeId) {
        params.branch_office_id = branchOfficeId;
      }

      if (machineType) {
        params.machine_type = machineType;
      }

      try {
        const { data } = await washingProcessesApi.get<ApiResponse<MachinesResponse>>(
          '/get-all-machines',
          { params }
        );
        return data.data?.data || [];
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!branchOfficeId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
  });
};

