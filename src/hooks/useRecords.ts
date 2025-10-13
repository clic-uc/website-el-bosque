import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordsService } from '../services/api.service';
import { queryKeys } from '../lib/query-client';
import type { CreateRecordDto, UpdateRecordDto, PaginationQueryParams } from '../types/api.types';

/**
 * Hook para obtener records paginados
 */
export const useRecords = (params?: PaginationQueryParams) => {
  return useQuery({
    queryKey: queryKeys.records.list(params),
    queryFn: () => recordsService.getAll(params),
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
    mutationFn: ({ mapId, file }: { mapId: number; file: File }) =>
      recordsService.importForMap(mapId, file),
    onSuccess: () => {
      // Invalidar todas las listas de records después de importar
      queryClient.invalidateQueries({ queryKey: queryKeys.records.lists() });
    },
  });
};
