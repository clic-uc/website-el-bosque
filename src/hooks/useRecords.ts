import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordsService } from '../services/api.service';
import { queryKeys } from '../lib/query-client';
import type { CreateRecordDto, UpdateRecordDto, RecordsQueryParams, PaginatedRecordsParams, GeographicalRecord } from '../types/api.types';

/**
 * Hook para obtener todos los records
 * Si params.mapId está definido, solo busca records de ese mapa
 * Si no hay mapId, la query está deshabilitada
 */
export const useRecords = (params?: RecordsQueryParams) => {
  // Solo hacer fetch si hay mapId válido, de lo contrario deshabilitar
  const enabled = !!params?.mapId && params.mapId > 0;
  
  return useQuery({
    queryKey: queryKeys.records.list(params),
    queryFn: () => recordsService.getAll(params),
    enabled,
  });
};

/**
 * Hook para obtener records paginados (para vista tabulada)
 */
export const useRecordsPaginated = (params: PaginatedRecordsParams) => {
  // Para paginación, requerir al menos page y limit
  const enabled = !!params?.page && !!params?.limit;
  
  return useQuery({
    queryKey: queryKeys.records.paginated(params), // Nueva key para cache separado
    queryFn: () => recordsService.getAll(params), // Backend detectará page/limit y paginará
    enabled,
  });
};

/**
 * Hook para obtener un record por ID
 */
export const useRecord = (id: number) => {
  return useQuery({
    queryKey: queryKeys.records.detail(id),
    queryFn: () => recordsService.getById(id),
    enabled: !!id && id > 0,
  });
};

/**
 * Hook para crear un record
 */
export const useCreateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateRecordDto) => recordsService.create(dto),
    onSuccess: () => {
      // Invalidar todas las listas de records
      queryClient.invalidateQueries({ queryKey: queryKeys.records.lists() });
    },
  });
};

/**
 * Hook para actualizar un record
 */
export const useUpdateRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateRecordDto }) =>
      recordsService.update(id, dto),
    onSuccess: (data) => {
      // Invalidar el detalle del record
      queryClient.invalidateQueries({ queryKey: queryKeys.records.detail(data.id) });
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: queryKeys.records.lists() });
    },
  });
};

/**
 * Hook para eliminar un record
 */
export const useDeleteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recordsService.delete(id),
    onSuccess: () => {
      // Invalidar todas las listas de records
      queryClient.invalidateQueries({ queryKey: queryKeys.records.lists() });
    },
  });
};

/**
 * Hook para importar records desde CSV para un mapa específico
 */
export const useImportRecords = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mapId, file, delimiter }: { mapId: number; file: File, delimiter: string }) =>
      recordsService.importForMap(mapId, file, delimiter),
    onSuccess: () => {
      // Invalidar todas las listas de records después de importar
      queryClient.invalidateQueries({ queryKey: queryKeys.records.lists() });
    },
  });
};

export const useRecordsFilters = (mapId: number) => {
  return useQuery({
    queryKey: queryKeys.records.filters(mapId),
    queryFn: () => {
      console.log("Querying filters for mapId:", mapId);
      return recordsService.getFiltersForMap(mapId)
    },
    enabled: !!mapId && mapId > 0,
  });
}

/**
 * Hook para conocer en qué mapas aparece un rol (según recordAttributes de records con ese roleId)
 */
export const useRolePresenceMaps = (roleId?: string) => {
  return useQuery({
    queryKey: ['role-presence', roleId],
    queryFn: async () => {
      if (!roleId) return [] as Array<{ id: number; name: string; department: string; count: number }>;    
      const all = await recordsService.getAll({ search: roleId });
      const records = Array.isArray(all) ? all : (all as unknown as GeographicalRecord[]);

      // Filtrar por coincidencia exacta de roleId (el backend usa prefijo)
      const exact = records.filter(r => r.role?.roleId === roleId);

      // Contar presencia por mapa desde recordAttributes
      const mapCounts = new Map<number, { id: number; name: string; department: string; count: number }>();
      exact.forEach(rec => {
        rec.recordAttributes?.forEach(ra => {
          const map = ra.map as unknown as { id: number; attributes: { name?: string }; department: string } | undefined;
          if (!map) return;
          const mapName = (map.attributes?.name as string) || `Mapa ${map.id}`;
          const existing = mapCounts.get(map.id);
          if (existing) {
            existing.count += 1;
          } else {
            mapCounts.set(map.id, { id: map.id, name: mapName, department: map.department, count: 1 });
          }
        });
      });

      return Array.from(mapCounts.values());
    },
    enabled: !!roleId && roleId.length > 0,
  });
}