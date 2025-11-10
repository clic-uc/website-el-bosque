import { apiClient } from '../lib/api-client';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  MapEntity,
  CreateMapDto,
  UpdateMapDto,
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  GeographicalRecord,
  CreateRecordDto,
  UpdateRecordDto,
  RecordsQueryParams,
  BulkImportSummary,
  SeedSummary,
} from '../types/api.types';

/**
 * Maps API Service
 */
export const mapsService = {
  getAll: async (): Promise<MapEntity[]> => {
    const { data } = await apiClient.get<MapEntity[]>(API_ENDPOINTS.maps);
    return data;
  },

  getById: async (id: number): Promise<MapEntity> => {
    const { data } = await apiClient.get<MapEntity>(API_ENDPOINTS.mapById(id));
    return data;
  },

  create: async (dto: CreateMapDto): Promise<MapEntity> => {
    const { data } = await apiClient.post<MapEntity>(API_ENDPOINTS.maps, dto);
    return data;
  },

  update: async (id: number, dto: UpdateMapDto): Promise<MapEntity> => {
    const { data } = await apiClient.patch<MapEntity>(API_ENDPOINTS.mapById(id), dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.mapById(id));
  },
};

/**
 * Roles API Service
 */
export const rolesService = {
  getAll: async (params?: RecordsQueryParams): Promise<Role[]> => {
    const { data } = await apiClient.get<Role[]>(API_ENDPOINTS.roles, {
      params,
    });
    return data;
  },

  getById: async (roleId: string): Promise<Role> => {
    const { data } = await apiClient.get<Role>(API_ENDPOINTS.roleById(roleId));
    return data;
  },

  create: async (dto: CreateRoleDto): Promise<Role> => {
    const { data } = await apiClient.post<Role>(API_ENDPOINTS.roles, dto);
    return data;
  },

  update: async (roleId: string, dto: UpdateRoleDto): Promise<Role> => {
    const { data } = await apiClient.patch<Role>(API_ENDPOINTS.roleById(roleId), dto);
    return data;
  },

  delete: async (roleId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.roleById(roleId));
  },

  importFromCsv: async (file: File): Promise<BulkImportSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<BulkImportSummary>(
      API_ENDPOINTS.rolesImport,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
};

/**
 * Records API Service
 */
export const recordsService = {
  getAll: async (params?: RecordsQueryParams): Promise<GeographicalRecord[]> => {
    const { data } = await apiClient.get<GeographicalRecord[]>(
      API_ENDPOINTS.records,
      { params }
    );
    return data;
  },

  getById: async (id: number): Promise<GeographicalRecord> => {
    const { data } = await apiClient.get<GeographicalRecord>(API_ENDPOINTS.recordById(id));
    return data;
  },

  create: async (dto: CreateRecordDto): Promise<GeographicalRecord> => {
    const { data } = await apiClient.post<GeographicalRecord>(API_ENDPOINTS.records, dto);
    return data;
  },

  update: async (id: number, dto: UpdateRecordDto): Promise<GeographicalRecord> => {
    const { data } = await apiClient.patch<GeographicalRecord>(
      API_ENDPOINTS.recordById(id),
      dto
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.recordById(id));
  },

  importForMap: async (mapId: number, file: File, delimiter: string): Promise<BulkImportSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<BulkImportSummary>(
      API_ENDPOINTS.recordsImport(mapId, delimiter),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  getFiltersForMap: async (mapId: number): Promise<Record<string, string | string[]>> => {
    const { data } = await apiClient.get<Record<string, string | string[]>>(
      API_ENDPOINTS.filtersForMap(mapId)
    );
    return data;
  }
};

/**
 * Seeds API Service
 */
export const seedsService = {
  run: async (): Promise<SeedSummary> => {
    const { data } = await apiClient.post<SeedSummary>(API_ENDPOINTS.seedsRun);
    return data;
  },

  getSummary: async (): Promise<SeedSummary> => {
    const { data } = await apiClient.get<SeedSummary>(API_ENDPOINTS.seedsSummary);
    return data;
  },
};
