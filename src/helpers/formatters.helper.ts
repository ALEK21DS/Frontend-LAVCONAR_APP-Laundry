export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

/**
 * Formatea una fecha en formato español
 * @param dateString - Fecha en formato string o Date
 * @param includeTime - Si incluir la hora (por defecto false)
 * @returns Fecha formateada en español
 */
export const formatDate = (dateString: Date | string, includeTime: boolean = false): string => {
  try {
    const date = new Date(dateString);

    if (includeTime) {
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    return 'Fecha no disponible';
  }
};

/**
 * Formatea fecha y hora completa en español
 * @param dateString - Fecha en formato string o Date
 * @returns Fecha y hora formateada
 */
export const formatDateTime = (dateString: Date | string): string => {
  return formatDate(dateString, true);
};

/**
 * Formatea solo la fecha sin hora en español
 * @param dateString - Fecha en formato string o Date
 * @returns Fecha formateada sin hora
 */
export const formatDateOnly = (dateString: Date | string): string => {
  return formatDate(dateString, false);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatGuideNumber = (number: number): string => {
  return `GU-${String(number).padStart(6, '0')}`;
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
};
