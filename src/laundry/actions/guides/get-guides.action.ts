import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';

export const getGuidesAction = async (): Promise<Guide[]> => {
  return await guidesApi.getAll();
};

export const getTodayGuidesAction = async (): Promise<Guide[]> => {
  return await guidesApi.getTodayGuides();
};

export const getGuidesByStatusAction = async (
  status: 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_PROCESS' | 'COMPLETED' | 'DELIVERED'
): Promise<Guide[]> => {
  return await guidesApi.getByStatus(status);
};
