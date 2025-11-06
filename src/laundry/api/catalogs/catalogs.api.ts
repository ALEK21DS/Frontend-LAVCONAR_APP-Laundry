import { createAuthenticatedAxiosInstance } from '@/helpers';
import { ApiResponse } from '@/interfaces/base.response';

export interface CatalogValue {
  id: string;
  catalog_type_id: string;
  code: string;
  label: string;
  description?: string;
  display_order?: number;
  color?: string;
  icon?: string;
  metadata?: any;
  is_system?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogValuesResponse {
  status: number;
  message: string;
  data: CatalogValue[];
  totalData: number;
  timestamp: string;
}

/**
 * Cliente Axios autenticado para el módulo de catálogos
 * Base URL: /admin-catalogs
 */
export const catalogsApi = createAuthenticatedAxiosInstance('/admin-catalogs');

