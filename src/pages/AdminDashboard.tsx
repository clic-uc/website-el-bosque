import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { getRoleLabel, isAdmin, useCurrentRole } from '../auth/role';
import type { Roles } from '../types/globals';
import { SearchUsers, type UserItem } from '../features/admin/SearchUsers';
import { RoleActions } from '../features/admin/RoleActions';
import { apiClient } from '../lib/api-client';

type Feedback = { type: 'info' | 'error'; message: string };

type RosterResponse = {
  data: UserItem[];
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    nextOffset?: number;
    prevOffset?: number;
  };
};

type PaginationState = {
  total?: number;
  limit: number;
  offset: number;
  hasMore?: boolean;
  nextOffset?: number;
  prevOffset?: number;
};

const PAGE_SIZE = 20;

export default function AdminDashboard() {
  const { isLoaded } = useUser();
  const role = useCurrentRole();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [viewState, setViewState] = useState<'roster' | 'search'>('roster');
  const [searchSession, setSearchSession] = useState(0);

  const fetchRoster = useCallback(async (requestedOffset = 0) => {
    setLoading(true);
    setFeedback(null);
    setViewState('roster');
    try {
      const { data: response } = await apiClient.get<RosterResponse>(
        `/admin/users/all?limit=${PAGE_SIZE}&offset=${requestedOffset}`,
      );

      const meta = response.meta ?? {};
      const resolvedMeta: PaginationState = {
        limit:
          typeof meta.limit === 'number' && !Number.isNaN(meta.limit)
            ? meta.limit
            : PAGE_SIZE,
        offset:
          typeof meta.offset === 'number' && !Number.isNaN(meta.offset)
            ? meta.offset
            : requestedOffset,
        total:
          typeof meta.total === 'number' && !Number.isNaN(meta.total)
            ? meta.total
            : undefined,
        hasMore:
          'hasMore' in meta
            ? Boolean((meta as { hasMore?: boolean }).hasMore)
            : undefined,
        nextOffset:
          typeof meta.nextOffset === 'number' && !Number.isNaN(meta.nextOffset)
            ? meta.nextOffset
            : undefined,
        prevOffset:
          typeof meta.prevOffset === 'number' && !Number.isNaN(meta.prevOffset)
            ? meta.prevOffset
            : undefined,
      };

      setUsers(response.data);
      setPagination(resolvedMeta);
    } catch (error) {
      console.error('[Admin] Failed to fetch roster', error);
      setFeedback({
        type: 'error',
        message:
          'No pudimos cargar el listado general. Intenta nuevamente en unos segundos.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoster(0);
  }, [fetchRoster]);

  const handleRoleChange = (userId: string, nextRole: Roles | null) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              role: nextRole,
            }
          : user,
      ),
    );

    setFeedback({
      type: 'info',
      message: nextRole
        ? `El rol se actualizó a "${getRoleLabel(nextRole)}".`
        : 'El rol fue removido correctamente.',
    });
  };

  const handleResetRoster = () => {
    setSearchSession((prev) => prev + 1);
    void fetchRoster(0);
  };

  const resolvedPagination: PaginationState = pagination ?? {
    limit: PAGE_SIZE,
    offset: 0,
  };
  const { limit, offset, total, hasMore, nextOffset, prevOffset } =
    resolvedPagination;

  const canGoPrev = viewState === 'roster' && offset > 0;
  const computedNextOffset = nextOffset ?? offset + limit;
  const computedPrevOffset = prevOffset ?? Math.max(offset - limit, 0);
  const canGoNext =
    viewState === 'roster' &&
    (typeof hasMore === 'boolean'
      ? hasMore
      : total !== undefined
      ? offset + limit < total
      : users.length >= limit);

  const showingStart = offset + 1;
  const showingEnd = offset + users.length;

  if (!isLoaded) return null;

  return (
    <>
      <SignedOut>
        <main className="flex min-h-screen w-screen items-center justify-center bg-slate-100 px-4">
          <p className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700 shadow-sm">
            Debes iniciar sesión para acceder a este panel.
          </p>
        </main>
      </SignedOut>

      <SignedIn>
        {!isAdmin(role) ? (
          <main className="flex min-h-screen w-screen items-center justify-center bg-slate-100 px-4">
            <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
              <h1 className="text-2xl font-semibold text-slate-900">
                Sin acceso
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Esta sección es exclusiva para perfiles administradores. Si
                crees que es un error, comunícate con el equipo gestor.
              </p>
              <Link
                to="/maps"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Volver al mapa
              </Link>
            </section>
          </main>
        ) : (
          <main className="min-h-screen w-screen bg-slate-100 text-slate-900">
            <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12 lg:px-8">
              <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Municipalidad de El Bosque
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Panel de administración
                  </h1>
                  <p className="text-sm text-slate-600">
                    Gestiona los roles de los equipos vinculados al portal
                    territorial.
                  </p>
                </div>
                <Link
                  to="/maps"
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Volver al mapa
                </Link>
              </header>

              <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Buscar personas
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Utiliza nombre o correo para localizar a la persona que
                      necesitas actualizar.
                    </p>
                  </div>

                  <SearchUsers
                    key={searchSession}
                    onResults={(results) => {
                      setUsers(results);
                      setViewState('search');
                      setPagination(null);

                      if (results.length === 0) {
                        setFeedback({
                          type: 'info',
                          message:
                            'No encontramos resultados para esa búsqueda.',
                        });
                      } else {
                        setFeedback(null);
                      }
                    }}
                    loading={loading}
                    setLoading={setLoading}
                    onSearchStart={() => {
                      setFeedback(null);
                    }}
                    onError={(message) => {
                      setFeedback({ type: 'error', message });
                    }}
                  />

                  {feedback ? (
                    <div
                      className={[
                        'rounded-xl px-4 py-3 text-sm',
                        feedback.type === 'error'
                          ? 'border border-red-200 bg-red-50 text-red-700'
                          : 'border border-blue-100 bg-blue-50 text-blue-700',
                      ].join(' ')}
                    >
                      {feedback.message}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="mt-10 flex-1 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {viewState === 'search'
                      ? 'Resultados de la búsqueda'
                      : 'Listado general'}
                  </h2>
                  {viewState === 'search' ? (
                    <button
                      type="button"
                      onClick={handleResetRoster}
                      className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Ver listado general
                    </button>
                  ) : null}
                </div>

                {loading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
                    Cargando usuarios...
                  </div>
                ) : null}

                {!loading && users.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No hay usuarios disponibles en este momento.
                  </p>
                ) : null}

                <div className="grid gap-4">
                  {users.map((user) => {
                    const fullName =
                      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                      'Sin nombre';
                    const roleLabel = getRoleLabel(user.role);

                    return (
                      <article
                        key={user.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {fullName}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {user.email ?? 'Sin correo registrado'}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
                            {roleLabel}
                          </span>
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <RoleActions
                            user={user}
                            onChanged={(nextRole) =>
                              handleRoleChange(user.id, nextRole)
                            }
                            onError={(message) =>
                              setFeedback({ type: 'error', message })
                            }
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                {viewState === 'roster' && users.length > 0 ? (
                  <footer className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      Mostrando {showingStart}-{showingEnd}
                      {total !== undefined ? ` de ${total}` : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchRoster(computedPrevOffset)}
                        disabled={!canGoPrev}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchRoster(computedNextOffset)}
                        disabled={!canGoNext}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </footer>
                ) : null}
              </section>
            </div>
          </main>
        )}
      </SignedIn>
    </>
  );
}
