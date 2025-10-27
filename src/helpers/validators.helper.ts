// ========== VALIDACIONES GENÉRICAS ==========

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

// ========== VALIDACIONES NUMÉRICAS ==========

/**
 * Valida que un string contenga solo un número entero válido y no negativo
 */
export const isValidInteger = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 0 && value === num.toString();
};

/**
 * Valida que un string contenga solo un número decimal válido y no negativo
 */
export const isValidDecimal = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && /^[0-9]+(\.[0-9]+)?$/.test(value);
};

/**
 * Valida que un número sea positivo (mayor a 0)
 */
export const isPositive = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Valida que un número sea no negativo (mayor o igual a 0)
 */
export const isNonNegative = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= 0;
};

/**
 * Convierte un string a entero de forma segura
 * Retorna undefined si no es válido
 */
export const safeParseInt = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
};

/**
 * Convierte un string a decimal de forma segura
 * Retorna undefined si no es válido
 */
export const safeParseFloat = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

// ========== SANITIZACIÓN ==========

/**
 * Sanitiza un string numérico para permitir solo números
 */
export const sanitizeNumericInput = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

/**
 * Sanitiza un string decimal para permitir solo números y punto
 */
export const sanitizeDecimalInput = (value: string): string => {
  // Remover todo excepto números y punto
  let cleaned = value.replace(/[^0-9.]/g, '');
  
  // Permitir solo un punto decimal
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return cleaned;
};

// ========== VALIDACIONES DE FECHAS ==========

/**
 * Valida que una fecha en formato dd/mm/yyyy sea válida
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString || dateString.length !== 10) return false;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return false;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  // Validar rangos básicos
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Crear fecha y verificar que sea válida
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// ========== VALIDACIONES DE FORMULARIOS COMPLETOS ==========

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateClientData = (data: {
  name: string;
  email: string;
  identification_number: string;
  phone?: string;
  address?: string;
  acronym?: string;
}): ValidationResult => {
  if (!validateRequired(data.name)) {
    return { isValid: false, error: 'El nombre es requerido' };
  }

  if (!validateMinLength(data.name, 3)) {
    return { isValid: false, error: 'El nombre debe tener al menos 3 caracteres' };
  }

  if (!validateRequired(data.email)) {
    return { isValid: false, error: 'El email es requerido' };
  }

  if (!validateEmail(data.email)) {
    return { isValid: false, error: 'El email no es válido' };
  }

  if (!validateRequired(data.identification_number)) {
    return { isValid: false, error: 'La cédula/RUC es requerida' };
  }

  if (!validateMinLength(data.identification_number, 10)) {
    return { isValid: false, error: 'La cédula/RUC debe tener al menos 10 caracteres' };
  }

  if (!data.phone || !validateRequired(data.phone)) {
    return { isValid: false, error: 'El teléfono es requerido' };
  }

  if (!validateMinLength(data.phone, 7)) {
    return { isValid: false, error: 'El teléfono debe tener al menos 7 dígitos' };
  }

  if (!data.address || !validateRequired(data.address)) {
    return { isValid: false, error: 'La dirección es requerida' };
  }

  if (!validateMinLength(data.address, 5)) {
    return { isValid: false, error: 'La dirección debe tener al menos 5 caracteres' };
  }

  if (!data.acronym || !validateRequired(data.acronym)) {
    return { isValid: false, error: 'El acrónimo es requerido' };
  }

  if (!validateMinLength(data.acronym, 2)) {
    return { isValid: false, error: 'El acrónimo debe tener al menos 2 caracteres' };
  }

  return { isValid: true };
};

export const validateLoginData = (data: {
  username: string;
  password: string;
  sucursalId: string;
}): ValidationResult => {
  if (!validateRequired(data.username)) {
    return { isValid: false, error: 'Usuario requerido' };
  }

  if (!validateRequired(data.password)) {
    return { isValid: false, error: 'Contraseña requerida' };
  }

  if (!validateRequired(data.sucursalId)) {
    return { isValid: false, error: 'Selecciona una sucursal' };
  }

  return { isValid: true };
};
