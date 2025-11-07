import { useQuery } from '@tanstack/react-query';
import { operationAuditApi } from '@/laundry/api/audit/operation-audit.api';
import { OperationAudit } from '@/laundry/interfaces/audit/operation-audit.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { translateEnum } from '@/helpers/enum-translations';
import { formatDateTime } from '@/helpers/formatters.helper';
import { useCatalogLabelMap } from '@/laundry/hooks/catalogs';

export interface ActivityItem {
  id: string;
  username: string;
  actionLabel: string;
  actionColor: string;
  title: string;
  description: string;
  timestamp: Date;
  action: string;
  entity: string;
}

/**
 * Mapea las entidades a nombres legibles en español usando el helper centralizado
 */
const getEntityName = (entity: string): string => {
  const normalizedEntity = entity.toUpperCase();
  return translateEnum(normalizedEntity, 'entity') || entity;
};

/**
 * Obtiene el color del badge según la acción
 */
const getActionColor = (action: string): string => {
  const normalizedAction = action.toUpperCase();
  
  const colorMap: Record<string, string> = {
    'CREATE': '#10B981',      // Verde
    'CREATED': '#10B981',
    'UPDATE': '#3B82F6',      // Azul
    'UPDATED': '#3B82F6',
    'DELETE': '#EF4444',      // Rojo
    'DELETED': '#EF4444',
    'SCAN': '#F59E0B',        // Amarillo
    'SCANNED': '#F59E0B',
    'COMPLETE': '#8B5CF6',    // Púrpura
    'COMPLETED': '#8B5CF6',
    'START': '#14B8A6',       // Teal
    'STARTED': '#14B8A6',
  };
  
  return colorMap[normalizedAction] || '#6B7280'; // Gris por defecto
};

/**
 * Obtiene el label de la acción en forma verbal (para el badge)
 */
const getActionLabel = (action: string): string => {
  const normalizedAction = action.toUpperCase();
  
  const labelMap: Record<string, string> = {
    'CREATE': 'Creó',
    'CREATED': 'Creó',
    'UPDATE': 'Actualizó',
    'UPDATED': 'Actualizó',
    'DELETE': 'Eliminó',
    'DELETED': 'Eliminó',
    'SCAN': 'Escaneó',
    'SCANNED': 'Escaneó',
    'COMPLETE': 'Completó',
    'COMPLETED': 'Completó',
    'START': 'Inició',
    'STARTED': 'Inició',
  };
  
  return labelMap[normalizedAction] || translateEnum(normalizedAction, 'audit_action') || action;
};

/**
 * Limpia y traduce las descripciones que vienen del backend en inglés
 */
const cleanDescription = (description: string | null): string => {
  if (!description) return '';
  
  // Traducir palabras comunes del inglés al español
  return description
    .replace(/\bClient\b/g, 'Cliente')
    .replace(/\bGuide\b/g, 'Guía')
    .replace(/\bGarment\b/g, 'Prenda')
    .replace(/\bProcess\b/g, 'Proceso')
    .replace(/\bcreated\b/g, 'creado')
    .replace(/\bupdated\b/g, 'actualizado')
    .replace(/\bdeleted\b/g, 'eliminado')
    .replace(/\bscanned\b/g, 'escaneado')
    .replace(/\bcompleted\b/g, 'completado')
    .replace(/\bstarted\b/g, 'iniciado')
    .replace(/\bAuthorizations invalidated for guides\b/g, 'Autorizaciones invalidadas para guías')
    .replace(/\bUPDATE\b/g, 'ACTUALIZACIÓN')
    .replace(/\bCREATE\b/g, 'CREACIÓN')
    .replace(/\bDELETE\b/g, 'ELIMINACIÓN');
};

/**
 * Extrae el nombre o identificador del recurso desde los datos de auditoría
 */
