import type { Roles } from '../types/globals';
import { useUser } from '@clerk/clerk-react';

export function useCurrentRole(): Roles | null {
  const { user } = useUser();
  return (user?.publicMetadata?.role as Roles | undefined) ?? null;
}

export const isAdmin = (r: Roles | null) => r === 'admin';
export const isEditor = (r: Roles | null) => r === 'editor';
export const isReader = (r: Roles | null) => r === 'reader';

export const ROLE_LABELS: Record<Roles, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  reader: 'Lector',
};

export const getRoleLabel = (role: string | null | undefined): string => {
  if (!role) return 'Sin rol';
  return ROLE_LABELS[role as Roles] ?? 'Sin rol';
};
