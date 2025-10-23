export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp?: string;
  // Campos legacy (para compatibilidad)
  success?: boolean;
  error?: string;
}