const getResourceName = (
  audit: OperationAudit,
  getGarmentTypeLabel: (code: string | null | undefined, fallback?: string) => string
): string => {
  // Para DELETE, intentar obtener de previous_data primero
  if (audit.audit_action.toUpperCase() === 'DELETE' || audit.audit_action.toUpperCase() === 'DELETED') {
    if (audit.previous_data?.name) {
      return audit.previous_data.name;
    }
    if (audit.previous_data?.guide_number) {
      return audit.previous_data.guide_number;
    }
    if (audit.previous_data?.rfid_code) {
      return `RFID ${audit.previous_data.rfid_code.substring(0, 12)}...`;
    }
    if (audit.previous_data?.description) {
      return audit.previous_data.description;
    }
  }
  
  // Para CREATE y UPDATE, obtener de new_data
  if (audit.new_data) {
    // Nombre (para clientes, sucursales, etc.)
    if (audit.new_data.name) {
      return audit.new_data.name;
    }
    // Número de guía
    if (audit.new_data.guide_number) {
      return audit.new_data.guide_number;
    }
    // Código RFID (para prendas escaneadas con RFID)
    if (audit.new_data.rfid_code) {
      return `RFID ${audit.new_data.rfid_code.substring(0, 12)}...`;
    }
    // Descripción (para prendas)
    if (audit.new_data.description) {
      return audit.new_data.description;
    }
    // EPC (para tags)
    if (audit.new_data.epc) {
      return `EPC ${audit.new_data.epc.substring(0, 16)}...`;
    }
    // Tipo de prenda (como último recurso para prendas)
    if (audit.new_data.garment_type) {
      return getGarmentTypeLabel(
        audit.new_data.garment_type,
        audit.new_data.garment_type_label || audit.new_data.garment_type
      );
    }
  }
  
  // Si no hay información, intentar extraer de la descripción
  if (audit.description) {
    const cleanedDesc = cleanDescription(audit.description);
    // Intentar extraer un nombre entre comillas
    const match = cleanedDesc.match(/"([^"]+)"/);
    if (match) {
      return match[1];
    }
  }
  
  return '';
};

/**
 * Transforma los datos de auditoría en items de actividad reciente
 */
const transformAuditToActivity = (
  audit: OperationAudit,
  getGarmentTypeLabel: (code: string | null | undefined, fallback?: string) => string
): ActivityItem => {
  const entityName = getEntityName(audit.entity);
  const actionLabel = getActionLabel(audit.audit_action);
  const actionColor = getActionColor(audit.audit_action);
  const resourceName = getResourceName(audit, getGarmentTypeLabel);
  
  // Construir título con el nombre del recurso si está disponible
  let title = '';
  if (resourceName) {
    title = `${entityName}: ${resourceName}`;
  } else {
    title = `${actionLabel} ${entityName.toLowerCase()}`;
  }
  
  // La descripción será la fecha y hora
  const description = formatDateTime(audit.created_at);
  
  return {
    id: audit.id,
    username: audit.username || audit.user_email || 'Usuario',
    actionLabel,
    actionColor,
    title,
    description,
    timestamp: new Date(audit.created_at),
    action: audit.audit_action,
    entity: audit.entity,
  };
};

/**
 * Hook para obtener la actividad reciente del admin
 * Obtiene las últimas 5 auditorías de operaciones del usuario actual
 */
export const useRecentActivity = () => {
  const { getLabel: getGarmentTypeLabel } = useCatalogLabelMap('garment_type', { forceFresh: true });

  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      try {
        // Obtener las últimas 5 auditorías de operaciones del usuario actual
        const { data } = await operationAuditApi.get<ApiResponse<OperationAudit[]>>('/my-operations', {
          params: {
            page: 1,
            limit: 5,
          }
        });
        
        const audits = data.data || [];
        
        // Transformar las auditorías en items de actividad
        return audits.map(audit => transformAuditToActivity(audit, getGarmentTypeLabel));
      } catch (error: any) {
        // Solo mostrar error en consola si NO es un error de red
        // Los errores de red (Network Error) son normales cuando se pierde conexión
        const isNetworkError = error?.message?.includes('Network Error') || 
                               error?.code === 'ECONNABORTED' ||
                               error?.code === 'ERR_NETWORK';
        
        if (!isNetworkError) {
          console.error('Error al obtener actividad reciente:', error);
        }
        
        // Si es un error 404, no hay auditorías aún (retornar array vacío)
        if (error?.response?.status === 404) {
          return [];
        }
        
        // Para cualquier otro error, retornar array vacío para evitar romper el dashboard
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutos (actualizar más frecuente)
    refetchInterval: false, // Desactivar refetch automático para evitar spam de errores
    retry: false, // No reintentar en caso de error
  });
};
