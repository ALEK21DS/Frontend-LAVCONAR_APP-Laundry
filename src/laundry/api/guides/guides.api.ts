import { apiClient } from '@/helpers/axios-instance.helper';
import {
  Guide,
  CreateGuideDto,
  UpdateGuideStatusDto,
  GuidesResponse,
} from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';
import {
  getMockGuides,
  getMockTodayGuides,
  getMockGuideById,
  getMockGuidesByStatus,
} from './__mocks__/guides.mock';

// Modo demo: cambiar a true para usar datos mock sin backend
const USE_MOCK_DATA = true;

export const guidesApi = {
  getAll: async (): Promise<Guide[]> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return getMockGuides();
    }
    const { data } = await apiClient.get<ApiResponse<GuidesResponse>>(
      '/admin-guides/get-all-guides'
    );
    return data.data?.guides || [];
  },

  getById: async (id: string): Promise<Guide> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const guide = getMockGuideById(id);
      if (!guide) {
        throw new Error('Guía no encontrada');
      }
      return guide;
    }
    const { data } = await apiClient.get<ApiResponse<Guide>>(`/admin-guides/get-guide/${id}`);
    return data.data!;
  },

  create: async (guideData: CreateGuideDto): Promise<Guide> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newGuide: Guide = {
        id: `guide-${Date.now()}`,
        guide_number: `G-2024-${String(Date.now()).slice(-3)}`,
        client_id: guideData.client_id,
        branch_office_id: guideData.branch_office_id || 'sucursal-centro-001',
        collection_date: guideData.collection_date,
        general_condition: guideData.general_condition,
        service_type: guideData.service_type,
        charge_type: guideData.charge_type,
        total_weight: guideData.total_weight,
        total_garments: guideData.total_garments,
        delivery_date: guideData.delivery_date,
        notes: guideData.notes,
        client_name: 'Cliente Demo',
        branch_office_name: 'Sucursal Demo',
        status: 'COLLECTED',
        items: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newGuide;
    }
    const { data } = await apiClient.post<ApiResponse<Guide>>(
      '/admin-guides/create-guide',
      guideData
    );
    return data.data!;
  },

  updateStatus: async (id: string, statusData: UpdateGuideStatusDto): Promise<Guide> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const guide = getMockGuideById(id);
      if (!guide) {
        throw new Error('Guía no encontrada');
      }
      return { ...guide, ...statusData, updated_at: new Date().toISOString() };
    }
    const { data } = await apiClient.patch<ApiResponse<Guide>>(
      `/admin-guides/update-guide/${id}`,
      statusData
    );
    return data.data!;
  },

  getByStatus: async (
    status: 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_PROCESS' | 'COMPLETED' | 'DELIVERED'
  ): Promise<Guide[]> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return getMockGuidesByStatus(status);
    }
    const { data } = await apiClient.get<ApiResponse<GuidesResponse>>(
      `/admin-guides/get-all-guides?status=${status}`
    );
    return data.data?.guides || [];
  },

  getTodayGuides: async (): Promise<Guide[]> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return getMockTodayGuides();
    }
    const today = new Date().toISOString().split('T')[0];
    const { data } = await apiClient.get<ApiResponse<GuidesResponse>>(
      `/admin-guides/get-all-guides?startDate=${today}&endDate=${today}`
    );
    return data.data?.guides || [];
  },
};
