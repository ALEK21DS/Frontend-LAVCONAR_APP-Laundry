export const SUCURSALES = [
  { label: 'Sucursal Centro', value: 'sucursal-centro-001' },
  { label: 'Sucursal Norte', value: 'sucursal-norte-002' },
  { label: 'Sucursal Sur', value: 'sucursal-sur-003' },
  { label: 'Sucursal Este', value: 'sucursal-este-004' },
  { label: 'Sucursal Oeste', value: 'sucursal-oeste-005' },
];

export const getSucursalLabel = (value: string): string => {
  const sucursal = SUCURSALES.find(s => s.value === value);
  return sucursal?.label || 'Desconocida';
};
