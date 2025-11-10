/**
 * API Configuration
 * Centraliza la configuración de la API del backend
 */

export const API_CONFIG = {
  // Base URL del backend - cambiar según entorno
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // Timeout por defecto (ms)
  timeout: 120000,
  
  // Headers por defecto
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

export const API_ENDPOINTS = {
  // Maps
  maps: '/maps',
  mapById: (id: number) => `/maps/${id}`,
  
  // Roles
  roles: '/roles',
  roleById: (roleId: string) => `/roles/${roleId}`,
  rolesImport: '/roles/import/coordinates',
  
  // Records
  records: '/records',
  recordById: (id: number) => `/records/${id}`,
  recordsImport: (mapId: number, delimiter: string) => `/records/import/map/${mapId}?delimiter=${encodeURIComponent(delimiter)}`,
  filtersForMap: (mapId: number) => `/records/filters/map/${mapId}`,

  // Seeds
  seedsRun: '/seeds/run',
  seedsSummary: '/seeds/summary',
} as const;
