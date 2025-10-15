import { tagsApi } from '@/laundry/api/tags/tags.api';
import { Tag } from '@/laundry/interfaces/tags/tags.interface';

export const getTagsAction = async (): Promise<Tag[]> => {
  return await tagsApi.getAll();
};

export const getAvailableTagsAction = async (): Promise<Tag[]> => {
  return await tagsApi.getAvailable();
};
