import { apiClient } from '@/helpers/axios-instance.helper';
import {
  Tag,
  RegisterTagDto,
  UpdateTagDto,
  TagsResponse,
} from '@/laundry/interfaces/tags/tags.interface';
import { ApiResponse } from '@/interfaces/base.response';

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const { data } = await apiClient.get<ApiResponse<TagsResponse>>('/api/tags');
    return data.data?.tags || [];
  },

  getByEPC: async (epc: string): Promise<Tag> => {
    const { data } = await apiClient.get<ApiResponse<Tag>>(`/api/tags/${epc}`);
    return data.data!;
  },

  register: async (tagData: RegisterTagDto): Promise<Tag> => {
    const { data } = await apiClient.post<ApiResponse<Tag>>('/api/tags/register', tagData);
    return data.data!;
  },

  update: async (epc: string, tagData: UpdateTagDto): Promise<Tag> => {
    const { data } = await apiClient.put<ApiResponse<Tag>>(`/api/tags/${epc}`, tagData);
    return data.data!;
  },

  delete: async (epc: string): Promise<void> => {
    await apiClient.delete(`/api/tags/${epc}`);
  },

  getAvailable: async (): Promise<Tag[]> => {
    const { data } = await apiClient.get<ApiResponse<TagsResponse>>('/api/tags?status=disponible');
    return data.data?.tags || [];
  },

  getByClient: async (clientId: string): Promise<Tag[]> => {
    const { data } = await apiClient.get<ApiResponse<TagsResponse>>(`/api/tags/client/${clientId}`);
    return data.data?.tags || [];
  },
};
