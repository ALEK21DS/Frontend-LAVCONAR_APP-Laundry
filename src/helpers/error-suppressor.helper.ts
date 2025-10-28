/**
 * Helper para suprimir errores de red en consola cuando el dispositivo se desconecta
 * Esto evita que se muestren errores innecesarios en la app cuando hay problemas de conexión
 */

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

/**
 * Verifica si un mensaje de error es relacionado con la red
 */
const isNetworkRelatedError = (...args: any[]): boolean => {
  const message = args.join(' ').toLowerCase();
  
  return (
    message.includes('network error') ||
    message.includes('network request failed') ||
    message.includes('econnaborted') ||
    message.includes('err_network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('failed to fetch')
  );
};

/**
 * Inicializa el supresor de errores de red
 * Debe llamarse una sola vez al inicio de la aplicación
 */
export const initializeErrorSuppressor = () => {
  // Sobrescribir console.error para filtrar errores de red
  console.error = (...args: any[]) => {
    if (!isNetworkRelatedError(...args)) {
      originalConsoleError.apply(console, args);
    }
    // Los errores de red se ignoran silenciosamente
  };

  // Sobrescribir console.warn para filtrar advertencias de red
  console.warn = (...args: any[]) => {
    if (!isNetworkRelatedError(...args)) {
      originalConsoleWarn.apply(console, args);
    }
    // Las advertencias de red se ignoran silenciosamente
  };
};

/**
 * Restaura los métodos originales de console
 * Útil para debugging si necesitas ver todos los errores
 */
export const restoreConsole = () => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
};

