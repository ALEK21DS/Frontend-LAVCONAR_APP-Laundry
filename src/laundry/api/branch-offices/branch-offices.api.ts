import { apiClient } from '@/helpers/axios-instance.helper';
import { ApiResponse } from '@/interfaces/base.response';

export interface BranchOffice {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const branchOfficesApi = {
  getAll: async (): Promise<BranchOffice[]> => {
    const { data } = await apiClient.get<ApiResponse<BranchOffice[]>>('/admin-branch-offices');
    return data.data || [];
  },
};

