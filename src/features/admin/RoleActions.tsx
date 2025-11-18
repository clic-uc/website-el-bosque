import { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import type { Roles } from '../../types/globals';
import { ROLE_LABELS } from '../../auth/role';

type RoleActionsProps = {
  user: { id: string; role?: string | null };
  onChanged: (role: Roles | null) => void;
  onError?: (message: string) => void;
};

const ROLE_OPTIONS: Roles[] = ['admin', 'editor', 'reader'];

const BUTTON_BASE =
  'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export function RoleActions({ user, onChanged, onError }: RoleActionsProps) {
  const [pending, setPending] = useState<Roles | 'remove' | null>(null);
  const currentRole = (user.role ?? undefined) as Roles | undefined;

  const updateRole = async (role: Roles) => {
    if (pending) return;
    setPending(role);
    try {
      await apiClient.post('/admin/users/set-role', { id: user.id, role });
      onChanged(role);
    } catch (error) {
      console.error('[Admin] Failed to update user role', error);
      onError?.('No se pudo actualizar el rol. Intenta nuevamente.');
    } finally {
      setPending(null);
    }
  };

  const removeRole = async () => {
    if (pending) return;
    setPending('remove');
    try {
      await apiClient.post('/admin/users/remove-role', { id: user.id });
      onChanged(null);
    } catch (error) {
      console.error('[Admin] Failed to remove user role', error);
      onError?.('No se pudo quitar el rol. Intenta nuevamente.');
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ROLE_OPTIONS.map((role) => {
        const active = currentRole === role;

        return (
          <button
            key={role}
            type="button"
            onClick={() => updateRole(role)}
            disabled={pending !== null || active}
            aria-pressed={active}
            className={[
              BUTTON_BASE,
              active
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600',
            ].join(' ')}
          >
            {pending === role ? 'Guardando...' : `Asignar ${ROLE_LABELS[role]}`}
         </button>
       );
     })}
    </div>
  );
}
