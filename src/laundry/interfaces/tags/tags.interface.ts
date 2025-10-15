export interface Tag {
  id: string;
  epc: string;
  clientId?: string;
  clientNombre?: string;
  proceso?: string;
  descripcion?: string;
  status: 'disponible' | 'asignado' | 'en_proceso' | 'terminado';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterTagDto {
  epc: string;
  clientId: string;
  proceso: string;
  descripcion?: string;
}

export interface UpdateTagDto {
  proceso?: string;
  descripcion?: string;
  status?: 'disponible' | 'asignado' | 'en_proceso' | 'terminado';
}

export interface TagsResponse {
  tags: Tag[];
  total: number;
}

export interface ScannedTag {
  epc: string;
  rssi?: number;
  timestamp: number;
}
