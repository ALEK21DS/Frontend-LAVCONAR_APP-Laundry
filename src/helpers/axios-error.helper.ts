import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Extrae y formatea mensajes de error de llamadas axios
 * @param error - Error de axios
 * @param defaultMessage - Mensaje por defecto si no se puede extraer el error
 * @returns Objeto con mensaje de error y código de estado
 */
export const extractAxiosError = (
  error: unknown,
  defaultMessage: string = 'Ha ocurrido un error'
): { message: string; statusCode?: number } => {
  if (!error) {
    return { message: defaultMessage };
  }

  // Si es un error de axios
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Error de respuesta del servidor
    if (axiosError.response) {
      const { data, status } = axiosError.response;
      const message = data?.message || data?.error || defaultMessage;
      return { message, statusCode: status };
    }

    // Error de red o timeout
    if (axiosError.request) {
      return {
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        statusCode: 0,
      };
    }
  }

  // Error genérico
  if (error instanceof Error) {
    return { message: error.message || defaultMessage };
  }

  return { message: defaultMessage };
};

/**
 * Maneja errores de API y retorna solo el mensaje
 * Versión simplificada de extractAxiosError
 */
export const handleApiError = (error: any): string => {
  const { message } = extractAxiosError(error, 'Error desconocido');
  return message;
};
