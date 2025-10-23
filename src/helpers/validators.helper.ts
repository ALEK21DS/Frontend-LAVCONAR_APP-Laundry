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
