// NOTA: Estas constantes son solo para fallback o modo demo
// En producción, las sucursales se cargan dinámicamente desde el backend
// usando useBranchOffices() hook
export const SUCURSALES = [
  { label: 'Sucursal Cuenca', value: '5643229f-820c-4767-97c9-7a441590032d' },
  { label: 'Sucursal Guayaquil Centro', value: 'c08a124e-3196-461f-9449-bd59a788e7eb' },
  { label: 'Sucursal Principal - Quito Norte', value: '015bb288-9b43-4125-8f25-652dec6c22a4' },
];

export const getSucursalLabel = (value: string): string => {
  const sucursal = SUCURSALES.find(s => s.value === value);
  return sucursal?.label || 'Desconocida';
};
