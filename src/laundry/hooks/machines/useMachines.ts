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
export const useMachines = (branchOfficeId?: string, machineType?: string, enabled: boolean = true) => {
  // Para SUPERADMIN, branchOfficeId puede ser undefined y eso es válido (obtiene todas las máquinas)
  // Para otros usuarios, branchOfficeId debe ser válido
  const isValidBranchOfficeId = branchOfficeId === undefined || 
    (typeof branchOfficeId === 'string' && branchOfficeId.trim() !== '');

  return useQuery({
    queryKey: ['machines', branchOfficeId, machineType],
    queryFn: async (): Promise<Machine[]> => {
      const params: any = {
        page: 1,
        limit: 50,
      };

      // Solo agregar branch_office_id si está definido y no está vacío
      // Si es undefined, el backend (para SUPERADMIN) mostrará todas las máquinas
      if (branchOfficeId && typeof branchOfficeId === 'string' && branchOfficeId.trim() !== '') {
        params.branch_office_id = branchOfficeId.trim();
      }

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
        // El backend lanza ResourceNotFoundException cuando no hay máquinas (404)
        // También puede ser un error 400 u otro, pero si es 404 significa que no hay máquinas
        if (error?.response?.status === 404) {
          return [];
        }
        // Si es otro error, también retornar array vacío para no romper la UI
        // pero loguear el error para debugging
        console.warn('Error al obtener máquinas:', error?.response?.data?.message || error?.message);
        return [];
      }
    },
    enabled: enabled && isValidBranchOfficeId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
  });
};

