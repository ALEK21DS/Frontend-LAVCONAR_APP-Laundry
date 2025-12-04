import { useMutation } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { ValidateBundleGarmentsDto, ValidateBundleGarmentsResponse } from '@/laundry/interfaces/bundles';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para validar que los códigos RFID pertenezcan a una guía
 */
export const useValidateBundleGarments = () => {
  const mutation = useMutation({
    mutationFn: async (
      validateData: ValidateBundleGarmentsDto,
    ): Promise<ValidateBundleGarmentsResponse> => {
      const { data } = await guidesApi.post<ApiResponse<ValidateBundleGarmentsResponse>>(
        '/validate-bundle-garments',
        validateData,
      );
      return data.data!;
    },
    onError: (err) => {
      console.error('Error al validar prendas:', handleApiError(err));
    },
  });

  return {
    validateGarments: mutation.mutate,
    validateGarmentsAsync: mutation.mutateAsync,
    isValidating: mutation.isPending,
    validationResult: mutation.data,
    validationError: mutation.error,
  };
};

