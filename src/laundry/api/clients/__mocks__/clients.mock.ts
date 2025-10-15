import { Client } from '@/laundry/interfaces/clients/clients.interface';

export const mockClients: Client[] = [
  {
    id: 'client-001',
    name: 'Hotel Imperial Plaza',
    email: 'contacto@hotelimperial.com',
    identification_number: '1792345678001',
    phone: '+593 98 765 4321',
    address: 'Av. Amazonas N24-123 y Colón, Quito',
    acronym: 'HIP',
    branch_office_id: 'sucursal-centro-001',
    branch_office_name: 'Sucursal Centro',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'client-002',
    name: 'Restaurante La Plaza Gourmet',
    email: 'admin@laplazagourmet.com',
    identification_number: '1791234567001',
    phone: '+593 99 123 4567',
    address: 'Calle García Moreno 456, Centro Histórico',
    acronym: 'LPG',
    branch_office_id: 'sucursal-norte-002',
    branch_office_name: 'Sucursal Norte',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-02-10T14:20:00Z',
    updated_at: '2024-02-10T14:20:00Z',
  },
  {
    id: 'client-003',
    name: 'Clínica San José Medical Center',
    email: 'administracion@clinicasanjose.com',
    identification_number: '1790123456001',
    phone: '+593 97 234 5678',
    address: 'Av. 6 de Diciembre N34-567, Quito',
    acronym: 'CSJMC',
    branch_office_id: 'sucursal-sur-003',
    branch_office_name: 'Sucursal Sur',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-03-05T09:15:00Z',
    updated_at: '2024-03-05T09:15:00Z',
  },
  {
    id: 'client-004',
    name: 'Spa Wellness & Relax',
    email: 'info@spawellness.com',
    identification_number: '1793456789001',
    phone: '+593 96 345 6789',
    address: 'Av. González Suárez 789, La Floresta',
    acronym: 'SWR',
    branch_office_id: 'sucursal-este-004',
    branch_office_name: 'Sucursal Este',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-04-12T11:45:00Z',
    updated_at: '2024-04-12T11:45:00Z',
  },
  {
    id: 'client-005',
    name: 'Hotel Plaza Suites & Spa',
    email: 'reservas@hotelplaza.com',
    identification_number: '1794567890001',
    phone: '+593 95 456 7890',
    address: 'Av. República del Salvador N35-123',
    acronym: 'HPS',
    branch_office_id: 'sucursal-centro-001',
    branch_office_name: 'Sucursal Centro',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-05-20T16:00:00Z',
    updated_at: '2024-05-20T16:00:00Z',
  },
  {
    id: 'client-006',
    name: 'Gimnasio FitLife Premium',
    email: 'contacto@fitlifepremium.com',
    identification_number: '1795678901001',
    phone: '+593 94 567 8901',
    address: 'Av. Naciones Unidas E10-234',
    acronym: 'FLP',
    branch_office_id: 'sucursal-norte-002',
    branch_office_name: 'Sucursal Norte',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-06-08T13:30:00Z',
    updated_at: '2024-06-08T13:30:00Z',
  },
  {
    id: 'client-007',
    name: 'Corporación Textil Andina S.A.',
    email: 'ventas@textilandina.com',
    identification_number: '1796789012001',
    phone: '+593 93 678 9012',
    address: 'Parque Industrial Carcelén, Lote 45',
    acronym: 'CTA',
    branch_office_id: 'sucursal-sur-003',
    branch_office_name: 'Sucursal Sur',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-07-15T08:00:00Z',
    updated_at: '2024-07-15T08:00:00Z',
  },
  {
    id: 'client-008',
    name: 'Universidad Técnica Nacional',
    email: 'servicios@utn.edu.ec',
    identification_number: '1797890123001',
    phone: '+593 92 789 0123',
    address: 'Campus Universitario, Av. Occidental',
    acronym: 'UTN',
    branch_office_id: 'sucursal-este-004',
    branch_office_name: 'Sucursal Este',
    status: 'ACTIVE',
    is_active: true,
    created_at: '2024-08-22T10:15:00Z',
    updated_at: '2024-08-22T10:15:00Z',
  },
];

// Función para obtener clientes mock
export const getMockClients = (): Client[] => {
  return mockClients;
};

// Función para buscar cliente mock por ID
export const getMockClientById = (id: string): Client | undefined => {
  return mockClients.find(client => client.id === id);
};

// Función para buscar clientes mock
export const searchMockClients = (query: string): Client[] => {
  const lowerQuery = query.toLowerCase();
  return mockClients.filter(
    client =>
      client.name.toLowerCase().includes(lowerQuery) ||
      client.email.toLowerCase().includes(lowerQuery) ||
      client.identification_number.includes(lowerQuery)
  );
};
