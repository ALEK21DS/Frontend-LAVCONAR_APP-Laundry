export const SUCURSALES = [
  { label: 'Sucursal Cuenca', value: 'sucursal-cuenca' },
  { label: 'Sucursal Guayaquil Centro', value: 'sucursal-guayaquil-centro' },
  { label: 'Sucursal Principal - Quito Norte', value: 'sucursal-principal-quito-norte' },
];

export const getSucursalLabel = (value: string): string => {
  const sucursal = SUCURSALES.find(s => s.value === value);
  return sucursal?.label || 'Desconocida';
};
