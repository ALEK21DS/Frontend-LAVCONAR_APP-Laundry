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

/**
 * Hook para obtener máquinas filtradas por sucursal
 */
export const useMachines = (branchOfficeId?: string, machineType?: string) => {
  // Validar que branchOfficeId sea un string no vacío
  const isValidBranchOfficeId = branchOfficeId && branchOfficeId.trim() !== '';
  
  return useQuery({
    queryKey: ['machines', branchOfficeId, machineType],
    queryFn: async (): Promise<Machine[]> => {
      if (!isValidBranchOfficeId) {
        return [];
      }

      const params: any = {
        page: 1,
        limit: 50,
        branch_office_id: branchOfficeId!.trim(),
      };

      if (machineType) {
        params.machine_type = machineType;
      }

      try {
        const response = await washingProcessesApi.get<ApiResponse<Machine[]>>(
          '/get-all-machines',
          { params }
        );
        
        // La respuesta es ApiResponse<Machine[]>, así que data.data contiene el array
        const machines = response.data.data || [];
        return machines;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: isValidBranchOfficeId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
  });
};

