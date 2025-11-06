import { useQuery } from '@tanstack/react-query';
import { catalogsApi, CatalogValuesResponse } from '@/laundry/api/catalogs/catalogs.api';

/**
 * Hook para obtener valores de un tipo específico de catálogo
 */
export const useCatalogValuesByType = (
  typeCode: string,
  is_active: boolean = true,
  options?: { forceFresh?: boolean }
) => {
  const forceFresh = options?.forceFresh === true;
  return useQuery({
    queryKey: ['catalog-values-by-type', typeCode, is_active],
    queryFn: async (): Promise<CatalogValuesResponse> => {
      try {
        const response = await catalogsApi.get<CatalogValuesResponse>(
          `/values/by-type/${typeCode}`,
          {
            params: { is_active },
          }
        );
        return response.data;
      } catch (error: any) {
        // Si es un 404 (catálogo no encontrado), devolver respuesta vacía
        if (error?.response?.status === 404) {
          return {
            status: 404,
            message: 'Catálogo no encontrado',
            data: [],
            totalData: 0,
            timestamp: new Date().toISOString(),
          };
        }
        throw error;
      }
    },
    enabled: !!typeCode,
    // Si forceFresh está activo, no usar caché y forzar refetch al montar
    staleTime: forceFresh ? 0 : 1000 * 60 * 60, // 0 = siempre fresco; por defecto 1 hora
    refetchOnMount: forceFresh ? 'always' : false,
    refetchOnReconnect: true,
    retry: false,
  });
};

