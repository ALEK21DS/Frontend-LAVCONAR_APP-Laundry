import React from 'react';
import { useCatalogValuesByType } from './useCatalogValuesByType';

interface UseCatalogLabelMapOptions {
  forceFresh?: boolean;
  fallbackLabel?: string;
}

/**
 * Hook que devuelve un helper para obtener la etiqueta (label) de un código de catálogo.
 * Prioriza la etiqueta configurada en el catálogo del backend para soportar valores dinámicos.
 */
export const useCatalogLabelMap = (
  typeCode: string,
  options: UseCatalogLabelMapOptions = {}
) => {
  const { forceFresh = true, fallbackLabel = '—' } = options;
  const { data, isLoading, isFetching, refetch } = useCatalogValuesByType(typeCode, true, { forceFresh });

  const labelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (data?.data) {
      data.data
        .filter(item => item.is_active !== false)
        .forEach(item => {
          const code = item.code ?? '';
          const label = item.label ?? code;
          const normalized = code.trim().toUpperCase().replace(/[\s-]/g, '_');

          if (normalized) {
            map.set(normalized, label);
          }

          if (code) {
            map.set(code, label);
          }
        });
    }
    return map;
  }, [data]);

  const getLabel = React.useCallback(
    (code: string | null | undefined, fallback: string = fallbackLabel) => {
      if (!code) {
        return fallback;
      }
      const normalized = code.trim().toUpperCase().replace(/[\s-]/g, '_');
      return labelMap.get(normalized) ?? labelMap.get(code) ?? fallback;
    },
    [fallbackLabel, labelMap]
  );

  return {
    labelMap,
    getLabel,
    isLoading,
    isFetching,
    refetch,
  };
};
