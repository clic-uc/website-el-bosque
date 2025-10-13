import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mapsService } from '../services/api.service';
import { queryKeys } from '../lib/query-client';
import type { CreateMapDto, UpdateMapDto } from '../types/api.types';

/**
 * Hook para obtener todos los mapas
 */
export const useMaps = () => {
  return useQuery({
    queryKey: queryKeys.maps.lists(),
    queryFn: mapsService.getAll,
  });
};

/**
 * Hook para obtener un mapa por ID
 */
export const useMap = (id: number) => {
  return useQuery({
    queryKey: queryKeys.maps.detail(id),
    queryFn: () => mapsService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook para crear un mapa
 */
export const useCreateMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMapDto) => mapsService.create(dto),
    onSuccess: () => {
      // Invalidar la lista de mapas para refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.lists() });
    },
  });
};

/**
 * Hook para actualizar un mapa
 */
export const useUpdateMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateMapDto }) =>
      mapsService.update(id, dto),
    onSuccess: (data) => {
      // Invalidar el detalle del mapa
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.detail(data.id) });
      // Invalidar la lista de mapas
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.lists() });
    },
  });
};

/**
 * Hook para eliminar un mapa
 */
export const useDeleteMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => mapsService.delete(id),
    onSuccess: () => {
      // Invalidar la lista de mapas
      queryClient.invalidateQueries({ queryKey: queryKeys.maps.lists() });
    },
  });
};
