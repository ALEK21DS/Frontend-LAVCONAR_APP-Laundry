import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide, CreateGuideDto } from '@/laundry/interfaces/guides/guides.interface';

export const createGuideAction = async (data: CreateGuideDto): Promise<Guide> => {
  return await guidesApi.create(data);
};
