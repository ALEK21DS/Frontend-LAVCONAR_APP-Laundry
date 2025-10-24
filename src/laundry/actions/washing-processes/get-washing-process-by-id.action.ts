import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { WashingProcessDetailResponse } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { extractAxiosError } from '@/helpers';

/**
 * Obtiene un proceso de lavado por su ID
 */
export const getWashingProcessByIdAction = async (
  processId: string
): Promise<WashingProcessDetailResponse> => {
  try {
    const { data } = await washingProcessesApi<WashingProcessDetailResponse>({
      url: `/get-washing-process/${processId}`,
      method: 'GET',
    });
    return data;
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al obtener el proceso');
    throw new Error(message);
  }
};

