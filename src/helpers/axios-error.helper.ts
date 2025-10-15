export const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || 'Error en el servidor';
  } else if (error.request) {
    return 'No se pudo conectar con el servidor';
  } else {
    return error.message || 'Error desconocido';
  }
};
