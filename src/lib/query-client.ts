import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configuration for TanStack Query
 * Configuración global del cliente de queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" (5 minutos)
      staleTime: 5 * 60 * 1000,
      
      // Tiempo que los datos se mantienen en cache (10 minutos)
      gcTime: 10 * 60 * 1000,
      
      // Reintentar 1 vez en caso de error
      retry: 1,
      
      // No refetch automáticamente al hacer focus en la ventana
      // (útil para desarrollo, puedes cambiarlo en producción)
      refetchOnWindowFocus: false,
      
      // No refetch automáticamente al reconectar
      refetchOnReconnect: false,
    },
    mutations: {
      // Reintentar mutaciones fallidas 0 veces
      retry: 0,
    },
  },
});

/**
 * Query Keys Factory
 * Centraliza las keys para las queries y facilita invalidación
 */
export const queryKeys = {
  // Maps
  maps: {
    all: ['maps'] as const,
    lists: () => [...queryKeys.maps.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.maps.lists(), filters] as const,
    details: () => [...queryKeys.maps.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.maps.details(), id] as const,
  },
  
  // Roles
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) => 
      [...queryKeys.roles.lists(), params] as const,
    details: () => [...queryKeys.roles.all, 'detail'] as const,
    detail: (roleId: string) => [...queryKeys.roles.details(), roleId] as const,
  },
  
  // Records
  records: {
    all: ['records'] as const,
    lists: () => [...queryKeys.records.all, 'list'] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) => 
      [...queryKeys.records.lists(), params] as const,
    details: () => [...queryKeys.records.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.records.details(), id] as const,
  },
  
  // Seeds
  seeds: {
    all: ['seeds'] as const,
    summary: () => [...queryKeys.seeds.all, 'summary'] as const,
  },
} as const;
