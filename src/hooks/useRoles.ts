import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService } from '../services/api.service';
import { queryKeys } from '../lib/query-client';
import type { CreateRoleDto, UpdateRoleDto, PaginationQueryParams } from '../types/api.types';

/**
 * Hook para obtener roles paginados
 */
export const useRoles = (params?: PaginationQueryParams) => {
  return useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: () => rolesService.getAll(params),
  });
};

/**
 * Hook para obtener un role por roleId
 */
export const useRole = (roleId: string) => {
  return useQuery({
    queryKey: queryKeys.roles.detail(roleId),
    queryFn: () => rolesService.getById(roleId),
    enabled: !!roleId,
  });
};

/**
 * Hook para crear un role
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateRoleDto) => rolesService.create(dto),
    onSuccess: () => {
      // Invalidar todas las listas de roles
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

/**
 * Hook para actualizar un role
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, dto }: { roleId: string; dto: UpdateRoleDto }) =>
      rolesService.update(roleId, dto),
    onSuccess: (data) => {
      // Invalidar el detalle del role
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(data.roleId) });
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

/**
 * Hook para eliminar un role
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => rolesService.delete(roleId),
    onSuccess: () => {
      // Invalidar todas las listas de roles
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

/**
 * Hook para importar roles desde CSV
 */
export const useImportRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => rolesService.importFromCsv(file),
    onSuccess: () => {
      // Invalidar todas las listas de roles después de importar
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};
