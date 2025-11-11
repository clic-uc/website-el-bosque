/**
 * Backend API Types
 * Tipos que coinciden con las entidades del backend
 */

// Enums
export enum Department {
  EDIFICACION = 'Edificacion',
  EJECUCION = 'Ejecucion',
  EMERGENCIAS = 'Emergencias',
  VIVIENDA = 'Vivienda',
}

// Entities
export interface MapEntity {
  id: number;
  key: string;
  department: Department;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  roleId: string;
  lat?: number;
  lon?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAttribute {
  id: number;
  recordId: number;
  mapId: number;
  attributes: Record<string, unknown>;
  map?: MapEntity;
  createdAt: string;
  updatedAt: string;
}

export interface GeographicalRecord {
  id: number;
  lat: number;
  lon: number;
  summary?: string;
  role?: Role; // El roleId viene dentro de role.roleId
  recordAttributes?: RecordAttribute[];
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface CreateMapDto {
  key: string;
  department: Department;
  attributes: Record<string, unknown>;
}

export interface UpdateMapDto {
  key?: string;
  department?: Department;
  attributes?: Record<string, unknown>;
}

export interface CreateRoleDto {
  roleId: string;
  lat?: number;
  lon?: number;
  description?: string;
}

export interface UpdateRoleDto {
  lat?: number;
  lon?: number;
  description?: string;
}

export interface CreateRecordDto {
  roleId?: string;
  lat?: number;
  lon?: number;
  summary?: string;
  recordAttributes?: Array<{
    mapId: number;
    attributes: Record<string, unknown>;
  }>;
}

export interface UpdateRecordDto {
  roleId?: string;
  lat?: number;
  lon?: number;
  summary?: string;
  recordAttributes?: Array<{
    mapId: number;
    attributes: Record<string, unknown>;
  }>;
}

export interface UpdateRecordAttributeDto {
  attributes: Record<string, unknown>;
}

// Query Params
export interface RecordsQueryParams {
  search?: string;
  mapId?: number;
  hasCoordinates?: boolean; // Filtrar solo records con coordenadas válidas (lat y lon no nulos)
  page?: number; 
  limit?: number;
  filters?: string
}

export interface PaginatedRecordsParams extends Omit<RecordsQueryParams, 'page' | 'limit'> {
  page: number;
  limit: number;
}

// Pagination (Legacy - no longer used, backend returns all records in one call)
// export interface PaginationMeta {
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
//   hasNextPage: boolean;
//   hasPreviousPage: boolean;
// }

// export interface PaginatedResponse<T> {
//   data: T[];
//   meta: PaginationMeta;
// }

// Import/Bulk
export interface BulkImportSummary {
  totalRows: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export interface SeedSummary {
  maps: {
    created: number;
    updated: number;
    skipped: number;
  };
  roles: {
    created: number;
    updated: number;
    skipped: number;
  };
  records: {
    created: number;
    skipped: number;
  };
}
