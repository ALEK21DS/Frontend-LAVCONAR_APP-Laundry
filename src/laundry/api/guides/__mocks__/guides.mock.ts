import { Guide } from '@/laundry/interfaces/guides/guides.interface';

export const mockGuides: Guide[] = [
  {
    id: 'guide-001',
    guide_number: 'G-2024-001',
    client_id: 'client-001',
    client_name: 'Hotel Imperial Plaza',
    branch_office_id: 'sucursal-centro-001',
    branch_office_name: 'Sucursal Centro',
    general_condition: 'GOOD',
    service_type: 'HOTEL',
    charge_type: 'BY_WEIGHT',
    total_weight: 45.5,
    total_garments: 120,
    collection_date: new Date().toISOString(),
    delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'IN_PROCESS',
    notes: 'Servicio urgente - entrega en 48 horas',
    items: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'guide-002',
    guide_number: 'G-2024-002',
    client_id: 'client-002',
    client_name: 'Restaurante La Plaza Gourmet',
    branch_office_id: 'sucursal-norte-002',
    branch_office_name: 'Sucursal Norte',
    general_condition: 'REGULAR',
    service_type: 'INDUSTRIAL',
    charge_type: 'BY_UNIT',
    total_weight: 28.3,
    total_garments: 85,
    collection_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
    notes: 'Uniformes de cocina',
    items: [],
    is_active: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'guide-003',
    guide_number: 'G-2024-003',
    client_id: 'client-003',
    client_name: 'Clínica San José Medical Center',
    branch_office_id: 'sucursal-sur-003',
    branch_office_name: 'Sucursal Sur',
    general_condition: 'GOOD',
    service_type: 'HOSPITAL',
    charge_type: 'BY_WEIGHT',
    total_weight: 62.8,
    total_garments: 200,
    collection_date: new Date().toISOString(),
    status: 'COLLECTED',
    notes: 'Ropa hospitalaria - protocolo especial de desinfección',
    items: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'guide-004',
    guide_number: 'G-2024-004',
    client_id: 'client-004',
    client_name: 'Spa Wellness & Relax',
    branch_office_id: 'sucursal-este-004',
    branch_office_name: 'Sucursal Este',
    general_condition: 'GOOD',
    service_type: 'INDUSTRIAL',
    charge_type: 'MIXED',
    total_weight: 18.5,
    total_garments: 65,
    collection_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'DELIVERED',
    notes: 'Toallas y batas de spa',
    items: [],
    is_active: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'guide-005',
    guide_number: 'G-2024-005',
    client_id: 'client-005',
    client_name: 'Hotel Plaza Suites & Spa',
    branch_office_id: 'sucursal-centro-001',
    branch_office_name: 'Sucursal Centro',
    general_condition: 'REGULAR',
    service_type: 'HOTEL',
    charge_type: 'BY_WEIGHT',
    total_weight: 51.2,
    total_garments: 145,
    collection_date: new Date().toISOString(),
    status: 'IN_TRANSIT',
    notes: 'Sábanas, toallas y mantelería',
    items: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Función para obtener guías mock
export const getMockGuides = (): Guide[] => {
  return mockGuides;
};

// Función para obtener guías de hoy
export const getMockTodayGuides = (): Guide[] => {
  const today = new Date().toISOString().split('T')[0];
  return mockGuides.filter(guide => guide.created_at.startsWith(today));
};

// Función para buscar guía mock por ID
export const getMockGuideById = (id: string): Guide | undefined => {
  return mockGuides.find(guide => guide.id === id);
};

// Función para filtrar por estado
export const getMockGuidesByStatus = (
  status: 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_PROCESS' | 'COMPLETED' | 'DELIVERED'
): Guide[] => {
  return mockGuides.filter(guide => guide.status === status);
};
